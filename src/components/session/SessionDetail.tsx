/**
 * Session detail view with audio playback, transcript display, and export.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { TranscriptView } from '@/components/transcript/TranscriptView';
import { ExportDialog } from '@/components/common/ExportDialog';
import { formatTimestamp } from '@/lib/audioUtils';

interface SessionDetailProps {
  sessionId: string;
}

export function SessionDetail({ sessionId }: SessionDetailProps) {
  const { activeSession, isLoading, error, loadSessionById } = useSessionStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    loadSessionById(sessionId);
  }, [sessionId, loadSessionById]);

  // Create object URL for audio playback
  useEffect(() => {
    if (activeSession?.audioBlob) {
      const url = URL.createObjectURL(activeSession.audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setAudioUrl(null);
  }, [activeSession?.audioBlob]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-1/2" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-1/4" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !activeSession) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          {error ?? '세션을 불러올 수 없습니다'}
        </p>
      </div>
    );
  }

  const { metadata, segments } = activeSession;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{metadata.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date(metadata.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            &nbsp;· {formatTimestamp(metadata.durationMs)}
            &nbsp;· {metadata.segmentCount}개 세그먼트
          </p>
        </div>

        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          내보내기
        </button>
      </div>

      {/* Audio player */}
      {audioUrl && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="w-full h-10"
            aria-label="녹음 재생"
          />
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 min-h-0">
        <TranscriptView liveMode={false} segments={segments} />
      </div>

      {/* Export dialog */}
      {showExport && (
        <ExportDialog session={activeSession} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
