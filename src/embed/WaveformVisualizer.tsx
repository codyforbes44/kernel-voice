import React, { useMemo, useEffect, useRef, useState } from 'react';

export type WaveformStyle = 'bars' | 'wave' | 'circular';

interface WaveformVisualizerProps {
  audioLevel: number; // 0-1
  isActive: boolean;
  primaryColor: string;
  style?: WaveformStyle;
  barCount?: number;
  className?: string;
}

export function WaveformVisualizer({
  audioLevel,
  isActive,
  primaryColor,
  style = 'bars',
  barCount = 9,
  className = '',
}: WaveformVisualizerProps) {
  if (!isActive) return null;

  switch (style) {
    case 'wave':
      return (
        <SineWaveVisualizer
          audioLevel={audioLevel}
          isActive={isActive}
          primaryColor={primaryColor}
          className={className}
        />
      );
    case 'circular':
      return (
        <CircularWaveform
          audioLevel={audioLevel}
          isActive={isActive}
          primaryColor={primaryColor}
        />
      );
    case 'bars':
    default:
      return (
        <BarVisualizer
          audioLevel={audioLevel}
          isActive={isActive}
          primaryColor={primaryColor}
          barCount={barCount}
          className={className}
        />
      );
  }
}

// Bar-based visualizer (original)
interface BarVisualizerProps {
  audioLevel: number;
  isActive: boolean;
  primaryColor: string;
  barCount?: number;
  className?: string;
}

function BarVisualizer({
  audioLevel,
  isActive,
  primaryColor,
  barCount = 9,
  className = '',
}: BarVisualizerProps) {
  const bars = useMemo(() => {
    const center = Math.floor(barCount / 2);
    return Array.from({ length: barCount }, (_, i) => {
      const distanceFromCenter = Math.abs(i - center);
      const baseMultiplier = 1 - (distanceFromCenter / center) * 0.6;
      const randomOffset = Math.sin(i * 1.5) * 0.2;
      
      return {
        baseMultiplier: baseMultiplier + randomOffset,
        delay: i * 0.05,
      };
    });
  }, [barCount]);

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
        const minHeight = 4;
        const maxHeight = 28;
        const levelContribution = audioLevel * bar.baseMultiplier;
        const height = minHeight + (levelContribution * (maxHeight - minHeight));
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
            0% { transform: scaleY(0.85); }
            100% { transform: scaleY(1); }
          }
        `}
      </style>
    </div>
  );
}

// Sine wave visualizer - smooth flowing wave
interface SineWaveVisualizerProps {
  audioLevel: number;
  isActive: boolean;
  primaryColor: string;
  className?: string;
}

function SineWaveVisualizer({
  audioLevel,
  isActive,
  primaryColor,
  className = '',
}: SineWaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const [smoothLevel, setSmoothLevel] = useState(0);

  // Smooth the audio level for less jittery animation
  useEffect(() => {
    setSmoothLevel(prev => prev + (audioLevel - prev) * 0.3);
  }, [audioLevel]);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `${primaryColor}33`);
      gradient.addColorStop(0.5, primaryColor);
      gradient.addColorStop(1, `${primaryColor}33`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw main wave
      ctx.beginPath();
      
      const amplitude = (height / 3) * (0.3 + smoothLevel * 0.7);
      const frequency = 0.03;
      const speed = 0.08;
      
      phaseRef.current += speed;

      for (let x = 0; x <= width; x++) {
        const y = height / 2 + 
          Math.sin(x * frequency + phaseRef.current) * amplitude * 0.7 +
          Math.sin(x * frequency * 2 + phaseRef.current * 1.5) * amplitude * 0.3;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();

      // Draw glow effect
      ctx.strokeStyle = `${primaryColor}40`;
      ctx.lineWidth = 6;
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, primaryColor, smoothLevel]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={32}
      className={className}
      style={{
        display: 'block',
      }}
    />
  );
}

// Circular waveform for compact spaces
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
