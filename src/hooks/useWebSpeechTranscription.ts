'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecordingStore } from '@/stores/recordingStore';
import { generateId } from '@/lib/audioUtils';
import type { TranscriptSegment } from '@/types/transcript';

interface UseWebSpeechTranscriptionResult {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isListening: boolean;
  isSupported: boolean;
}

export function useWebSpeechTranscription(
  onSegmentReady: (segment: TranscriptSegment) => void
): UseWebSpeechTranscriptionResult {
  const store = useRecordingStore();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const isActiveRef = useRef(false);
  const recordingStartRef = useRef(0);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const buildRecognition = useCallback(() => {
    const SR =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return null;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = ''; // auto-detect language

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      setIsListening(false);
      store.setPendingText('');
      // Auto-restart if still active (recognition stops automatically after silence)
      if (isActiveRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore - already started
        }
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const elapsed = Date.now() - recordingStartRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();

        if (result.isFinal) {
          store.setPendingText('');
          if (!text) continue;

          const segment: TranscriptSegment = {
            id: generateId(),
            startTime: Math.max(0, elapsed - 5000),
            endTime: elapsed,
            originalText: text,
            translatedText: '',
            language: 'auto',
            confidence: result[0].confidence || 0.9,
            status: 'translating',
          };

          store.addSegment(segment);
          onSegmentReady(segment);
        } else {
          store.setPendingText(text);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error('[web-speech] Error:', event.error);
    };

    return recognition;
  }, [store, onSegmentReady]);

  const start = useCallback(() => {
    if (!isSupported) return;
    recordingStartRef.current = Date.now();
    isActiveRef.current = true;
    const recognition = buildRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, buildRecognition]);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    store.setPendingText('');
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, [store]);

  const pause = useCallback(() => {
    isActiveRef.current = false;
    store.setPendingText('');
    recognitionRef.current?.stop();
  }, [store]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    isActiveRef.current = true;
    const recognition = buildRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, buildRecognition]);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return { start, stop, pause, resume, isListening, isSupported };
}
