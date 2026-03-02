/**
 * Individual session detail/replay page.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { SessionDetail } from '@/components/session/SessionDetail';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const metadata: Metadata = {
  title: '세션 상세 — Voice Angel',
};

interface PageProps {
  params: { id: string };
}

export default function SessionDetailPage({ params }: PageProps) {
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/sessions"
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            세션 목록
          </Link>
        </div>
        <ThemeToggle />
      </nav>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <SessionDetail sessionId={params.id} />
      </div>
    </div>
  );
}
