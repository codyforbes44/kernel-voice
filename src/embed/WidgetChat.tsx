import React, { useRef, useEffect } from 'react';
import { WidgetMessage } from './types';
import { useWidgetTheme } from './WidgetTheme';
import { Bot, User, Volume2, VolumeX } from 'lucide-react';

interface WidgetChatProps {
  messages: WidgetMessage[];
  isLoading: boolean;
  enableTTS?: boolean;
  isSpeaking?: boolean;
  isTTSEnabled?: boolean;
  onToggleTTS?: () => void;
  onStopSpeaking?: () => void;
  onSpeak?: (text: string) => void;
}

export function WidgetChat({ 
  messages, 
  isLoading,
  enableTTS = false,
  isSpeaking = false,
  isTTSEnabled = true,
  onToggleTTS,
  onStopSpeaking,
  onSpeak,
}: WidgetChatProps) {
  const { theme } = useWidgetTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: theme.backgroundColor,
        position: 'relative',
      }}
    >
      {/* TTS toggle button */}
      {enableTTS && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '4px',
            zIndex: 10,
          }}
        >
          <button
            onClick={isSpeaking ? onStopSpeaking : onToggleTTS}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '16px',
              border: 'none',
              background: isSpeaking ? '#ef4444' : (isTTSEnabled ? theme.primaryColor : '#e5e5e5'),
              color: isSpeaking || isTTSEnabled ? '#fff' : '#666',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isSpeaking ? `0 0 0 3px ${theme.primaryColor}40, 0 2px 8px rgba(0,0,0,0.1)` : '0 2px 8px rgba(0,0,0,0.1)',
              animation: isSpeaking ? 'speaking-pulse 1.5s ease-in-out infinite' : 'none',
            }}
            title={isSpeaking ? 'Stop speaking' : (isTTSEnabled ? 'Voice responses on' : 'Voice responses off')}
          >
            {isSpeaking ? (
              <>
                <SpeakingWaveform color="#fff" />
                Speaking
              </>
            ) : isTTSEnabled ? (
              <>
                <Volume2 size={14} />
                Voice On
              </>
            ) : (
              <>
                <VolumeX size={14} />
                Voice Off
              </>
            )}
          </button>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          theme={theme}
          enableTTS={enableTTS && isTTSEnabled}
          onSpeak={onSpeak}
        />
      ))}

      {isLoading && <LoadingIndicator theme={theme} />}
    </div>
  );
}

interface MessageBubbleProps {
  message: WidgetMessage;
  theme: { primaryColor: string; textColor: string; accentColor: string };
  enableTTS?: boolean;
  onSpeak?: (text: string) => void;
}

function MessageBubble({ message, theme, enableTTS, onSpeak }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const handleSpeak = () => {
    if (enableTTS && onSpeak && !isUser) {
      onSpeak(message.content);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser ? theme.primaryColor : '#f0f0f0',
          color: isUser ? '#ffffff' : theme.textColor,
        }}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div
        style={{
          maxWidth: '75%',
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? theme.primaryColor : '#f0f0f0',
          color: isUser ? '#ffffff' : theme.textColor,
          fontSize: '14px',
          lineHeight: '1.4',
          wordBreak: 'break-word',
          position: 'relative',
        }}
      >
        {message.content}
        
        {/* Speak button for assistant messages */}
        {enableTTS && !isUser && (
          <button
            onClick={handleSpeak}
            style={{
              position: 'absolute',
              bottom: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: 'none',
              background: theme.primaryColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              opacity: 0.8,
              transition: 'opacity 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Play this message"
          >
            <Volume2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingIndicator({ theme }: { theme: { accentColor: string } }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f0f0',
        }}
      >
        <Bot size={14} />
      </div>
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '16px 16px 16px 4px',
          background: '#f0f0f0',
          display: 'flex',
          gap: '4px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: theme.accentColor,
              opacity: 0.6,
              animation: `pulse 1.4s infinite ${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style>
        {`
          @keyframes pulse {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}

// Animated waveform for speaking state
function SpeakingWaveform({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: '2px',
            height: '100%',
            backgroundColor: color,
            borderRadius: '1px',
            animation: `speaking-bar 0.8s ease-in-out ${i * 0.1}s infinite`,
            transformOrigin: 'center',
          }}
        />
      ))}
      <style>
        {`
          @keyframes speaking-bar {
            0%, 100% { transform: scaleY(0.4); }
            50% { transform: scaleY(1); }
          }
          @keyframes speaking-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
          }
        `}
      </style>
    </div>
  );
}
