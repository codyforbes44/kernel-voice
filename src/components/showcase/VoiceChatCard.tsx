import { useState, useCallback } from 'react';
import { Phone, Loader2 } from 'lucide-react';
import { useGeminiLiveConversation } from '@/hooks/useGeminiLiveConversation';

export function VoiceChatCard() {
  const [transcripts, setTranscripts] = useState<Array<{ role: string; text: string }>>([]);

  const gemini = useGeminiLiveConversation({
    onTranscript: (t) => setTranscripts((prev) => [...prev.slice(-3), t]),
    systemPrompt: 'You are a friendly customer support agent. Keep responses very short, 1-2 sentences.',
  });

  const isLive = gemini.status === 'connected';
  const isConnecting = gemini.status === 'connecting';

  const toggle = useCallback(() => {
    if (isLive) {
      gemini.endSession();
      setTranscripts([]);
    } else {
      gemini.startSession();
    }
  }, [isLive, gemini]);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 sm:p-6 flex flex-col items-center gap-3 h-full">
      <div
        className="h-16 w-16 rounded-full bg-gradient-to-br from-primary via-secondary to-accent shadow-lg transition-transform"
        style={{
          boxShadow: isLive ? '0 0 30px hsl(180 100% 50% / 0.3)' : undefined,
          transform: gemini.isSpeaking ? `scale(${1 + gemini.outputAudioLevel * 0.15})` : isLive ? `scale(${1 + gemini.inputAudioLevel * 0.1})` : 'scale(1)',
        }}
      />
      <div className="text-center">
        <h3 className="text-sm font-semibold text-foreground font-display">Customer Support</h3>
        <p className="text-xs text-muted-foreground">
          {isConnecting ? 'Connecting…' : isLive ? (gemini.isSpeaking ? 'Speaking…' : 'Listening…') : 'Tap to start voice chat'}
        </p>
      </div>
      {transcripts.length > 0 && (
        <div className="w-full max-h-12 overflow-y-auto space-y-1 px-1 scrollbar-hide">
          {transcripts.map((t, i) => (
            <p key={i} className={`text-xs truncate ${t.role === 'user' ? 'text-primary/80 text-right' : 'text-muted-foreground'}`}>
              {t.text}
            </p>
          ))}
        </div>
      )}
      <button
        onClick={toggle}
        disabled={isConnecting}
        className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors shadow-lg min-h-[48px] min-w-[48px] ${
          isLive ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/30' : 'bg-primary hover:bg-primary/90 shadow-primary/30'
        } disabled:opacity-50`}
      >
        {isConnecting ? <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" /> : <Phone className="h-5 w-5 text-primary-foreground" />}
      </button>
    </div>
  );
}
