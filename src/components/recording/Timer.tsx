/**
 * Displays the elapsed recording time in MM:SS format.
 */

'use client';

import { formatTimestamp } from '@/lib/audioUtils';

interface TimerProps {
  elapsedMs: number;
  isRecording: boolean;
}

export function Timer({ elapsedMs, isRecording }: TimerProps) {
  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-slow" />
      )}
      <span className="font-mono text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
        {formatTimestamp(elapsedMs)}
      </span>
    </div>
  );
}
