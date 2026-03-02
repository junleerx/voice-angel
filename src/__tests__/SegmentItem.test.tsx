/**
 * Tests for the SegmentItem component.
 */

import { render, screen } from '@testing-library/react';
import { SegmentItem } from '@/components/transcript/SegmentItem';
import type { TranscriptSegment } from '@/types/transcript';

const makeSegment = (overrides: Partial<TranscriptSegment> = {}): TranscriptSegment => ({
  id: 'seg-1',
  startTime: 5000,
  endTime: 10000,
  originalText: 'Hello world',
  translatedText: '안녕 세상',
  language: 'en',
  confidence: 0.95,
  status: 'complete',
  ...overrides,
});

describe('SegmentItem', () => {
  it('displays timestamp', () => {
    render(<SegmentItem segment={makeSegment()} />);
    expect(screen.getByText('0:05')).toBeInTheDocument();
  });

  it('displays original text when complete', () => {
    render(<SegmentItem segment={makeSegment()} showOriginal showTranslated />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('displays translated text when complete', () => {
    render(<SegmentItem segment={makeSegment()} showOriginal showTranslated />);
    expect(screen.getByText('안녕 세상')).toBeInTheDocument();
  });

  it('shows skeleton when transcribing', () => {
    const { container } = render(
      <SegmentItem segment={makeSegment({ status: 'transcribing' })} />
    );
    // Skeleton divs have animate-pulse class
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows skeleton when translating', () => {
    const { container } = render(
      <SegmentItem segment={makeSegment({ status: 'translating' })} />
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error message when status is error', () => {
    render(
      <SegmentItem
        segment={makeSegment({
          status: 'error',
          errorMessage: '번역 실패',
        })}
      />
    );
    expect(screen.getByText(/번역 실패/)).toBeInTheDocument();
  });

  it('renders in side-by-side layout', () => {
    const { container } = render(
      <SegmentItem segment={makeSegment()} layout="side-by-side" />
    );
    expect(container.querySelector('.grid-cols-2')).toBeInTheDocument();
  });
});
