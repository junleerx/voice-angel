/**
 * Types related to recording sessions stored in IndexedDB.
 */

import type { TranscriptSegment } from './transcript';

/** Metadata stored for each recording session */
export interface SessionMetadata {
  /** Unique session ID (UUID) */
  id: string;
  /** User-editable title (defaults to date/time) */
  title: string;
  /** ISO timestamp when recording started */
  createdAt: string;
  /** ISO timestamp when recording ended */
  endedAt: string;
  /** Total recording duration in milliseconds */
  durationMs: number;
  /** Primary detected language (BCP-47 code) */
  language: string;
  /** Number of transcript segments */
  segmentCount: number;
  /** Whether the session has a stored audio blob */
  hasAudio: boolean;
}

/** Full session data including audio and transcript */
export interface RecordingSession {
  /** Unique session ID */
  id: string;
  /** Session metadata */
  metadata: SessionMetadata;
  /** All transcript segments in chronological order */
  segments: TranscriptSegment[];
  /** Raw audio Blob (WebM format) - stored separately in IndexedDB */
  audioBlob?: Blob;
}

/** Partial session used for list display (without full segments) */
export type SessionListItem = SessionMetadata;

/** Export format options */
export type ExportFormat = 'txt-original' | 'txt-translated' | 'txt-both' | 'srt' | 'json';

/** Configuration for session export */
export interface ExportConfig {
  format: ExportFormat;
  session: RecordingSession;
}
