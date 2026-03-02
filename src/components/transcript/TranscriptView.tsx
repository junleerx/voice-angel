/**
 * Main transcript display component.
 * Supports both "interleaved" and "side-by-side" layouts.
 * Implements auto-scroll with manual override.
 */

'use client';

import { useState } from 'react';
import { useRecordingStore } from '@/stores/recordingStore';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { SegmentItem } from './SegmentItem';
import { DualColumnHeader } from './DualColumnLayout';

type LayoutMode = 'interleaved' | 'side-by-side';

interface TranscriptViewProps {
  /** If true, display segments from store (live recording). Otherwise use provided segments. */
  liveMode?: boolean;
  segments?: import('@/types/transcript').TranscriptSegment[];
}

export function TranscriptView({ liveMode = true, segments: externalSegments }: TranscriptViewProps) {
  const storeSegments = useRecordingStore((s) => s.segments);
  const pendingText = useRecordingStore((s) => s.pendingText);
  const segments = liveMode ? storeSegments : (externalSegments ?? []);

  const [layout, setLayout] = useState<LayoutMode>('side-by-side');
  const { containerRef, isLocked, scrollToBottom } = useAutoScroll(segments.length);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {segments.length}개 세그먼트
        </span>
        <div className="flex items-center gap-2">
          {/* Layout toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setLayout('side-by-side')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                layout === 'side-by-side'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-pressed={layout === 'side-by-side'}
            >
              나란히
            </button>
            <button
              onClick={() => setLayout('interleaved')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                layout === 'interleaved'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-pressed={layout === 'interleaved'}
            >
              교차
            </button>
          </div>
        </div>
      </div>

      {/* Column headers for side-by-side mode */}
      {layout === 'side-by-side' && <DualColumnHeader />}

      {/* Transcript content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-0 bg-white dark:bg-gray-900"
      >
        {segments.length === 0 ? (
          <EmptyState liveMode={liveMode} />
        ) : (
          segments.map((segment) => (
            <SegmentItem
              key={segment.id}
              segment={segment}
              layout={layout}
            />
          ))
        )}

        {/* Live pending text */}
        {liveMode && pendingText && (
          <div className="py-3 animate-pulse">
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">{pendingText}</p>
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button when locked */}
      {isLocked && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white text-xs font-medium rounded-full shadow-lg hover:bg-primary-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z" />
          </svg>
          최신으로
        </button>
      )}
    </div>
  );
}

function EmptyState({ liveMode }: { liveMode: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">🎙️</div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">
        {liveMode ? '녹음을 시작하면 트랜스크립트가 여기에 표시됩니다' : '트랜스크립트가 없습니다'}
      </p>
      {liveMode && (
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          상단의 녹음 시작 버튼을 눌러주세요
        </p>
      )}
    </div>
  );
}
