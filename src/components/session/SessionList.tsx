/**
 * Session list with search, filter, and empty state.
 */

'use client';

import { useEffect } from 'react';
import { useSessionStore, selectFilteredSessions } from '@/stores/sessionStore';
import { SessionCard } from './SessionCard';

export function SessionList() {
  const store = useSessionStore();
  const filtered = selectFilteredSessions(store);

  useEffect(() => {
    store.loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="세션 검색..."
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      {/* Error */}
      {store.error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {store.error}
        </div>
      )}

      {/* Loading */}
      {store.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasSearch={store.searchQuery.length > 0} />
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={store.removeSession}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{hasSearch ? '🔍' : '📭'}</div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">
        {hasSearch ? '검색 결과가 없습니다' : '저장된 세션이 없습니다'}
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
        {hasSearch ? '다른 검색어를 입력해보세요' : '새 미팅을 녹음하면 여기에 표시됩니다'}
      </p>
    </div>
  );
}
