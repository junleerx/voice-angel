/**
 * Utility functions for audio processing.
 *
 * Usage:
 *   const mimeType = getSupportedMimeType();
 *   const formatted = formatTimestamp(65000); // "1:05"
 */

import { PREFERRED_MIME_TYPES } from './constants';

/**
 * Returns the first MIME type supported by the current browser's MediaRecorder,
 * falling back to an empty string if none match.
 */
export function getSupportedMimeType(): string {
  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

/**
 * Formats a duration in milliseconds to MM:SS display string.
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "1:05" or "01:05"
 */
export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats milliseconds into SRT-compatible timestamp string.
 * @param ms - Duration in milliseconds
 * @returns String like "00:01:05,000"
 */
export function formatSrtTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  const millis = ms % 1_000;
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':') + `,${millis.toString().padStart(3, '0')}`;
}

/**
 * Concatenates multiple audio Blobs into a single Blob.
 * All blobs must share the same MIME type.
 */
export function concatenateBlobs(blobs: Blob[], mimeType: string): Blob {
  return new Blob(blobs, { type: mimeType });
}

/**
 * Converts a Blob to a base64-encoded data URL string.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts audio Blob to an ArrayBuffer for Web Audio API processing.
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/**
 * Calculates the RMS (root mean square) volume level from a Float32Array of PCM samples.
 * Returns a value between 0 and 1.
 */
export function calculateRmsLevel(samples: Float32Array): number {
  const sum = samples.reduce((acc, val) => acc + val * val, 0);
  return Math.sqrt(sum / samples.length);
}

/**
 * Checks whether the browser supports the required APIs for recording.
 */
export function checkBrowserSupport(): { supported: boolean; reason?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Server-side rendering context' };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return { supported: false, reason: 'getUserMedia is not supported' };
  }
  if (typeof MediaRecorder === 'undefined') {
    return { supported: false, reason: 'MediaRecorder is not supported' };
  }
  if (typeof AudioContext === 'undefined' && typeof (window as Window & { webkitAudioContext?: unknown }).webkitAudioContext === 'undefined') {
    return { supported: false, reason: 'AudioContext is not supported' };
  }
  return { supported: true };
}

/**
 * Generates a human-readable default session title based on the current date/time.
 */
export function generateSessionTitle(): string {
  const now = new Date();
  return `미팅 ${now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })} ${now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/**
 * Generates a UUID v4 string for segment and session IDs.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
