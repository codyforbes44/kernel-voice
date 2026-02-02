import React from 'react';

interface AudioLevelIndicatorProps {
  level: number; // 0-1
  isActive: boolean;
  primaryColor: string;
  barCount?: number;
}

export function AudioLevelIndicator({
  level,
  isActive,
  primaryColor,
  barCount = 5,
}: AudioLevelIndicatorProps) {
  if (!isActive) return null;

  // Create bars with staggered heights based on audio level
  const bars = Array.from({ length: barCount }, (_, i) => {
    const threshold = (i + 1) / barCount;
    const isActive = level >= threshold * 0.5;
    const height = isActive ? 12 + level * 12 * ((i + 1) / barCount) : 4;
    
    return (
      <div
        key={i}
        style={{
          width: '3px',
          height: `${height}px`,
          borderRadius: '2px',
          background: isActive ? primaryColor : '#d1d5db',
          transition: 'height 0.05s ease-out, background 0.1s ease',
        }}
      />
    );
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        height: '24px',
      }}
    >
      {bars}
    </div>
  );
}

// Waveform style indicator (alternative visual)
interface WaveformIndicatorProps {
  level: number;
  isActive: boolean;
  primaryColor: string;
}

export function WaveformIndicator({
  level,
  isActive,
  primaryColor,
}: WaveformIndicatorProps) {
  if (!isActive) return null;

  // Create animated waveform bars
  const waveformBars = [0.6, 1, 0.7, 0.9, 0.5].map((baseHeight, i) => {
    const animatedHeight = 4 + (level * 16 * baseHeight);
    const delay = i * 0.1;

    return (
      <div
        key={i}
        style={{
          width: '3px',
          height: `${animatedHeight}px`,
          borderRadius: '1.5px',
          background: primaryColor,
          transition: 'height 0.08s ease-out',
          animation: isActive ? `wave 0.6s ease-in-out ${delay}s infinite alternate` : 'none',
        }}
      />
    );
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        height: '24px',
      }}
    >
      {waveformBars}
      <style>
        {`
          @keyframes wave {
            0% { transform: scaleY(0.5); }
            100% { transform: scaleY(1); }
          }
        `}
      </style>
    </div>
  );
}
