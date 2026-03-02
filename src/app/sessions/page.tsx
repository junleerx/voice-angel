/**
 * Session list page — shows all previously recorded sessions.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { SessionList } from '@/components/session/SessionList';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const metadata: Metadata = {
  title: '세션 목록 — Voice Angel',
};

export default function SessionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            새 녹음
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">세션 목록</span>
        </div>
        <ThemeToggle />
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">녹음 세션</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            이전에 녹음한 미팅 기록을 열람하고 내보낼 수 있습니다
          </p>
        </div>
        <SessionList />
      </main>
    </div>
  );
}
