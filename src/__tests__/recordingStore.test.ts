/**
 * Tests for the Zustand recording store.
 */

import { useRecordingStore } from '@/stores/recordingStore';
import type { TranscriptSegment } from '@/types/transcript';

const makeSegment = (id: string): TranscriptSegment => ({
  id,
  startTime: 0,
  endTime: 5000,
  originalText: 'Hello',
  translatedText: '안녕',
  language: 'en',
  confidence: 0.9,
  status: 'complete',
});

describe('useRecordingStore', () => {
  beforeEach(() => {
    useRecordingStore.getState().reset();
  });

  it('has correct initial state', () => {
    const state = useRecordingStore.getState();
    expect(state.state).toBe('idle');
    expect(state.permissionState).toBe('unknown');
    expect(state.segments).toEqual([]);
    expect(state.elapsedMs).toBe(0);
    expect(state.error).toBeNull();
  });

  it('updates recording state', () => {
    useRecordingStore.getState().setState('recording');
    expect(useRecordingStore.getState().state).toBe('recording');
  });

  it('adds segments', () => {
    const seg = makeSegment('seg-1');
    useRecordingStore.getState().addSegment(seg);
    expect(useRecordingStore.getState().segments).toHaveLength(1);
    expect(useRecordingStore.getState().segments[0].id).toBe('seg-1');
  });

  it('updates segments by id', () => {
    const seg = makeSegment('seg-1');
    useRecordingStore.getState().addSegment(seg);
    useRecordingStore.getState().updateSegment('seg-1', { originalText: 'Updated' });
    expect(useRecordingStore.getState().segments[0].originalText).toBe('Updated');
  });

  it('does not modify other segments when updating', () => {
    useRecordingStore.getState().addSegment(makeSegment('seg-1'));
    useRecordingStore.getState().addSegment(makeSegment('seg-2'));
    useRecordingStore.getState().updateSegment('seg-1', { originalText: 'Updated' });
    expect(useRecordingStore.getState().segments[1].originalText).toBe('Hello');
  });

  it('resets to initial state', () => {
    useRecordingStore.getState().setState('recording');
    useRecordingStore.getState().addSegment(makeSegment('seg-1'));
    useRecordingStore.getState().reset();
    const state = useRecordingStore.getState();
    expect(state.state).toBe('idle');
    expect(state.segments).toEqual([]);
  });

  it('sets and clears errors', () => {
    useRecordingStore.getState().setError({
      code: 'permission_denied',
      message: 'Permission denied',
    });
    expect(useRecordingStore.getState().error?.code).toBe('permission_denied');

    useRecordingStore.getState().setError(null);
    expect(useRecordingStore.getState().error).toBeNull();
  });

  it('sets pending text', () => {
    useRecordingStore.getState().setPendingText('Partial result...');
    expect(useRecordingStore.getState().pendingText).toBe('Partial result...');
  });

  it('tracks elapsed time', () => {
    useRecordingStore.getState().setElapsedMs(5000);
    expect(useRecordingStore.getState().elapsedMs).toBe(5000);
  });
});
