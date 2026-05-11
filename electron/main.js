// electron/main.js
// LiveTrans - Electron main process
// - Owns Deepgram WebSocket (Nova-3, multi, diarize, interim)
// - Owns DeepL HTTP calls (only on is_final)
// - Holds API keys (.env). Renderer never sees them.
// - Bridges audio (renderer mic -> Deepgram) and results (DG -> renderer) via IPC.

const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, dialog, systemPreferences } = require('electron');
const WebSocket = require('ws');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';

let mainWindow = null;
let deepgramWs = null;
let meetingActive = false;
let keepAliveTimer = null;

// ────────────────────────────────────────────────────────────────────────────
// Window
// ────────────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: '#f1f5f9',
    titleBarStyle: 'hiddenInset',
    title: 'LiveTrans',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    closeDeepgram();
  });
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    try {
      const granted = await systemPreferences.askForMediaAccess('microphone');
      if (!granted) {
        dialog.showErrorBox(
          'Microphone permission required',
          'LiveTrans needs microphone access to transcribe meetings. Enable it in System Settings → Privacy & Security → Microphone.'
        );
      }
    } catch (err) {
      console.error('Mic permission error:', err);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeDeepgram();
  if (process.platform !== 'darwin') app.quit();
});

// ────────────────────────────────────────────────────────────────────────────
// Deepgram WebSocket
// ────────────────────────────────────────────────────────────────────────────
function openDeepgram() {
  if (!DEEPGRAM_API_KEY) {
    send('livetrans:error', 'DEEPGRAM_API_KEY is not set in .env');
    return null;
  }

  const params = new URLSearchParams({
    model: 'nova-3',
    language: 'multi',
    interim_results: 'true',
    diarize: 'true',
    smart_format: 'true',
    punctuate: 'true',
    encoding: 'linear16',
    sample_rate: '16000',
    channels: '1',
  });

  const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

  const ws = new WebSocket(url, {
    headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` },
  });

  ws.on('open', () => {
    send('livetrans:status', { connected: true });
    // Deepgram disconnects idle sockets; send KeepAlive every ~8s.
    keepAliveTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 8000);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleDeepgramMessage(msg);
    } catch (err) {
      console.error('DG parse error:', err);
    }
  });

  ws.on('error', (err) => {
    console.error('Deepgram WS error:', err);
    send('livetrans:error', `Deepgram: ${err.message}`);
  });

  ws.on('close', () => {
    send('livetrans:status', { connected: false });
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  });

  return ws;
}

function closeDeepgram() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  if (deepgramWs) {
    try {
      if (deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.send(JSON.stringify({ type: 'CloseStream' }));
      }
      deepgramWs.close();
    } catch (_) {}
    deepgramWs = null;
  }
  meetingActive = false;
}

async function handleDeepgramMessage(msg) {
  if (msg.type !== 'Results') return;

  const alt = msg.channel?.alternatives?.[0];
  if (!alt) return;
  const transcript = (alt.transcript || '').trim();
  if (!transcript) return;

  const words = alt.words || [];
  const speakerIdx = words[0]?.speaker ?? 0;
  const detectedLang =
    (alt.languages && alt.languages[0]) ||
    msg.channel?.detected_language ||
    'en';

  if (!msg.is_final) {
    // Interim: only show in UI, do NOT translate.
    send('livetrans:interim', {
      speaker: `Speaker ${speakerIdx}`,
      original: transcript,
      language: detectedLang,
    });
    return;
  }

  // Final: translate via DeepL.
  let translation = '';
  try {
    translation = await translateWithDeepL(transcript, deepLTargetFor(detectedLang));
  } catch (err) {
    console.error('DeepL error:', err);
    translation = `(translation failed: ${err.message})`;
  }

  send('livetrans:message', {
    speaker: `Speaker ${speakerIdx}`,
    original: transcript,
    translation,
    language: detectedLang,
    timestamp: new Date().toISOString(),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// DeepL
// ────────────────────────────────────────────────────────────────────────────
function deepLTargetFor(detectedLang) {
  const lang = String(detectedLang || '').toLowerCase();
  // Korean → English, everything else → Korean (covers en, multi, etc.)
  if (lang.startsWith('ko')) return 'EN-US';
  return 'KO';
}

async function translateWithDeepL(text, targetLang) {
  if (!DEEPL_API_KEY) throw new Error('DEEPL_API_KEY is not set in .env');

  const body = new URLSearchParams();
  body.append('text', text);
  body.append('target_lang', targetLang);

  const res = await fetch(DEEPL_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.translations?.[0]?.text || '';
}

// ────────────────────────────────────────────────────────────────────────────
// IPC
// ────────────────────────────────────────────────────────────────────────────
function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

ipcMain.handle('livetrans:start-meeting', () => {
  if (meetingActive) return { ok: true, alreadyActive: true };
  deepgramWs = openDeepgram();
  meetingActive = !!deepgramWs;
  return { ok: meetingActive };
});

ipcMain.handle('livetrans:stop-meeting', () => {
  closeDeepgram();
  return { ok: true };
});

ipcMain.on('livetrans:audio-chunk', (_event, chunk) => {
  if (deepgramWs && deepgramWs.readyState === WebSocket.OPEN) {
    // chunk is ArrayBuffer transferred from renderer
    deepgramWs.send(Buffer.from(chunk));
  }
});

ipcMain.handle('livetrans:save-transcript', async (_event, messages) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Meeting Transcript',
    defaultPath: `livetrans-${stamp}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };

  const payload = (messages || []).map((m) => ({
    speaker: m.speaker,
    original: m.original,
    translation: m.translation,
    timestamp: m.timestamp,
  }));

  await fs.promises.writeFile(result.filePath, JSON.stringify(payload, null, 2), 'utf8');
  return { ok: true, path: result.filePath };
});
