import React, { useEffect } from 'react';
import { useWidgetTheme } from './WidgetTheme';
import { useWidgetVoiceConversation, VoiceConversationState } from './useWidgetVoiceConversation';
import { WidgetMessage } from './types';
import { MessageCircle } from 'lucide-react';

interface WidgetVoiceModeProps {
  apiKey: string;
  sessionId: string;
  systemPrompt?: string;
  enableKB?: boolean;
  kbDocumentIds?: string[];
  supabaseUrl: string;
  supabaseKey: string;
  ttsVoiceId?: string;
  autoListen?: boolean;
  onMessage: (message: WidgetMessage) => void;
  onExitVoiceMode: () => void;
}

// Animated orb component (pure CSS, no framer-motion)
function VoiceOrb({ state, audioLevel, primaryColor }: { state: VoiceConversationState; audioLevel: number; primaryColor: string }) {
  const baseSize = 100;
  const pulseScale = state === 'listening' ? 1 + audioLevel * 0.3 : 1;
  const glowSize = state === 'listening' ? 20 + audioLevel * 30 : state === 'speaking' ? 25 : 10;

  const stateColors: Record<VoiceConversationState, string> = {
    idle: primaryColor,
    listening: primaryColor,
    thinking: '#f59e0b',
    speaking: '#22c55e',
  };

  const color = stateColors[state];

  return (
    <div
      style={{
        position: 'relative',
        width: `${baseSize}px`,
        height: `${baseSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: `-${glowSize}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          transition: 'all 0.15s ease-out',
          animation: state === 'idle' ? 'orb-breathe 3s ease-in-out infinite' : undefined,
        }}
      />

      {/* Main orb */}
      <div
        style={{
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}88)`,
          boxShadow: `0 0 ${glowSize}px ${color}60, inset 0 -4px 12px rgba(0,0,0,0.2)`,
          transform: `scale(${pulseScale})`,
          transition: 'transform 0.1s ease-out, background 0.3s, box-shadow 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: state === 'thinking' ? 'orb-spin 2s linear infinite' : undefined,
        }}
      >
        {/* Inner icon/indicator */}
        {state === 'thinking' ? (
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'orb-spinner 0.8s linear infinite',
          }} />
        ) : state === 'speaking' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: '3px',
                height: '100%',
                backgroundColor: '#fff',
                borderRadius: '2px',
                animation: `orb-speak-bar 0.7s ease-in-out ${i * 0.08}s infinite`,
                transformOrigin: 'center',
              }} />
            ))}
          </div>
        ) : (
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: state === 'listening' ? '#ef4444' : 'rgba(255,255,255,0.6)',
            animation: state === 'listening' ? 'orb-rec-pulse 1s ease-in-out infinite' : undefined,
          }} />
        )}
      </div>

      <style>{`
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes orb-spin {
          from { box-shadow: 0 0 20px ${primaryColor}60, inset 0 -4px 12px rgba(0,0,0,0.2), 0 0 40px ${primaryColor}30; }
          50% { box-shadow: 0 0 30px #f59e0b60, inset 0 -4px 12px rgba(0,0,0,0.2), 0 0 60px #f59e0b20; }
          to { box-shadow: 0 0 20px ${primaryColor}60, inset 0 -4px 12px rgba(0,0,0,0.2), 0 0 40px ${primaryColor}30; }
        }
        @keyframes orb-spinner {
          to { transform: rotate(360deg); }
        }
        @keyframes orb-speak-bar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @keyframes orb-rec-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

export function WidgetVoiceMode({
  apiKey,
  sessionId,
  systemPrompt,
  enableKB,
  kbDocumentIds,
  supabaseUrl,
  supabaseKey,
  ttsVoiceId,
  autoListen = true,
  onMessage,
  onExitVoiceMode,
}: WidgetVoiceModeProps) {
  const { theme } = useWidgetTheme();

  const voice = useWidgetVoiceConversation({
    apiKey,
    sessionId,
    systemPrompt,
    enableKB,
    kbDocumentIds,
    supabaseUrl,
    supabaseKey,
    ttsVoiceId,
    autoListen,
    onMessage,
    onError: (err) => console.error('[VoiceMode]', err),
  });

  // Auto-start listening when mounted
  useEffect(() => {
    voice.start();
    return () => voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateLabels: Record<VoiceConversationState, string> = {
    idle: 'Tap to speak',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '24px',
        background: theme.backgroundColor,
        position: 'relative',
      }}
    >
      {/* Orb */}
      <div onClick={voice.togglePause} style={{ cursor: 'pointer' }}>
        <VoiceOrb state={voice.state} audioLevel={voice.audioLevel} primaryColor={theme.primaryColor} />
      </div>

      {/* State label */}
      <div style={{ fontSize: '14px', fontWeight: 500, color: theme.textColor, opacity: 0.8 }}>
        {stateLabels[voice.state]}
      </div>

      {/* Partial transcript */}
      {voice.partialTranscript && (
        <div
          style={{
            maxWidth: '85%',
            padding: '10px 16px',
            background: 'var(--kernel-surface)',
            borderRadius: 'var(--kernel-bubble-radius)',
            fontSize: '13px',
            color: theme.textColor,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {voice.partialTranscript}
        </div>
      )}

      {/* Back to chat button */}
      <button
        onClick={() => {
          voice.stop();
          onExitVoiceMode();
        }}
        style={{
          position: 'absolute',
          bottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          background: 'var(--kernel-surface)',
          border: `1px solid var(--kernel-border)`,
          borderRadius: '20px',
          color: theme.textColor,
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
      >
        <MessageCircle size={14} />
        Back to chat
      </button>
    </div>
  );
}
