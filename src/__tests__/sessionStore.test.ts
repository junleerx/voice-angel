/**
 * Tests for the Zustand session store and selectors.
 */

import { useSessionStore, selectFilteredSessions } from '@/stores/sessionStore';
import type { SessionMetadata } from '@/types/session';

// Mock the db module
jest.mock('@/lib/db', () => ({
  listSessions: jest.fn(),
  loadSession: jest.fn(),
  deleteSession: jest.fn(),
}));

import { listSessions, loadSession, deleteSession } from '@/lib/db';

const makeMeta = (id: string, title: string): SessionMetadata => ({
  id,
  title,
  createdAt: '2024-01-01T10:00:00.000Z',
  endedAt: '2024-01-01T11:00:00.000Z',
  durationMs: 3600000,
  language: 'en',
  segmentCount: 10,
  hasAudio: true,
});

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: [],
      activeSession: null,
      isLoading: false,
      error: null,
      searchQuery: '',
    });
    jest.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useSessionStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('loads sessions successfully', async () => {
    const mockSessions = [makeMeta('s1', 'Meeting 1'), makeMeta('s2', 'Meeting 2')];
    (listSessions as jest.Mock).mockResolvedValue(mockSessions);

    await useSessionStore.getState().loadSessions();

    expect(useSessionStore.getState().sessions).toHaveLength(2);
    expect(useSessionStore.getState().isLoading).toBe(false);
  });

  it('handles load error gracefully', async () => {
    (listSessions as jest.Mock).mockRejectedValue(new Error('DB error'));

    await useSessionStore.getState().loadSessions();

    expect(useSessionStore.getState().error).toBeTruthy();
    expect(useSessionStore.getState().isLoading).toBe(false);
  });

  it('removes session from list on delete', async () => {
    useSessionStore.setState({ sessions: [makeMeta('s1', 'M1'), makeMeta('s2', 'M2')] });
    (deleteSession as jest.Mock).mockResolvedValue(undefined);

    await useSessionStore.getState().removeSession('s1');

    expect(useSessionStore.getState().sessions).toHaveLength(1);
    expect(useSessionStore.getState().sessions[0].id).toBe('s2');
  });

  it('sets search query', () => {
    useSessionStore.getState().setSearchQuery('test');
    expect(useSessionStore.getState().searchQuery).toBe('test');
  });

  it('loads session by ID', async () => {
    const mockSession = {
      id: 's1',
      metadata: makeMeta('s1', 'M1'),
      segments: [],
    };
    (loadSession as jest.Mock).mockResolvedValue(mockSession);

    await useSessionStore.getState().loadSessionById('s1');

    expect(useSessionStore.getState().activeSession).toEqual(mockSession);
  });
});

describe('selectFilteredSessions', () => {
  it('returns all sessions when no query', () => {
    const state = useSessionStore.getState();
    useSessionStore.setState({
      sessions: [makeMeta('s1', 'Morning Meeting'), makeMeta('s2', 'Standup')],
      searchQuery: '',
    });
    const filtered = selectFilteredSessions(useSessionStore.getState());
    expect(filtered).toHaveLength(2);
  });

  it('filters sessions by title', () => {
    useSessionStore.setState({
      sessions: [makeMeta('s1', 'Morning Meeting'), makeMeta('s2', 'Standup')],
      searchQuery: 'morning',
    });
    const filtered = selectFilteredSessions(useSessionStore.getState());
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Morning Meeting');
  });

  it('is case-insensitive', () => {
    useSessionStore.setState({
      sessions: [makeMeta('s1', 'Morning Meeting'), makeMeta('s2', 'Standup')],
      searchQuery: 'STANDUP',
    });
    const filtered = selectFilteredSessions(useSessionStore.getState());
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Standup');
  });

  it('returns empty array when no match', () => {
    useSessionStore.setState({
      sessions: [makeMeta('s1', 'Morning Meeting')],
      searchQuery: 'xyz',
    });
    const filtered = selectFilteredSessions(useSessionStore.getState());
    expect(filtered).toHaveLength(0);
  });
});
