import { useState, useCallback, useRef, useEffect } from 'react';

interface UseElevenLabsSTTOptions {
  onTranscript: (text: string) => void;
  onPartialTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  supabaseUrl: string;
  supabaseKey: string;
}

interface UseElevenLabsSTTReturn {
  isListening: boolean;
  isConnecting: boolean;
  audioLevel: number;
  partialTranscript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useElevenLabsSTT({
  onTranscript,
  onPartialTranscript,
  onError,
  supabaseUrl,
  supabaseKey,
}: UseElevenLabsSTTOptions): UseElevenLabsSTTReturn {
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [partialTranscript, setPartialTranscript] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioLevel(0);
    setPartialTranscript('');
  }, []);

  // Analyze audio levels for visualization
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isListening) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);
    
    setAudioLevel(normalizedLevel);
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [isListening]);

  // Convert Float32 to Int16 PCM
  const float32ToInt16 = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  // Resample audio from source rate to 16kHz
  const resample = (audioData: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array => {
    if (fromSampleRate === toSampleRate) {
      return audioData;
    }
    
    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
      const t = srcIndex - srcIndexFloor;
      result[i] = audioData[srcIndexFloor] * (1 - t) + audioData[srcIndexCeil] * t;
    }
    
    return result;
  };

  const startListening = useCallback(async () => {
    if (isListening || isConnecting) return;

    setIsConnecting(true);
    accumulatedTranscriptRef.current = '';

    try {
      // Get scribe token from edge function
      const tokenResponse = await fetch(
        `${supabaseUrl}/functions/v1/elevenlabs-scribe-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get token: ${tokenResponse.status}`);
      }

      const { token } = await tokenResponse.json();
      
      if (!token) {
        throw new Error('No token received from server');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        } 
      });
      mediaStreamRef.current = stream;

      // Setup WebSocket connection to ElevenLabs
      const ws = new WebSocket(`wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[ElevenLabs STT] WebSocket connected');
        setIsConnecting(false);
        setIsListening(true);

        // Setup audio processing
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        
        // Analyser for visualization
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
        source.connect(analyser);

        // ScriptProcessor for sending audio
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          
          const inputData = e.inputBuffer.getChannelData(0);
          const resampled = resample(inputData, audioContext.sampleRate, 16000);
          const pcm16 = float32ToInt16(resampled);
          
          // Convert to base64
          const uint8Array = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64Audio = btoa(binary);
          
          // Send audio chunk
          ws.send(JSON.stringify({
            audio: base64Audio,
          }));
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);

        // Start audio level animation
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'transcript') {
            // Partial transcript
            const text = data.transcript || '';
            setPartialTranscript(text);
            onPartialTranscript?.(text);
          } else if (data.type === 'final_transcript') {
            // Final transcript segment
            const text = data.transcript || '';
            if (text.trim()) {
              accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + text.trim();
              setPartialTranscript('');
            }
          }
        } catch (e) {
          console.error('[ElevenLabs STT] Parse error:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('[ElevenLabs STT] WebSocket error:', error);
        onError?.('Connection error. Please try again.');
        cleanup();
        setIsConnecting(false);
        setIsListening(false);
      };

      ws.onclose = (event) => {
        console.log('[ElevenLabs STT] WebSocket closed:', event.code, event.reason);
        
        // Send accumulated transcript when connection closes
        if (accumulatedTranscriptRef.current.trim()) {
          onTranscript(accumulatedTranscriptRef.current.trim());
          accumulatedTranscriptRef.current = '';
        }
        
        cleanup();
        setIsConnecting(false);
        setIsListening(false);
      };

    } catch (error) {
      console.error('[ElevenLabs STT] Start error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to start voice input');
      cleanup();
      setIsConnecting(false);
      setIsListening(false);
    }
  }, [isListening, isConnecting, supabaseUrl, supabaseKey, onTranscript, onPartialTranscript, onError, cleanup, analyzeAudio]);

  const stopListening = useCallback(() => {
    if (!isListening && !isConnecting) return;
    
    // Send final transcript
    if (accumulatedTranscriptRef.current.trim()) {
      onTranscript(accumulatedTranscriptRef.current.trim());
      accumulatedTranscriptRef.current = '';
    }
    
    cleanup();
    setIsConnecting(false);
    setIsListening(false);
  }, [isListening, isConnecting, onTranscript, cleanup]);

  const toggleListening = useCallback(() => {
    if (isListening || isConnecting) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, isConnecting, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isListening,
    isConnecting,
    audioLevel,
    partialTranscript,
    startListening,
    stopListening,
    toggleListening,
  };
}
