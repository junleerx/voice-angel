/**
 * Top control bar for the recording session.
 * Shows start/pause/resume/stop buttons, timer, and audio visualizer.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useRecordingStore } from '@/stores/recordingStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Timer } from './Timer';
import { AudioVisualizer } from './AudioVisualizer';
import type { AudioChunk } from '@/types/recording';

interface RecordingControlsProps {
  onChunkReady: (chunk: AudioChunk) => void;
  onSessionStop: (audioBlob: Blob) => void;
}

export function RecordingControls({ onChunkReady, onSessionStop }: RecordingControlsProps) {
  const { state, elapsedMs, error } = useRecordingStore();
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const audioLevelRef = useRef(0);

  const handleAudioLevel = useCallback((level: number, data: Uint8Array) => {
    audioLevelRef.current = level;
    setFrequencyData(new Uint8Array(data));
  }, []);

  const { start, pause, resume, stop } = useAudioRecorder({
    onChunkReady,
    onAudioLevel: handleAudioLevel,
  });

  const handleStop = useCallback(async () => {
    const blob = await stop();
    if (blob) onSessionStop(blob);
  }, [stop, onSessionStop]);

  const isRecording = state === 'recording';
  const isPaused = state === 'paused';
  const isActive = isRecording || isPaused;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Recording control buttons */}
        <div className="flex items-center gap-2">
          {!isActive ? (
            <button
              onClick={start}
              disabled={state === 'permission_requesting' || state === 'saving'}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium rounded-full transition-colors shadow-sm"
              aria-label="녹음 시작"
            >
              <span className="w-3 h-3 rounded-full bg-white" />
              녹음 시작
            </button>
          ) : (
            <>
              {isRecording ? (
                <button
                  onClick={pause}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-full transition-colors shadow-sm"
                  aria-label="일시정지"
                >
                  <PauseIcon />
                  일시정지
                </button>
              ) : (
                <button
                  onClick={resume}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-full transition-colors shadow-sm"
                  aria-label="녹음 재개"
                >
                  <ResumeIcon />
                  재개
                </button>
              )}
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-medium rounded-full transition-colors shadow-sm"
                aria-label="녹음 종료"
              >
                <StopIcon />
                종료
              </button>
            </>
          )}
        </div>

        {/* Timer */}
        <Timer elapsedMs={elapsedMs} isRecording={isRecording} />

        {/* Visualizer */}
        <div className="flex-1 min-w-[120px] max-w-[240px]">
          <AudioVisualizer frequencyData={frequencyData} isActive={isRecording} />
        </div>

        {/* Status badge */}
        <div className="ml-auto">
          <StatusBadge state={state} />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          {error.message}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ state }: { state: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    idle: { label: '대기 중', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    permission_requesting: { label: '권한 요청 중', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    ready: { label: '준비 완료', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    recording: { label: '녹음 중', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    paused: { label: '일시정지', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    stopped: { label: '종료됨', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    saving: { label: '저장 중', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    saved: { label: '저장됨', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    error: { label: '오류', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  const cfg = configs[state] ?? configs.idle;

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function PauseIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z" />
    </svg>
  );
}
