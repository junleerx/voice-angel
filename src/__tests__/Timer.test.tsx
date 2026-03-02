/**
 * Tests for the Timer component.
 */

import { render, screen } from '@testing-library/react';
import { Timer } from '@/components/recording/Timer';

describe('Timer', () => {
  it('renders time in MM:SS format', () => {
    render(<Timer elapsedMs={65000} isRecording={false} />);
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('shows zero time', () => {
    render(<Timer elapsedMs={0} isRecording={false} />);
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('shows recording dot when recording', () => {
    const { container } = render(<Timer elapsedMs={5000} isRecording={true} />);
    // The red dot has animate-pulse-slow class
    expect(container.querySelector('.animate-pulse-slow')).toBeInTheDocument();
  });

  it('does not show recording dot when not recording', () => {
    const { container } = render(<Timer elapsedMs={5000} isRecording={false} />);
    expect(container.querySelector('.animate-pulse-slow')).not.toBeInTheDocument();
  });
});
