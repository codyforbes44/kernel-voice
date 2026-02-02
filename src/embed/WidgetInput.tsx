import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useWidgetTheme } from './WidgetTheme';

interface WidgetInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function WidgetInput({ onSend, isLoading, disabled }: WidgetInputProps) {
  const { config, theme } = useWidgetTheme();
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    setMessage('');
    onSend(trimmedMessage);
  };

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  return (
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
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={config.placeholder || 'Type your message...'}
        disabled={isLoading || disabled}
        style={{
          flex: 1,
          padding: '10px 14px',
          border: '1px solid #e5e5e5',
          borderRadius: '20px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s',
          color: theme.textColor,
          background: '#fafafa',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.primaryColor;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e5e5e5';
        }}
        aria-label="Message input"
      />

      <button
        type="submit"
        disabled={!message.trim() || isLoading || disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          background: !message.trim() || isLoading || disabled
            ? '#e5e5e5'
            : theme.primaryColor,
          color: !message.trim() || isLoading || disabled
            ? '#a0a0a0'
            : '#ffffff',
          cursor: !message.trim() || isLoading || disabled
            ? 'not-allowed'
            : 'pointer',
          transition: 'background 0.2s, transform 0.1s',
          flexShrink: 0,
        }}
        onMouseDown={(e) => {
          if (!(!message.trim() || isLoading || disabled)) {
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
        `}
      </style>
    </form>
  );
}
