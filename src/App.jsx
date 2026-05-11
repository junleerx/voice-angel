// src/App.jsx
// LiveTrans React UI (renderer)
// - Captures mic with getUserMedia + AudioContext, downsamples to 16 kHz PCM16,
//   ships chunks to the main process via IPC.
// - Receives final transcripts + translations from main and renders them as chat cards.
// - On stop, asks main to save the transcript as JSON.

import { useEffect, useRef, useState } from 'react';

const SPEAKER_PALETTE = [
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

const TARGET_SAMPLE_RATE = 16000;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [interim, setInterim] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [savedPath, setSavedPath] = useState('');

  const messagesRef = useRef([]);
  const scrollRef = useRef(null);

  // Audio pipeline refs
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);

  // Subscribe to IPC events
  useEffect(() => {
    if (!window.livetrans) {
      setError('Electron bridge not available. Run via `npm run dev`.');
      return;
    }
    const offMessage = window.livetrans.onMessage((msg) => {
      setMessages((prev) => {
        const next = [...prev, msg];
        messagesRef.current = next;
        return next;
      });
      setInterim(null);
    });
    const offInterim = window.livetrans.onInterim((msg) => setInterim(msg));
    const offStatus = window.livetrans.onStatus(({ connected }) =>
      setConnected(Boolean(connected))
    );
    const offError = window.livetrans.onError((m) => setError(String(m)));

    return () => {
      offMessage?.();
      offInterim?.();
      offStatus?.();
      offError?.();
    };
  }, []);

  // Auto-scroll bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, interim]);

  async function startMicCapture() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    streamRef.current = stream;

    // Some macOS devices ignore the requested sampleRate; we downsample manually.
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;

    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    const inputSampleRate = audioCtx.sampleRate;

    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const downsampled = downsample(input, inputSampleRate, TARGET_SAMPLE_RATE);
      const pcm16 = floatTo16BitPCM(downsampled);
      // Transfer the underlying ArrayBuffer to the main process via IPC.
      window.livetrans.sendAudioChunk(pcm16.buffer);
    };

    source.connect(processor);
    // Connect to destination via a muted gain so ScriptProcessor fires reliably
    // without feeding audio to speakers.
    const mute = audioCtx.createGain();
    mute.gain.value = 0;
    processor.connect(mute);
    mute.connect(audioCtx.destination);
  }

  function stopMicCapture() {
    try { processorRef.current?.disconnect(); } catch (_) {}
    try { sourceRef.current?.disconnect(); } catch (_) {}
    try { audioCtxRef.current?.close(); } catch (_) {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    processorRef.current = null;
    sourceRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
  }

  async function handleStart() {
    setError('');
    setSavedPath('');
    try {
      const res = await window.livetrans.startMeeting();
      if (!res?.ok) throw new Error('Failed to start Deepgram session.');
      await startMicCapture();
      setIsActive(true);
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
      stopMicCapture();
      await window.livetrans.stopMeeting().catch(() => {});
    }
  }

  async function handleStop() {
    stopMicCapture();
    await window.livetrans.stopMeeting();
    setIsActive(false);
    setInterim(null);

    const snapshot = messagesRef.current;
    if (snapshot.length > 0) {
      try {
        const res = await window.livetrans.saveTranscript(snapshot);
        if (res?.ok) setSavedPath(res.path);
      } catch (err) {
        setError(`Save failed: ${err.message}`);
      }
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100 font-sans text-slate-900">
      <Header
        isActive={isActive}
        connected={connected}
        onStart={handleStart}
        onStop={handleStop}
      />

      {error && (
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}
      {savedPath && !isActive && (
        <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-2 text-sm text-emerald-700">
          저장 완료: <span className="font-mono">{savedPath}</span>
        </div>
      )}

      <main
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-6 py-6"
      >
        {messages.length === 0 && !interim && (
          <EmptyState />
        )}

        {messages.map((m, i) => (
          <MessageCard key={i} msg={m} />
        ))}

        {interim && <InterimBubble msg={interim} />}
      </main>

      <footer className="border-t border-slate-200 bg-white/70 px-6 py-2 text-xs text-slate-500">
        {messages.length} messages · Deepgram Nova-3 · DeepL
      </footer>
    </div>
  );
}

function Header({ isActive, connected, onStart, onStop }) {
  return (
    <header
      className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div style={{ WebkitAppRegion: 'no-drag' }}>
        <h1 className="text-xl font-semibold tracking-tight">LiveTrans</h1>
        <p className="text-xs text-slate-500">
          {isActive
            ? connected
              ? '● Recording'
              : '○ Connecting…'
            : 'Ready'}
        </p>
      </div>
      <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        {!isActive ? (
          <button
            onClick={onStart}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600 active:bg-emerald-700"
          >
            미팅 시작
          </button>
        ) : (
          <button
            onClick={onStop}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-600 active:bg-rose-700"
          >
            미팅 종료 & 저장
          </button>
        )}
      </div>
    </header>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center text-center">
      <div className="max-w-sm text-slate-400">
        <p className="text-sm">
          상단의 <span className="font-medium text-slate-600">미팅 시작</span>{' '}
          버튼을 눌러 녹음과 실시간 번역을 시작하세요.
        </p>
      </div>
    </div>
  );
}

function MessageCard({ msg }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${speakerColor(msg.speaker)}`}
        >
          {msg.speaker}
        </span>
        <span className="text-xs text-slate-400">
          {formatTime(msg.timestamp)}
        </span>
      </div>
      <p className="mt-2 text-base leading-relaxed text-slate-900">
        {msg.original}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        {msg.translation}
      </p>
    </div>
  );
}

function InterimBubble({ msg }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {msg.speaker} · 인식 중…
        </span>
      </div>
      <p className="mt-1 italic text-slate-500">{msg.original}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────────────
function speakerColor(speakerLabel) {
  const n = parseInt(String(speakerLabel).replace(/\D/g, ''), 10) || 0;
  return SPEAKER_PALETTE[n % SPEAKER_PALETTE.length];
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return '';
  }
}

function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function downsample(buffer, inputRate, targetRate) {
  if (targetRate === inputRate) return buffer;
  if (targetRate > inputRate) {
    throw new Error('targetRate must be <= inputRate');
  }
  const ratio = inputRate / targetRate;
  const newLength = Math.floor(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < newLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (
      let i = offsetBuffer;
      i < nextOffsetBuffer && i < buffer.length;
      i++
    ) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}
