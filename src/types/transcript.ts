/**
 * Types related to transcription and translation of speech segments.
 */

/** Status of a transcript segment through the STT → translation pipeline */
export type SegmentStatus = 'transcribing' | 'translating' | 'complete' | 'error';

/**
 * A single unit of transcribed and translated speech.
 * Corresponds to one audio chunk processed through Whisper + translation API.
 */
export interface TranscriptSegment {
  /** Unique identifier for this segment */
  id: string;
  /** Offset from recording start in milliseconds */
  startTime: number;
  /** End time offset from recording start in milliseconds */
  endTime: number;
  /** Original transcribed text from Whisper API */
  originalText: string;
  /** Korean translation of the original text */
  translatedText: string;
  /** BCP-47 language code detected by Whisper (e.g. 'en') */
  language: string;
  /** Whisper confidence score (0-1) */
  confidence: number;
  /** Processing status through the pipeline */
  status: SegmentStatus;
  /** Error message if status is 'error' */
  errorMessage?: string;
}

/** Partial result during streaming transcription (before finalization) */
export interface PartialTranscriptResult {
  text: string;
  isFinal: boolean;
  chunkIndex: number;
}

/** Response shape from the /api/transcribe route */
export interface TranscribeApiResponse {
  text: string;
  language: string;
  confidence: number;
  segments?: WhisperSegment[];
}

/** Individual segment from Whisper's detailed response */
export interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  confidence: number;
}

/** Response shape from the /api/translate route */
export interface TranslateApiResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}
