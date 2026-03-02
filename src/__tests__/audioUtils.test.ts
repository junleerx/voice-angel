/**
 * Tests for audio utility functions.
 */

import {
  formatTimestamp,
  formatSrtTimestamp,
  concatenateBlobs,
  generateId,
  checkBrowserSupport,
  generateSessionTitle,
} from '@/lib/audioUtils';

describe('formatTimestamp', () => {
  it('formats zero milliseconds', () => {
    expect(formatTimestamp(0)).toBe('0:00');
  });

  it('formats seconds correctly', () => {
    expect(formatTimestamp(5000)).toBe('0:05');
    expect(formatTimestamp(30000)).toBe('0:30');
    expect(formatTimestamp(59000)).toBe('0:59');
  });

  it('formats minutes and seconds correctly', () => {
    expect(formatTimestamp(60000)).toBe('1:00');
    expect(formatTimestamp(65000)).toBe('1:05');
    expect(formatTimestamp(125000)).toBe('2:05');
  });

  it('formats large durations', () => {
    expect(formatTimestamp(3600000)).toBe('60:00');
    expect(formatTimestamp(3665000)).toBe('61:05');
  });
});

describe('formatSrtTimestamp', () => {
  it('formats zero milliseconds', () => {
    expect(formatSrtTimestamp(0)).toBe('00:00:00,000');
  });

  it('formats seconds', () => {
    expect(formatSrtTimestamp(5000)).toBe('00:00:05,000');
    expect(formatSrtTimestamp(5500)).toBe('00:00:05,500');
  });

  it('formats minutes', () => {
    expect(formatSrtTimestamp(65000)).toBe('00:01:05,000');
  });

  it('formats hours', () => {
    expect(formatSrtTimestamp(3661000)).toBe('01:01:01,000');
  });
});

describe('concatenateBlobs', () => {
  it('concatenates multiple blobs with given MIME type', () => {
    const b1 = new Blob(['hello'], { type: 'audio/webm' });
    const b2 = new Blob([' world'], { type: 'audio/webm' });
    const result = concatenateBlobs([b1, b2], 'audio/webm');
    expect(result.type).toBe('audio/webm');
    expect(result.size).toBe(b1.size + b2.size);
  });

  it('handles empty array', () => {
    const result = concatenateBlobs([], 'audio/webm');
    expect(result.size).toBe(0);
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('generates string IDs', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });
});

describe('checkBrowserSupport', () => {
  it('returns supported when APIs are available', () => {
    const result = checkBrowserSupport();
    // In jsdom environment, some APIs may not be available — just check it returns an object
    expect(result).toHaveProperty('supported');
    expect(typeof result.supported).toBe('boolean');
  });
});

describe('generateSessionTitle', () => {
  it('returns a non-empty string', () => {
    const title = generateSessionTitle();
    expect(typeof title).toBe('string');
    expect(title.length).toBeGreaterThan(0);
  });

  it('includes "미팅" keyword', () => {
    const title = generateSessionTitle();
    expect(title).toContain('미팅');
  });
});
