/**
 * Bottom status bar showing API processing state and connection info.
 */

'use client';

interface StatusBarProps {
  isTranscribing: boolean;
  isTranslating: boolean;
  processingCount?: number;
  className?: string;
}

export function StatusBar({
  isTranscribing,
  isTranslating,
  processingCount = 0,
  className = '',
}: StatusBarProps) {
  const isBusy = isTranscribing || isTranslating;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-xs ${className}`}
    >
      {/* STT status */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${isTranscribing ? 'bg-blue-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`}
        />
        <span className="text-gray-500 dark:text-gray-400">
          {isTranscribing ? `STT 처리 중 (${processingCount})` : 'STT 대기'}
        </span>
      </div>

      <span className="text-gray-300 dark:text-gray-600">|</span>

      {/* Translation status */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${isTranslating ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`}
        />
        <span className="text-gray-500 dark:text-gray-400">
          {isTranslating ? '번역 중' : '번역 대기'}
        </span>
      </div>

      {/* Overall busy indicator */}
      {isBusy && (
        <>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-blue-500 dark:text-blue-400 font-medium animate-pulse">
            처리 중...
          </span>
        </>
      )}

      <div className="ml-auto text-gray-400 dark:text-gray-500">
        Powered by Whisper + AI
      </div>
    </div>
  );
}
