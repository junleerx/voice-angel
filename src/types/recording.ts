/**
 * Types related to audio recording state and controls.
 */

/** Represents the current state of the recording session */
export type RecordingState =
  | 'idle'
  | 'permission_requesting'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'saving'
  | 'saved'
  | 'error';

/** Microphone permission state */
export type PermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported';

/** An audio chunk produced by MediaRecorder during streaming */
export interface AudioChunk {
  /** The raw audio data blob */
  blob: Blob;
  /** MIME type of the audio (e.g. 'audio/webm') */
  mimeType: string;
  /** Offset from recording start in milliseconds */
  startTimeMs: number;
  /** Duration of this chunk in milliseconds */
  durationMs: number;
  /** Sequential index for ordering */
  index: number;
}

/** Configuration for the MediaRecorder */
export interface RecorderConfig {
  /** Preferred MIME type for recording */
  mimeType: string;
  /** Chunk interval in milliseconds (default: 5000) */
  chunkIntervalMs: number;
  /** Audio sample rate */
  sampleRate?: number;
}

/** Real-time audio level data for visualization */
export interface AudioLevel {
  /** Current volume level (0-1) */
  level: number;
  /** Frequency data array for waveform visualization */
  frequencyData: Uint8Array;
}

/** Error information for recording failures */
export interface RecordingError {
  code: 'permission_denied' | 'not_supported' | 'device_not_found' | 'recording_failed' | 'unknown';
  message: string;
  originalError?: Error;
}
