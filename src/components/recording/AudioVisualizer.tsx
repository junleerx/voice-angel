/**
 * Real-time audio frequency bar visualizer.
 * Renders VISUALIZER_BAR_COUNT bars derived from the audio analyser frequency data.
 */

'use client';

import { useRef, useEffect } from 'react';
import { VISUALIZER_BAR_COUNT } from '@/lib/constants';

interface AudioVisualizerProps {
  frequencyData: Uint8Array | null;
  isActive: boolean;
  className?: string;
}

export function AudioVisualizer({ frequencyData, isActive, className = '' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!isActive || !frequencyData || frequencyData.length === 0) {
      // Draw idle state: flat bars
      const barWidth = width / VISUALIZER_BAR_COUNT - 2;
      ctx.fillStyle = '#93c5fd'; // blue-300
      for (let i = 0; i < VISUALIZER_BAR_COUNT; i++) {
        const x = i * (barWidth + 2);
        ctx.fillRect(x, height / 2 - 2, barWidth, 4);
      }
      return;
    }

    const step = Math.floor(frequencyData.length / VISUALIZER_BAR_COUNT);
    const barWidth = width / VISUALIZER_BAR_COUNT - 2;

    for (let i = 0; i < VISUALIZER_BAR_COUNT; i++) {
      const value = frequencyData[i * step] / 255;
      const barHeight = Math.max(4, value * height);
      const x = i * (barWidth + 2);
      const y = (height - barHeight) / 2;

      // Gradient colour: blue → indigo at higher volumes
      const hue = 210 + value * 40;
      ctx.fillStyle = `hsl(${hue}, 80%, ${55 + value * 15}%)`;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [frequencyData, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={48}
      className={`rounded ${className}`}
      aria-label="오디오 레벨 시각화"
    />
  );
}
