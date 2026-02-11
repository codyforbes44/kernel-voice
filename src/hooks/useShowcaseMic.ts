import { useState, useRef, useCallback, useEffect } from 'react';

interface UseShowcaseMicReturn {
  audioLevel: number;
  frequencyData: Uint8Array | null;
  isActive: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function useShowcaseMic(): UseShowcaseMicReturn {
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [isActive, setIsActive] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef(0);

  const tick = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length) / 255;
    setAudioLevel(Math.min(1, rms * 2.5));
    setFrequencyData(new Uint8Array(data));

    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsActive(false);
    setAudioLevel(0);
    setFrequencyData(null);
  }, []);

  const start = useCallback(async () => {
    stop();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    mediaStreamRef.current = stream;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;
    source.connect(analyser);

    setIsActive(true);
    frameRef.current = requestAnimationFrame(tick);
  }, [stop, tick]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { audioLevel, frequencyData, isActive, start, stop };
}
