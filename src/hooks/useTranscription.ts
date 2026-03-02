/**
 * Custom hook that manages the STT pipeline.
 * Receives audio chunks, sends them to /api/transcribe with retry logic,
 * and updates the recording store with transcript segments.
 *
 * Usage:
 *   const { transcribeChunk, isProcessing } = useTranscription();
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { useRecordingStore } from '@/stores/recordingStore';
import { generateId } from '@/lib/audioUtils';
import { MAX_RETRY_ATTEMPTS, RETRY_BASE_DELAY_MS } from '@/lib/constants';
import type { AudioChunk } from '@/types/recording';
import type { TranscriptSegment } from '@/types/transcript';

interface UseTranscriptionResult {
  transcribeChunk: (chunk: AudioChunk) => Promise<TranscriptSegment | null>;
  isProcessing: boolean;
  processingCount: number;
}

/** Sleeps for `ms` milliseconds (for exponential backoff) */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useTranscription(): UseTranscriptionResult {
  const store = useRecordingStore();
  const [processingCount, setProcessingCount] = useState(0);
  // Buffer for chunks that failed while offline
  const offlineBufferRef = useRef<AudioChunk[]>([]);

  /**
   * Sends a single audio chunk to the transcription API with retry logic.
   * Returns the created TranscriptSegment or null on failure.
   */
  const transcribeChunk = useCallback(
    async (chunk: AudioChunk): Promise<TranscriptSegment | null> => {
      const segmentId = generateId();
      const startTime = chunk.startTimeMs;
      const endTime = chunk.startTimeMs + chunk.durationMs;

      // Optimistically add a "transcribing" placeholder segment
      const placeholder: TranscriptSegment = {
        id: segmentId,
        startTime,
        endTime,
        originalText: '',
        translatedText: '',
        language: 'en',
        confidence: 0,
        status: 'transcribing',
      };
      store.addSegment(placeholder);
      setProcessingCount((c) => c + 1);

      const formData = new FormData();
      formData.append('audio', chunk.blob, `chunk_${chunk.index}.webm`);

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
        }

        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }

          const data = await res.json();

          const completedSegment: TranscriptSegment = {
            id: segmentId,
            startTime,
            endTime,
            originalText: data.text,
            translatedText: '',
            language: data.language ?? 'en',
            confidence: data.confidence ?? 0.9,
            status: 'translating',
          };

          store.updateSegment(segmentId, completedSegment);
          setProcessingCount((c) => Math.max(0, c - 1));
          return completedSegment;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`[transcription] Attempt ${attempt + 1} failed:`, lastError.message);
        }
      }

      // All retries exhausted
      console.error('[transcription] All retries failed:', lastError?.message);
      store.updateSegment(segmentId, {
        status: 'error',
        errorMessage: lastError?.message ?? '트랜스크립션 실패',
      });
      setProcessingCount((c) => Math.max(0, c - 1));

      // Buffer the chunk for later retry if network is down
      offlineBufferRef.current.push(chunk);

      return null;
    },
    [store]
  );

  return {
    transcribeChunk,
    isProcessing: processingCount > 0,
    processingCount,
  };
}
