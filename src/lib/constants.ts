/**
 * Application-wide constants.
 * Keep all magic numbers and configuration values here.
 */

// ─── Audio Recording ────────────────────────────────────────────────────────

/** Interval in milliseconds between audio chunks sent to STT pipeline */
export const CHUNK_INTERVAL_MS = 5_000;

/** Maximum audio file size accepted by Whisper API (25 MB) */
export const MAX_WHISPER_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** Preferred MediaRecorder MIME types in priority order */
export const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
] as const;

/** AnalyserNode FFT size for waveform visualization */
export const FFT_SIZE = 256;

/** Smoothing constant for audio analyser (0 = none, 1 = max smooth) */
export const ANALYSER_SMOOTHING = 0.8;

// ─── STT / Translation Pipeline ─────────────────────────────────────────────

/** Maximum retry attempts for API calls */
export const MAX_RETRY_ATTEMPTS = 3;

/** Base delay for exponential backoff in milliseconds */
export const RETRY_BASE_DELAY_MS = 1_000;

/** Debounce delay for batching translation requests */
export const TRANSLATION_DEBOUNCE_MS = 800;

/** Minimum text length (chars) before triggering a translation call */
export const MIN_TRANSLATION_LENGTH = 10;

/** Target language for translation */
export const TARGET_LANGUAGE = 'ko';

// ─── Storage ─────────────────────────────────────────────────────────────────

/** IndexedDB database name */
export const DB_NAME = 'voice-angel-db';

/** IndexedDB schema version */
export const DB_VERSION = 1;

/** Auto-save interval in milliseconds (30 seconds) */
export const AUTO_SAVE_INTERVAL_MS = 30_000;

// ─── UI ──────────────────────────────────────────────────────────────────────

/** Number of transcript segments before enabling virtual scroll */
export const VIRTUAL_SCROLL_THRESHOLD = 500;

/** Duration for auto-scroll animation in milliseconds */
export const SCROLL_ANIMATION_DURATION_MS = 200;

/** Maximum number of frequency bars in visualizer */
export const VISUALIZER_BAR_COUNT = 32;
