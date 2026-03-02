/**
 * Custom hook for capturing microphone audio and streaming chunks to the STT pipeline.
 *
 * Usage:
 *   const { start, pause, resume, stop, audioLevel } = useAudioRecorder({
 *     onChunkReady: (chunk) => transcribe(chunk),
 *   });
 */

'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useRecordingStore } from '@/stores/recordingStore';
import {
  getSupportedMimeType,
  checkBrowserSupport,
  generateId,
  generateSessionTitle,
} from '@/lib/audioUtils';
import {
  CHUNK_INTERVAL_MS,
  FFT_SIZE,
  ANALYSER_SMOOTHING,
} from '@/lib/constants';
import type { AudioChunk, RecordingError } from '@/types/recording';

interface UseAudioRecorderOptions {
  /** Called each time a new audio chunk is available for transcription */
  onChunkReady: (chunk: AudioChunk) => void;
  /** Called with audio frequency data for visualizer updates */
  onAudioLevel?: (level: number, frequencyData: Uint8Array) => void;
}

export function useAudioRecorder({ onChunkReady, onAudioLevel }: UseAudioRecorderOptions) {
  const store = useRecordingStore();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunkIndexRef = useRef(0);
  const recordingStartRef = useRef(0);
  const chunkStartRef = useRef(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  /** Request microphone permission and prepare the stream */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const support = checkBrowserSupport();
    if (!support.supported) {
      store.setPermissionState('unsupported');
      store.setError({
        code: 'not_supported',
        message: support.reason ?? '브라우저가 녹음을 지원하지 않습니다.',
      });
      return false;
    }

    store.setState('permission_requesting');
    store.setPermissionState('unknown');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      store.setPermissionState('granted');
      store.setState('ready');
      return true;
    } catch (err) {
      const isDenied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');

      store.setPermissionState(isDenied ? 'denied' : 'unsupported');
      store.setError({
        code: isDenied ? 'permission_denied' : 'device_not_found',
        message: isDenied
          ? '마이크 접근이 거부되었습니다. 브라우저 설정에서 허용해주세요.'
          : '마이크를 찾을 수 없습니다.',
        originalError: err instanceof Error ? err : undefined,
      });
      store.setState('error');
      return false;
    }
  }, [store]);

  /** Set up Web Audio API analyser for real-time level monitoring */
  const setupAnalyser = useCallback((stream: MediaStream) => {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = ANALYSER_SMOOTHING;
    source.connect(analyser);
    analyserRef.current = analyser;

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(frequencyData);
      const average = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
      const normalised = average / 255;
      onAudioLevel?.(normalised, new Uint8Array(frequencyData));
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [onAudioLevel]);

  /** Start the elapsed-time counter */
  const startTimer = useCallback(() => {
    timerIntervalRef.current = setInterval(() => {
      store.setElapsedMs(Date.now() - recordingStartRef.current);
    }, 500);
  }, [store]);

  /** Stop the elapsed-time counter */
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  /** Begin recording */
  const start = useCallback(async () => {
    let stream = streamRef.current;
    if (!stream) {
      const granted = await requestPermission();
      if (!granted) return;
      stream = streamRef.current!;
    }

    const mimeType = getSupportedMimeType();
    const sessionId = generateId();
    const title = generateSessionTitle();

    store.setSessionId(sessionId);
    store.setSessionTitle(title);
    store.setState('recording');
    store.setError(null);

    chunkIndexRef.current = 0;
    recordingStartRef.current = Date.now();
    audioChunksRef.current = [];

    try {
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          const now = Date.now();
          const chunk: AudioChunk = {
            blob: event.data,
            mimeType: recorder.mimeType,
            startTimeMs: chunkStartRef.current - recordingStartRef.current,
            durationMs: now - chunkStartRef.current,
            index: chunkIndexRef.current++,
          };
          chunkStartRef.current = now;
          onChunkReady(chunk);
        }
      };

      recorder.onerror = () => {
        const err: RecordingError = {
          code: 'recording_failed',
          message: '녹음 중 오류가 발생했습니다.',
        };
        store.setError(err);
        store.setState('error');
      };

      chunkStartRef.current = Date.now();
      recorder.start(CHUNK_INTERVAL_MS);
      setupAnalyser(stream);
      startTimer();
    } catch (err) {
      store.setError({
        code: 'recording_failed',
        message: '녹음을 시작할 수 없습니다.',
        originalError: err instanceof Error ? err : undefined,
      });
      store.setState('error');
    }
  }, [requestPermission, store, onChunkReady, setupAnalyser, startTimer]);

  /** Pause recording */
  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      store.setState('paused');
      stopTimer();
    }
  }, [store, stopTimer]);

  /** Resume recording from paused state */
  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      store.setState('recording');
      startTimer();
    }
  }, [store, startTimer]);

  /** Stop recording and return the full audio blob */
  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      stopTimer();

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        store.setState('stopped');
        resolve(fullBlob);
      };

      recorder.stop();
    });
  }, [store, stopTimer]);

  /** Cleanup on unmount */
  useEffect(() => {
    return () => {
      stopTimer();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopTimer]);

  return { start, pause, resume, stop, requestPermission };
}
