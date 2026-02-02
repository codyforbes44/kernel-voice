import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { useWidgetTheme } from './WidgetTheme';
import { useWidgetVoice } from './useWidgetVoice';
import { AudioLevelIndicator } from './AudioLevelIndicator';

interface WidgetInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  enableVoice?: boolean;
}

export function WidgetInput({ onSend, isLoading, disabled, enableVoice = false }: WidgetInputProps) {
  const { config, theme } = useWidgetTheme();
  const [message, setMessage] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported, audioLevel, toggleListening } = useWidgetVoice({
    onTranscript: (text) => {
      // Send the transcribed text directly
      if (text.trim()) {
        onSend(text.trim());
      }
    },
    onError: (error) => {
      setVoiceError(error);
      setTimeout(() => setVoiceError(null), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    setMessage('');
    onSend(trimmedMessage);
  };

  useEffect(() => {
    if (!isLoading && inputRef.current && !isListening) {
      inputRef.current.focus();
    }
  }, [isLoading, isListening]);

  const showVoiceButton = enableVoice && isSupported;

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

      {/* Audio level indicator - shows above input when recording */}
      {isListening && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              animation: 'pulse-dot 1s ease-in-out infinite',
            }}
          />
          <AudioLevelIndicator
            level={audioLevel}
            isActive={isListening}
            primaryColor={theme.primaryColor}
            barCount={7}
          />
          <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>
            Listening...
          </span>
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
            onClick={toggleListening}
            disabled={isLoading || disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: isListening ? '#ef4444' : '#f3f4f6',
              color: isListening ? '#ffffff' : theme.primaryColor,
              cursor: isLoading || disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
              animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
            aria-label={isListening ? 'Stop recording' : 'Start voice input'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isListening ? 'Listening...' : (config.placeholder || 'Type your message...')}
          disabled={isLoading || disabled || isListening}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: isListening ? `2px solid ${theme.primaryColor}` : '1px solid #e5e5e5',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            color: theme.textColor,
            background: isListening ? '#f0fdf4' : '#fafafa',
          }}
          onFocus={(e) => {
            if (!isListening) {
              e.currentTarget.style.borderColor = theme.primaryColor;
            }
          }}
          onBlur={(e) => {
            if (!isListening) {
              e.currentTarget.style.borderColor = '#e5e5e5';
            }
          }}
          aria-label="Message input"
        />

        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled || isListening}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: !message.trim() || isLoading || disabled || isListening
              ? '#e5e5e5'
              : theme.primaryColor,
            color: !message.trim() || isLoading || disabled || isListening
              ? '#a0a0a0'
              : '#ffffff',
            cursor: !message.trim() || isLoading || disabled || isListening
              ? 'not-allowed'
              : 'pointer',
            transition: 'background 0.2s, transform 0.1s',
            flexShrink: 0,
          }}
          onMouseDown={(e) => {
            if (!(!message.trim() || isLoading || disabled || isListening)) {
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
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}
        </style>
      </form>
    </div>
  );
}
