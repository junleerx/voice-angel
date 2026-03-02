/**
 * Two-column header labels for the transcript view (Original | Korean).
 */

'use client';

interface DualColumnLayoutProps {
  originalLabel?: string;
  translatedLabel?: string;
}

export function DualColumnHeader({
  originalLabel = '원문',
  translatedLabel = '한국어 번역',
}: DualColumnLayoutProps) {
  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {originalLabel}
        </span>
        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
          STT
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          {translatedLabel}
        </span>
        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
          KO
        </span>
      </div>
    </div>
  );
}
