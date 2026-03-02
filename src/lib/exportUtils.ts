/**
 * Utilities for exporting session data in various formats.
 *
 * Usage:
 *   const blob = exportSession({ format: 'srt', session });
 *   downloadBlob(blob, 'transcript.srt');
 */

import type { RecordingSession, ExportFormat } from '@/types/session';
import type { TranscriptSegment } from '@/types/transcript';
import { formatSrtTimestamp } from './audioUtils';

/**
 * Exports a recording session to the specified format and returns a Blob.
 */
export function exportSession(format: ExportFormat, session: RecordingSession): Blob {
  switch (format) {
    case 'txt-original':
      return exportTxt(session.segments, 'original');
    case 'txt-translated':
      return exportTxt(session.segments, 'translated');
    case 'txt-both':
      return exportTxtBoth(session.segments);
    case 'srt':
      return exportSrt(session.segments);
    case 'json':
      return exportJson(session);
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}

function exportTxt(segments: TranscriptSegment[], mode: 'original' | 'translated'): Blob {
  const lines = segments
    .filter((s) => s.status === 'complete')
    .map((s) => (mode === 'original' ? s.originalText : s.translatedText));
  return new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
}

function exportTxtBoth(segments: TranscriptSegment[]): Blob {
  const lines = segments
    .filter((s) => s.status === 'complete')
    .map((s) => `[원문]\n${s.originalText}\n\n[번역]\n${s.translatedText}`);
  return new Blob([lines.join('\n\n' + '─'.repeat(40) + '\n\n')], {
    type: 'text/plain;charset=utf-8',
  });
}

function exportSrt(segments: TranscriptSegment[]): Blob {
  const entries = segments
    .filter((s) => s.status === 'complete')
    .map((s, i) => {
      const start = formatSrtTimestamp(s.startTime);
      const end = formatSrtTimestamp(s.endTime);
      return `${i + 1}\n${start} --> ${end}\n${s.originalText}\n${s.translatedText}`;
    });
  return new Blob([entries.join('\n\n')], { type: 'text/plain;charset=utf-8' });
}

function exportJson(session: RecordingSession): Blob {
  const data = {
    id: session.id,
    metadata: session.metadata,
    segments: session.segments,
  };
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
}

/**
 * Triggers a browser download for a given Blob with the specified filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Release object URL after download is triggered
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/**
 * Generates an appropriate filename for a session export.
 */
export function generateExportFilename(
  sessionTitle: string,
  format: ExportFormat
): string {
  const sanitized = sessionTitle.replace(/[^a-zA-Z0-9가-힣\s-]/g, '').trim().replace(/\s+/g, '_');
  const extensions: Record<ExportFormat, string> = {
    'txt-original': 'txt',
    'txt-translated': 'txt',
    'txt-both': 'txt',
    srt: 'srt',
    json: 'json',
  };
  return `${sanitized}.${extensions[format]}`;
}
