/**
 * Card component for a single session in the session list.
 */

'use client';

import Link from 'next/link';
import { formatTimestamp } from '@/lib/audioUtils';
import type { SessionMetadata } from '@/types/session';

interface SessionCardProps {
  session: SessionMetadata;
  onDelete: (id: string) => void;
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const date = new Date(session.createdAt);
  const dateStr = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`"${session.title}" 세션을 삭제하시겠습니까? 오디오 파일도 함께 삭제됩니다.`)) {
      onDelete(session.id);
    }
  };

  return (
    <Link href={`/sessions/${session.id}`} className="block group">
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <span className="text-xl">🎙️</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {session.title}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">{dateStr} {timeStr}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(session.durationMs)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {session.segmentCount}개 세그먼트
            </span>
          </div>
        </div>

        {/* Language badge */}
        <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full uppercase font-mono">
          {session.language}
        </span>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
          aria-label="세션 삭제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </Link>
  );
}
