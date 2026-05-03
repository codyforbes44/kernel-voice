import { useState, useRef, useCallback, useEffect } from 'react';
import { floatTo16BitPCM, arrayBufferToBase64, resampleAudio } from '@/lib/audioUtils';

export interface AudioCaptureOptions {
  targetSampleRate?: number;
  onAudioData?: (base64Audio: string) => void;
  onLevelChange?: (level: number) => void;
}

export interface UseAudioCaptureReturn {
  isRecording: boolean;
  inputLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

/**
 * Shared hook for audio capture with level monitoring.
 * Used by both Grok and OpenAI conversation hooks.
 */
export function useAudioCapture(options: AudioCaptureOptions = {}): UseAudioCaptureReturn {
  const { targetSampleRate = 24000, onAudioData, onLevelChange } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Keep callbacks in refs to avoid dependency issues
  const onAudioDataRef = useRef(onAudioData);
  const onLevelChangeRef = useRef(onLevelChange);
  
  useEffect(() => {
    onAudioDataRef.current = onAudioData;
    onLevelChangeRef.current = onLevelChange;
  }, [onAudioData, onLevelChange]);

  const stopRecording = useCallback(() => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    
    setInputLevel(0);
    onLevelChangeRef.current?.(0);
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    
    if (processorRef.current) {
      if ('port' in processorRef.current && processorRef.current.port) {
        processorRef.current.port.close();
      }
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log('[AudioCapture] Starting recording at target rate:', targetSampleRate);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        }
      });
      mediaStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Set up analyser for level monitoring
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      source.connect(analyser);
      
      // Level monitoring interval
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      levelIntervalRef.current = setInterval(() => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length) / 255;
          const level = Math.min(1, rms * 2);
          setInputLevel(level);
          onLevelChangeRef.current?.(level);
        }
      }, 50);
      
      // Audio processing callback
      const sendAudioData = (inputData: Float32Array) => {
        const resampled = resampleAudio(inputData, 48000, targetSampleRate);
        const pcmData = floatTo16BitPCM(resampled);
        const base64Audio = arrayBufferToBase64(pcmData);
        onAudioDataRef.current?.(base64Audio);
      };
      
      // Try AudioWorklet first, fallback to ScriptProcessor
      if (audioContextRef.current.audioWorklet) {
        try {
          console.log('[AudioCapture] Using AudioWorklet');
          await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
          
          const workletNode = new AudioWorkletNode(audioContextRef.current, 'voice-processor');
          processorRef.current = workletNode;
          
          workletNode.port.onmessage = (event) => {
            if (event.data.type === 'audio') {
              sendAudioData(event.data.data);
            }
          };
          
          source.connect(workletNode);
          workletNode.connect(audioContextRef.current.destination);
          console.log('[AudioCapture] AudioWorklet started');
        } catch (workletError) {
          console.warn('[AudioCapture] AudioWorklet failed, using ScriptProcessor:', workletError);
          setupScriptProcessor(source, sendAudioData);
        }
      } else {
        console.log('[AudioCapture] AudioWorklet not supported, using ScriptProcessor');
        setupScriptProcessor(source, sendAudioData);
      }
      
      function setupScriptProcessor(
        source: MediaStreamAudioSourceNode, 
        sendAudio: (data: Float32Array) => void
      ) {
        const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          sendAudio(new Float32Array(inputData));
        };
        
        source.connect(processor);
        processor.connect(audioContextRef.current!.destination);
        console.log('[AudioCapture] ScriptProcessor started');
      }
      
      setIsRecording(true);
    } catch (error) {
      console.error('[AudioCapture] Error starting recording:', error);
      stopRecording();
      throw error;
    }
  }, [targetSampleRate, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    inputLevel,
    startRecording,
    stopRecording,
  };
}
