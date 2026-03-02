/**
 * Custom hook for translating transcript segments.
 * Uses debouncing to batch short segments and reduces API calls.
 * Falls back to showing original text on translation failure.
 *
 * Usage:
 *   const { translateSegment } = useTranslation();
 */

'use client';

import { useCallback, useRef } from 'react';
import { useRecordingStore } from '@/stores/recordingStore';
import {
  TRANSLATION_DEBOUNCE_MS,
  MIN_TRANSLATION_LENGTH,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  TARGET_LANGUAGE,
} from '@/lib/constants';
import type { TranscriptSegment } from '@/types/transcript';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface PendingTranslation {
  segmentId: string;
  text: string;
  resolve: (translated: string) => void;
  reject: () => void;
}

export function useTranslation() {
  const store = useRecordingStore();
  const pendingRef = useRef<PendingTranslation[]>([]);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Calls /api/translate with retry logic */
  const callTranslateApi = useCallback(async (text: string): Promise<string> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }

      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, targetLanguage: TARGET_LANGUAGE }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        return data.translatedText ?? '';
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[translation] Attempt ${attempt + 1} failed:`, lastError.message);
      }
    }

    throw lastError ?? new Error('Translation failed');
  }, []);

  /** Flush pending translations as a single batch call (split if needed) */
  const flushPending = useCallback(async () => {
    const batch = pendingRef.current.splice(0);
    if (batch.length === 0) return;

    for (const item of batch) {
      try {
        const translated = await callTranslateApi(item.text);
        item.resolve(translated);
      } catch {
        // Show original text on failure
        item.reject();
      }
    }
  }, [callTranslateApi]);

  /**
   * Schedules translation for a segment.
   * Short texts are queued for debounced batch processing.
   */
  const translateSegment = useCallback(
    (segment: TranscriptSegment): Promise<void> => {
      const text = segment.originalText.trim();

      if (text.length < MIN_TRANSLATION_LENGTH) {
        // Short segment: translate immediately with the original as fallback
        store.updateSegment(segment.id, {
          translatedText: text,
          status: 'complete',
        });
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const pending: PendingTranslation = {
          segmentId: segment.id,
          text,
          resolve: (translated: string) => {
            store.updateSegment(segment.id, {
              translatedText: translated,
              status: 'complete',
            });
            resolve();
          },
          reject: () => {
            // Keep original text, mark as complete with error indicator
            store.updateSegment(segment.id, {
              translatedText: '',
              status: 'error',
              errorMessage: '번역 실패 - 원문을 표시합니다',
            });
            resolve();
          },
        };

        pendingRef.current.push(pending);

        // Debounce: reset timer on each new addition
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(flushPending, TRANSLATION_DEBOUNCE_MS);
      });
    },
    [store, flushPending]
  );

  return { translateSegment };
}
