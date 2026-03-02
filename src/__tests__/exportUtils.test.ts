/**
 * Tests for export utility functions.
 */

import { exportSession, generateExportFilename } from '@/lib/exportUtils';
import type { RecordingSession } from '@/types/session';
import type { TranscriptSegment } from '@/types/transcript';

const makeSegment = (overrides: Partial<TranscriptSegment> = {}): TranscriptSegment => ({
  id: 'seg-1',
  startTime: 0,
  endTime: 5000,
  originalText: 'Hello world',
  translatedText: '안녕 세상',
  language: 'en',
  confidence: 0.95,
  status: 'complete',
  ...overrides,
});

const makeSession = (segments: TranscriptSegment[] = []): RecordingSession => ({
  id: 'session-1',
  metadata: {
    id: 'session-1',
    title: '테스트 미팅',
    createdAt: '2024-01-01T10:00:00.000Z',
    endedAt: '2024-01-01T11:00:00.000Z',
    durationMs: 3600000,
    language: 'en',
    segmentCount: segments.length,
    hasAudio: false,
  },
  segments,
});

describe('exportSession', () => {
  const session = makeSession([
    makeSegment({ id: 'seg-1', originalText: 'Hello', translatedText: '안녕' }),
    makeSegment({ id: 'seg-2', originalText: 'World', translatedText: '세상' }),
  ]);

  it('exports txt-original format', async () => {
    const blob = exportSession('txt-original', session);
    const text = await blob.text();
    expect(text).toContain('Hello');
    expect(text).toContain('World');
    expect(text).not.toContain('안녕');
  });

  it('exports txt-translated format', async () => {
    const blob = exportSession('txt-translated', session);
    const text = await blob.text();
    expect(text).toContain('안녕');
    expect(text).toContain('세상');
    expect(text).not.toContain('Hello');
  });

  it('exports txt-both format with both languages', async () => {
    const blob = exportSession('txt-both', session);
    const text = await blob.text();
    expect(text).toContain('Hello');
    expect(text).toContain('안녕');
    expect(text).toContain('원문');
    expect(text).toContain('번역');
  });

  it('exports SRT format with timestamps', async () => {
    const blob = exportSession('srt', session);
    const text = await blob.text();
    expect(text).toContain('00:00:00,000 --> 00:00:05,000');
    expect(text).toContain('Hello');
    expect(text).toContain('안녕');
  });

  it('exports JSON format', async () => {
    const blob = exportSession('json', session);
    const text = await blob.text();
    const json = JSON.parse(text);
    expect(json.id).toBe('session-1');
    expect(json.segments).toHaveLength(2);
    expect(json.metadata.title).toBe('테스트 미팅');
  });

  it('skips non-complete segments', async () => {
    const sessionWithError = makeSession([
      makeSegment({ id: 'seg-1', originalText: 'Hello', translatedText: '안녕', status: 'complete' }),
      makeSegment({ id: 'seg-2', originalText: 'Skip', translatedText: '스킵', status: 'error' }),
    ]);
    const blob = exportSession('txt-original', sessionWithError);
    const text = await blob.text();
    expect(text).toContain('Hello');
    expect(text).not.toContain('Skip');
  });
});

describe('generateExportFilename', () => {
  it.each([
    ['txt-original', 'txt'],
    ['txt-translated', 'txt'],
    ['txt-both', 'txt'],
    ['srt', 'srt'],
    ['json', 'json'],
  ] as const)('generates correct extension for %s', (format, ext) => {
    const filename = generateExportFilename('My Meeting', format);
    expect(filename).toMatch(new RegExp(`\\.${ext}$`));
  });

  it('sanitizes special characters from title', () => {
    const filename = generateExportFilename('Meeting: "Important"!', 'json');
    expect(filename).not.toContain('"');
    expect(filename).not.toContain(':');
    expect(filename).not.toContain('!');
  });

  it('replaces spaces with underscores', () => {
    const filename = generateExportFilename('My Meeting', 'json');
    expect(filename).toContain('My_Meeting');
  });
});
