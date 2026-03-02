/**
 * Zustand store for session list and session detail state.
 *
 * Usage:
 *   const { sessions, loadSessions } = useSessionStore();
 */

import { create } from 'zustand';
import type { SessionMetadata, RecordingSession } from '@/types/session';
import { listSessions, loadSession, deleteSession } from '@/lib/db';

interface SessionStore {
  // ─── State ──────────────────────────────────────────────────────────────
  sessions: SessionMetadata[];
  activeSession: RecordingSession | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  // ─── Actions ─────────────────────────────────────────────────────────────
  loadSessions: () => Promise<void>;
  loadSessionById: (id: string) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearActiveSession: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeSession: null,
  isLoading: false,
  error: null,
  searchQuery: '',

  loadSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await listSessions();
      set({ sessions, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '세션 목록을 불러오지 못했습니다.',
        isLoading: false,
      });
    }
  },

  loadSessionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await loadSession(id);
      set({ activeSession: session, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '세션을 불러오지 못했습니다.',
        isLoading: false,
      });
    }
  },

  removeSession: async (id: string) => {
    try {
      await deleteSession(id);
      set((s) => ({
        sessions: s.sessions.filter((sess) => sess.id !== id),
        activeSession: s.activeSession?.id === id ? null : s.activeSession,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '세션 삭제에 실패했습니다.',
      });
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  clearActiveSession: () => set({ activeSession: null }),
}));

/** Returns sessions filtered by the current search query */
export function selectFilteredSessions(store: SessionStore): SessionMetadata[] {
  const q = store.searchQuery.trim().toLowerCase();
  if (!q) return store.sessions;
  return store.sessions.filter((s) => s.title.toLowerCase().includes(q));
}
