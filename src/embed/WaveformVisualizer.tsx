import React, { useMemo } from 'react';

interface WaveformVisualizerProps {
  audioLevel: number; // 0-1
  isActive: boolean;
  primaryColor: string;
  barCount?: number;
  className?: string;
}

export function WaveformVisualizer({
  audioLevel,
  isActive,
  primaryColor,
  barCount = 9,
  className = '',
}: WaveformVisualizerProps) {
  // Generate bar heights with a wave pattern centered in the middle
  const bars = useMemo(() => {
    const center = Math.floor(barCount / 2);
    return Array.from({ length: barCount }, (_, i) => {
      // Create a bell curve effect - taller in the middle
      const distanceFromCenter = Math.abs(i - center);
      const baseMultiplier = 1 - (distanceFromCenter / center) * 0.6;
      
      // Add some randomness based on position for organic feel
      const randomOffset = Math.sin(i * 1.5) * 0.2;
      
      return {
        baseMultiplier: baseMultiplier + randomOffset,
        delay: i * 0.05,
      };
    });
  }, [barCount]);

  if (!isActive) return null;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        height: '32px',
        padding: '0 4px',
      }}
    >
      {bars.map((bar, i) => {
        // Calculate height based on audio level and bar's base multiplier
        const minHeight = 4;
        const maxHeight = 28;
        const levelContribution = audioLevel * bar.baseMultiplier;
        const height = minHeight + (levelContribution * (maxHeight - minHeight));
        
        // Subtle opacity variation based on distance from center
        const opacity = 0.7 + (bar.baseMultiplier * 0.3);

        return (
          <div
            key={i}
            style={{
              width: '4px',
              height: `${height}px`,
              minHeight: `${minHeight}px`,
              borderRadius: '2px',
              background: primaryColor,
              opacity,
              transition: 'height 0.06s ease-out',
              animation: isActive 
                ? `waveform-pulse 0.8s ease-in-out ${bar.delay}s infinite alternate`
                : 'none',
            }}
          />
        );
      })}
      <style>
        {`
          @keyframes waveform-pulse {
            0% { 
              transform: scaleY(0.85);
            }
            100% { 
              transform: scaleY(1);
            }
          }
        `}
      </style>
    </div>
  );
}

// Compact circular waveform for tight spaces
interface CircularWaveformProps {
  audioLevel: number;
  isActive: boolean;
  primaryColor: string;
  size?: number;
}

export function CircularWaveform({
  audioLevel,
  isActive,
  primaryColor,
  size = 40,
}: CircularWaveformProps) {
  if (!isActive) return null;

  const ringCount = 3;
  const baseSize = size * 0.4;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Animated rings */}
      {Array.from({ length: ringCount }, (_, i) => {
        const ringSize = baseSize + (audioLevel * 15 * (i + 1));
        const opacity = 0.8 - (i * 0.25);
        const delay = i * 0.15;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${ringSize}px`,
              height: `${ringSize}px`,
              borderRadius: '50%',
              border: `2px solid ${primaryColor}`,
              opacity: opacity * (0.5 + audioLevel * 0.5),
              transition: 'all 0.1s ease-out',
              animation: `ring-expand 1s ease-out ${delay}s infinite`,
            }}
          />
        );
      })}
      
      {/* Center dot */}
      <div
        style={{
          width: `${baseSize * 0.6}px`,
          height: `${baseSize * 0.6}px`,
          borderRadius: '50%',
          background: primaryColor,
          boxShadow: `0 0 ${8 + audioLevel * 12}px ${primaryColor}`,
          transition: 'box-shadow 0.1s ease-out',
        }}
      />
      
      <style>
        {`
          @keyframes ring-expand {
            0% {
              transform: scale(0.8);
              opacity: 0.8;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}
