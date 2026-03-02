/**
 * Main recording page.
 * Orchestrates the audio recording → STT → translation pipeline
 * and auto-saves sessions to IndexedDB every 30 seconds.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRecordingStore } from '@/stores/recordingStore';
import { useWebSpeechTranscription } from '@/hooks/useWebSpeechTranscription';
import { useTranslation } from '@/hooks/useTranslation';
import { RecordingControls } from '@/components/recording/RecordingControls';
import { TranscriptView } from '@/components/transcript/TranscriptView';
import { StatusBar } from '@/components/common/StatusBar';
import { PermissionDialog } from '@/components/common/PermissionDialog';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { ExportDialog } from '@/components/common/ExportDialog';
import { saveSession } from '@/lib/db';
import { AUTO_SAVE_INTERVAL_MS } from '@/lib/constants';
import type { RecordingSession } from '@/types/session';

export default function HomePage() {
  const store = useRecordingStore();
  const { translateSegment } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [finalSession, setFinalSession] = useState<RecordingSession | null>(null);
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Called by Web Speech API when a final segment is ready → translate it.
   */
  const handleSegmentReady = useCallback(
    async (segment: import('@/types/transcript').TranscriptSegment) => {
      if (!segment.originalText.trim()) return;
      setIsTranslating(true);
      await translateSegment(segment);
      setIsTranslating(false);
    },
    [translateSegment]
  );

  const { start: speechStart, stop: speechStop, pause: speechPause, resume: speechResume, isSupported: speechSupported } =
    useWebSpeechTranscription(handleSegmentReady);

  /**
   * Persist current state to IndexedDB periodically.
   */
  const autoSave = useCallback(async () => {
    const { sessionId, sessionTitle, startedAt, elapsedMs, segments } = store;
    if (!sessionId || store.state !== 'recording') return;

    const session: RecordingSession = {
      id: sessionId,
      metadata: {
        id: sessionId,
        title: sessionTitle,
        createdAt: new Date(startedAt ?? Date.now()).toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: elapsedMs,
        language: segments[0]?.language ?? 'en',
        segmentCount: segments.length,
        hasAudio: false,
      },
      segments,
    };

    try {
      await saveSession(session);
    } catch (err) {
      console.error('[auto-save] Failed to save session:', err);
    }
  }, [store]);

  // Set up auto-save interval
  useEffect(() => {
    if (store.state === 'recording' || store.state === 'paused') {
      autoSaveIntervalRef.current = setInterval(autoSave, AUTO_SAVE_INTERVAL_MS);
    } else {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    }
    return () => {
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    };
  }, [store.state, autoSave]);

  /**
   * Called when recording is stopped — saves complete session with audio blob.
   */
  const handleSessionStop = useCallback(
    async (audioBlob: Blob) => {
      const { sessionId, sessionTitle, startedAt, elapsedMs, segments } = store;
      if (!sessionId) return;

      store.setState('saving');

      const session: RecordingSession = {
        id: sessionId,
        metadata: {
          id: sessionId,
          title: sessionTitle,
          createdAt: new Date(startedAt ?? Date.now()).toISOString(),
          endedAt: new Date().toISOString(),
          durationMs: elapsedMs,
          language: segments[0]?.language ?? 'en',
          segmentCount: segments.length,
          hasAudio: true,
        },
        segments,
        audioBlob,
      };

      try {
        await saveSession(session);
        setFinalSession(session);
        store.setState('saved');
      } catch (err) {
        console.error('[session-stop] Failed to save session:', err);
        store.setState('error');
      }
    },
    [store]
  );

  const showPermissionDialog = store.permissionState === 'denied';
  const isStopped = store.state === 'saved' || store.state === 'stopped';

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* ── Navigation bar ── */}
      <nav className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🪶</span>
          <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">Voice Angel</span>
        </div>
        <div className="flex items-center gap-2">
          {isStopped && finalSession && (
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              내보내기
            </button>
          )}
          <Link
            href="/sessions"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            세션 목록
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* ── Recording controls ── */}
      {!speechSupported && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm border-b border-amber-200 dark:border-amber-800">
          이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome 또는 Edge를 사용해주세요.
        </div>
      )}
      <RecordingControls
        onSessionStop={handleSessionStop}
        onSpeechStart={speechStart}
        onSpeechPause={speechPause}
        onSpeechResume={speechResume}
        onSpeechStop={speechStop}
      />

      {/* ── Transcript view ── */}
      <div className="flex-1 min-h-0 relative">
        <TranscriptView liveMode={true} />
      </div>

      {/* ── Status bar ── */}
      <StatusBar
        isTranscribing={false}
        isTranslating={isTranslating}
        processingCount={0}
        className="shrink-0"
      />

      {/* ── Dialogs ── */}
      {showPermissionDialog && (
        <PermissionDialog onRetry={() => window.location.reload()} />
      )}
      {showExport && finalSession && (
        <ExportDialog session={finalSession} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
