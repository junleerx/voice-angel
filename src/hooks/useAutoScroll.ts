/**
 * Hook that manages automatic scrolling to the bottom of a container.
 * Pauses when user scrolls up manually; resumes when user scrolls to the bottom.
 *
 * Usage:
 *   const { containerRef, isLocked } = useAutoScroll(segments.length);
 */

'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

const SCROLL_THRESHOLD_PX = 80;

export function useAutoScroll(dependency: unknown) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  // Auto-scroll when new content arrives (if not locked)
  useEffect(() => {
    if (!isLocked) {
      scrollToBottom();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency, isLocked]);

  // Listen for manual scroll to toggle lock
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsLocked(distanceFromBottom > SCROLL_THRESHOLD_PX);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return { containerRef, isLocked, scrollToBottom };
}
