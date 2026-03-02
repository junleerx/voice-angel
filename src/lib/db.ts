/**
 * IndexedDB setup using Dexie.js.
 * Stores session metadata, transcript segments, and audio blobs separately
 * to optimize query performance.
 *
 * Usage:
 *   import { db } from '@/lib/db';
 *   const sessions = await db.sessions.toArray();
 */

import Dexie, { type Table } from 'dexie';
import type { SessionMetadata, RecordingSession } from '@/types/session';
import type { TranscriptSegment } from '@/types/transcript';
import { DB_NAME, DB_VERSION } from './constants';

/** Stored transcript segments with a foreign key to session */
export interface StoredSegment extends TranscriptSegment {
  sessionId: string;
}

/** Stored audio blob with session reference */
export interface StoredAudio {
  sessionId: string;
  blob: Blob;
  mimeType: string;
}

class VoiceAngelDatabase extends Dexie {
  sessions!: Table<SessionMetadata, string>;
  segments!: Table<StoredSegment, string>;
  audio!: Table<StoredAudio, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      sessions: 'id, createdAt, title',
      segments: 'id, sessionId, startTime',
      audio: 'sessionId',
    });
  }
}

export const db = new VoiceAngelDatabase();

// ─── Session CRUD helpers ────────────────────────────────────────────────────

/** Save or update a complete session (metadata + segments + optional audio) */
export async function saveSession(session: RecordingSession): Promise<void> {
  await db.transaction('rw', db.sessions, db.segments, db.audio, async () => {
    await db.sessions.put(session.metadata);

    // Upsert all segments for this session
    const storedSegments: StoredSegment[] = session.segments.map((s) => ({
      ...s,
      sessionId: session.id,
    }));
    await db.segments.bulkPut(storedSegments);

    // Store audio if provided
    if (session.audioBlob) {
      await db.audio.put({
        sessionId: session.id,
        blob: session.audioBlob,
        mimeType: session.audioBlob.type,
      });
    }
  });
}

/** Load a complete session by ID, including all segments and audio */
export async function loadSession(id: string): Promise<RecordingSession | null> {
  const [metadata, segments, audioRecord] = await Promise.all([
    db.sessions.get(id),
    db.segments.where('sessionId').equals(id).sortBy('startTime'),
    db.audio.get(id),
  ]);

  if (!metadata) return null;

  return {
    id,
    metadata,
    segments,
    audioBlob: audioRecord?.blob,
  };
}

/** Retrieve all session metadata sorted by creation date descending */
export async function listSessions(): Promise<SessionMetadata[]> {
  return db.sessions.orderBy('createdAt').reverse().toArray();
}

/** Delete a session and all associated data */
export async function deleteSession(id: string): Promise<void> {
  await db.transaction('rw', db.sessions, db.segments, db.audio, async () => {
    await Promise.all([
      db.sessions.delete(id),
      db.segments.where('sessionId').equals(id).delete(),
      db.audio.delete(id),
    ]);
  });
}

/** Update only session metadata (e.g. after renaming) */
export async function updateSessionMetadata(
  id: string,
  updates: Partial<SessionMetadata>
): Promise<void> {
  await db.sessions.update(id, updates);
}

/** Save only new segments (used during auto-save) */
export async function appendSegments(segments: StoredSegment[]): Promise<void> {
  await db.segments.bulkPut(segments);
}
