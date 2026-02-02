import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { useWidgetTheme } from './WidgetTheme';
import { useWidgetVoice } from './useWidgetVoice';
import { useElevenLabsSTT } from './useElevenLabsSTT';
import { WaveformVisualizer } from './WaveformVisualizer';

interface WidgetInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  enableVoice?: boolean;
  voiceProvider?: 'native' | 'elevenlabs';
  supabaseUrl?: string;
  supabaseKey?: string;
}

export function WidgetInput({ 
  onSend, 
  isLoading, 
  disabled, 
  enableVoice = false,
  voiceProvider = 'native',
  supabaseUrl = '',
  supabaseKey = '',
}: WidgetInputProps) {
  const { config, theme } = useWidgetTheme();
  const [message, setMessage] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Native browser speech recognition
  const nativeVoice = useWidgetVoice({
    onTranscript: (text) => {
      if (text.trim()) {
        onSend(text.trim());
      }
    },
    onError: (error) => {
      setVoiceError(error);
      setTimeout(() => setVoiceError(null), 3000);
    },
  });

  // ElevenLabs speech-to-text
  const elevenLabsVoice = useElevenLabsSTT({
    onTranscript: (text) => {
      if (text.trim()) {
        onSend(text.trim());
      }
    },
    onPartialTranscript: (text) => {
      // Could show partial transcript in UI if desired
    },
    onError: (error) => {
      setVoiceError(error);
      setTimeout(() => setVoiceError(null), 3000);
    },
    supabaseUrl,
    supabaseKey,
  });

  // Select the appropriate voice hook based on provider
  const useElevenLabs = voiceProvider === 'elevenlabs' && supabaseUrl && supabaseKey;
  const voice = useElevenLabs ? {
    isListening: elevenLabsVoice.isListening || elevenLabsVoice.isConnecting,
    isSupported: true, // ElevenLabs works in all browsers with WebSocket support
    audioLevel: elevenLabsVoice.audioLevel,
    toggleListening: elevenLabsVoice.toggleListening,
    isConnecting: elevenLabsVoice.isConnecting,
    partialTranscript: elevenLabsVoice.partialTranscript,
  } : {
    isListening: nativeVoice.isListening,
    isSupported: nativeVoice.isSupported,
    audioLevel: nativeVoice.audioLevel,
    toggleListening: nativeVoice.toggleListening,
    isConnecting: false,
    partialTranscript: nativeVoice.partialTranscript,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    setMessage('');
    onSend(trimmedMessage);
  };

  useEffect(() => {
    if (!isLoading && inputRef.current && !voice.isListening) {
      inputRef.current.focus();
    }
  }, [isLoading, voice.isListening]);

  const showVoiceButton = enableVoice && voice.isSupported;

  return (
    <div style={{ position: 'relative' }}>
      {/* Voice error tooltip */}
      {voiceError && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '16px',
            right: '16px',
            marginBottom: '8px',
            padding: '8px 12px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {voiceError}
        </div>
      )}

      {/* Waveform visualizer and transcript - shows above input when recording */}
      {voice.isListening && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '12px',
            right: '12px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Interim transcript bubble */}
          {voice.partialTranscript && (
            <div
              style={{
                alignSelf: 'flex-end',
                maxWidth: '85%',
                padding: '10px 14px',
                background: theme.primaryColor,
                color: '#fff',
                borderRadius: '16px 16px 4px 16px',
                fontSize: '14px',
                lineHeight: '1.4',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              {voice.partialTranscript}
              <span 
                style={{ 
                  display: 'inline-block',
                  width: '2px',
                  height: '14px',
                  marginLeft: '2px',
                  background: 'rgba(255,255,255,0.7)',
                  animation: 'blink 1s infinite',
                  verticalAlign: 'middle',
                }}
              />
            </div>
          )}

          {/* Waveform indicator pill */}
          <div
            style={{
              alignSelf: 'center',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(30, 30, 30, 0.95) 100%)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1), 0 0 20px ${theme.primaryColor}33`,
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Pulsing record indicator */}
            <div
              style={{
                position: 'relative',
                width: '10px',
                height: '10px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse-dot 1s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: '2px solid #ef4444',
                  opacity: 0.5,
                  animation: 'pulse-ring 1.5s ease-out infinite',
                }}
              />
            </div>
            
            {/* Waveform */}
            <WaveformVisualizer
              audioLevel={voice.audioLevel}
              isActive={voice.isListening}
              primaryColor={theme.primaryColor}
              barCount={9}
            />
            
            {/* Status text */}
            <span style={{ 
              color: '#fff', 
              fontSize: '12px', 
              fontWeight: 500,
            }}>
              {voice.isConnecting ? 'Connecting...' : 'Listening'}
            </span>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderTop: '1px solid #e5e5e5',
          background: theme.backgroundColor,
          borderRadius: '0 0 var(--kernel-radius) var(--kernel-radius)',
        }}
      >
        {/* Voice button */}
        {showVoiceButton && (
          <button
            type="button"
            onClick={voice.toggleListening}
            disabled={isLoading || disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: voice.isListening ? '#ef4444' : '#f3f4f6',
              color: voice.isListening ? '#ffffff' : theme.primaryColor,
              cursor: isLoading || disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
              animation: voice.isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
            aria-label={voice.isListening ? 'Stop recording' : 'Start voice input'}
          >
            {voice.isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={voice.isListening ? 'Listening...' : (config.placeholder || 'Type your message...')}
          disabled={isLoading || disabled || voice.isListening}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: voice.isListening ? `2px solid ${theme.primaryColor}` : '1px solid #e5e5e5',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            color: theme.textColor,
            background: voice.isListening ? '#f0fdf4' : '#fafafa',
          }}
          onFocus={(e) => {
            if (!voice.isListening) {
              e.currentTarget.style.borderColor = theme.primaryColor;
            }
          }}
          onBlur={(e) => {
            if (!voice.isListening) {
              e.currentTarget.style.borderColor = '#e5e5e5';
            }
          }}
          aria-label="Message input"
        />

        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled || voice.isListening}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: !message.trim() || isLoading || disabled || voice.isListening
              ? '#e5e5e5'
              : theme.primaryColor,
            color: !message.trim() || isLoading || disabled || voice.isListening
              ? '#a0a0a0'
              : '#ffffff',
            cursor: !message.trim() || isLoading || disabled || voice.isListening
              ? 'not-allowed'
              : 'pointer',
            transition: 'background 0.2s, transform 0.1s',
            flexShrink: 0,
          }}
          onMouseDown={(e) => {
            if (!(!message.trim() || isLoading || disabled || voice.isListening)) {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label={isLoading ? 'Sending...' : 'Send message'}
        >
          {isLoading ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={18} />
          )}
        </button>

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
              50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
            }
            @keyframes pulse-dot {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(0.9); }
            }
            @keyframes pulse-ring {
              0% { transform: scale(1); opacity: 0.6; }
              100% { transform: scale(2); opacity: 0; }
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
          `}
        </style>
      </form>
    </div>
  );
}
