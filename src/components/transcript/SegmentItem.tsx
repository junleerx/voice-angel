/**
 * Renders a single transcript segment with original and translated text.
 * Shows loading skeleton while transcribing/translating.
 */

'use client';

import { formatTimestamp } from '@/lib/audioUtils';
import type { TranscriptSegment } from '@/types/transcript';

interface SegmentItemProps {
  segment: TranscriptSegment;
  showOriginal?: boolean;
  showTranslated?: boolean;
  layout?: 'interleaved' | 'side-by-side';
}

export function SegmentItem({
  segment,
  showOriginal = true,
  showTranslated = true,
  layout = 'interleaved',
}: SegmentItemProps) {
  const isLoading = segment.status === 'transcribing' || segment.status === 'translating';
  const hasError = segment.status === 'error';
  const timestamp = formatTimestamp(segment.startTime);

  if (layout === 'side-by-side') {
    return (
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-gray-100 dark:border-gray-800 animate-fade-in">
        {/* Original */}
        <div className="flex flex-col gap-1">
          {showOriginal && (
            <>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{timestamp}</span>
              {segment.status === 'transcribing' ? (
                <SkeletonText />
              ) : (
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {segment.originalText || (
                    <span className="text-gray-400 italic">텍스트 없음</span>
                  )}
                </p>
              )}
            </>
          )}
        </div>

        {/* Translation */}
        <div className="flex flex-col gap-1">
          {showTranslated && (
            <>
              <span className="text-xs text-transparent select-none">{timestamp}</span>
              {isLoading ? (
                <SkeletonText />
              ) : hasError ? (
                <TranslationError message={segment.errorMessage} original={segment.originalText} />
              ) : (
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  {segment.translatedText || (
                    <span className="text-gray-400 italic">번역 없음</span>
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Interleaved layout
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-gray-100 dark:border-gray-800 animate-fade-in">
      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{timestamp}</span>

      {showOriginal && (
        segment.status === 'transcribing' ? (
          <SkeletonText />
        ) : (
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {segment.originalText}
          </p>
        )
      )}

      {showTranslated && (
        isLoading ? (
          <SkeletonText className="opacity-60" />
        ) : hasError ? (
          <TranslationError message={segment.errorMessage} original={segment.originalText} />
        ) : (
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
            {segment.translatedText}
          </p>
        )
      )}
    </div>
  );
}

function SkeletonText({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
      <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
    </div>
  );
}

function TranslationError({ message, original }: { message?: string; original: string }) {
  return (
    <div className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
      {original}
      {message && (
        <span className="ml-2 text-xs text-amber-500 dark:text-amber-500 italic">({message})</span>
      )}
    </div>
  );
}
