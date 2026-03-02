/**
 * Zustand store for recording state management.
 * Tracks the current recording session, state machine, and audio metadata.
 *
 * Usage:
 *   const { state, startRecording } = useRecordingStore();
 */

import { create } from 'zustand';
import type { RecordingState, PermissionState, RecordingError } from '@/types/recording';
import type { TranscriptSegment } from '@/types/transcript';

interface RecordingStore {
  // ─── State ──────────────────────────────────────────────────────────────
  state: RecordingState;
  permissionState: PermissionState;
  error: RecordingError | null;

  // ─── Session Info ────────────────────────────────────────────────────────
  sessionId: string | null;
  sessionTitle: string;
  startedAt: number | null;
  elapsedMs: number;

  // ─── Transcript ──────────────────────────────────────────────────────────
  segments: TranscriptSegment[];
  pendingText: string; // Partial text being transcribed

  // ─── Actions ─────────────────────────────────────────────────────────────
  setState: (state: RecordingState) => void;
  setPermissionState: (state: PermissionState) => void;
  setError: (error: RecordingError | null) => void;
  setSessionId: (id: string) => void;
  setSessionTitle: (title: string) => void;
  setStartedAt: (ts: number) => void;
  setElapsedMs: (ms: number) => void;
  addSegment: (segment: TranscriptSegment) => void;
  updateSegment: (id: string, updates: Partial<TranscriptSegment>) => void;
  setPendingText: (text: string) => void;
  reset: () => void;
}

const initialState = {
  state: 'idle' as RecordingState,
  permissionState: 'unknown' as PermissionState,
  error: null,
  sessionId: null,
  sessionTitle: '',
  startedAt: null,
  elapsedMs: 0,
  segments: [],
  pendingText: '',
};

export const useRecordingStore = create<RecordingStore>((set) => ({
  ...initialState,

  setState: (state) => set({ state }),
  setPermissionState: (permissionState) => set({ permissionState }),
  setError: (error) => set({ error }),
  setSessionId: (sessionId) => set({ sessionId }),
  setSessionTitle: (sessionTitle) => set({ sessionTitle }),
  setStartedAt: (startedAt) => set({ startedAt }),
  setElapsedMs: (elapsedMs) => set({ elapsedMs }),

  addSegment: (segment) =>
    set((s) => ({ segments: [...s.segments, segment] })),

  updateSegment: (id, updates) =>
    set((s) => ({
      segments: s.segments.map((seg) =>
        seg.id === id ? { ...seg, ...updates } : seg
      ),
    })),

  setPendingText: (pendingText) => set({ pendingText }),

  reset: () => set(initialState),
}));
