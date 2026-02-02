import React, { useRef, useEffect } from 'react';
import { WidgetMessage } from './types';
import { useWidgetTheme } from './WidgetTheme';
import { Bot, User } from 'lucide-react';

interface WidgetChatProps {
  messages: WidgetMessage[];
  isLoading: boolean;
}

export function WidgetChat({ messages, isLoading }: WidgetChatProps) {
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
      }}
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} theme={theme} />
      ))}

      {isLoading && <LoadingIndicator theme={theme} />}
    </div>
  );
}

interface MessageBubbleProps {
  message: WidgetMessage;
  theme: { primaryColor: string; textColor: string; accentColor: string };
}

function MessageBubble({ message, theme }: MessageBubbleProps) {
  const isUser = message.role === 'user';

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
        }}
      >
        {message.content}
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
