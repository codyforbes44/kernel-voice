import { useState, useCallback, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useOpenAIConversation } from '@/hooks/useOpenAIConversation';

interface Transcript {
  role: 'user' | 'assistant';
  text: string;
}

export function OpenAIRealtimeCard() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const assistantBufferRef = useRef('');

  const handleTranscript = useCallback((t: { role: 'user' | 'assistant'; text: string }) => {
    if (t.role === 'user') {
      // Flush any buffered assistant text
      if (assistantBufferRef.current) {
        const final = assistantBufferRef.current;
        setTranscripts(prev => [...prev, { role: 'assistant', text: final }]);
        assistantBufferRef.current = '';
      }
      setTranscripts(prev => [...prev, { role: 'user', text: t.text }]);
    } else {
      // For assistant deltas, accumulate
      assistantBufferRef.current += t.text;
    }
  }, []);

  const conv = useOpenAIConversation({
    instructions: 'You are a friendly demo assistant. Keep responses to 1-2 sentences.',
    onTranscript: handleTranscript,
    onDisconnect: () => {
      if (assistantBufferRef.current) {
        const final = assistantBufferRef.current;
        setTranscripts(prev => [...prev, { role: 'assistant', text: final }]);
        assistantBufferRef.current = '';
      }
    },
  });

  const isConnected = conv.status === 'connected';
  const isConnecting = conv.status === 'connecting';
  const level = isConnected ? (conv.isSpeaking ? conv.outputAudioLevel : conv.inputAudioLevel) : 0;
  const ringScale = 1 + level * 0.6;
  const lastTranscripts = transcripts.slice(-3);

  const toggle = () => {
    if (isConnected) {
      conv.endSession();
    } else {
      setTranscripts([]);
      assistantBufferRef.current = '';
      conv.startSession();
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 sm:p-6 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground font-display">3BI Realtime</h3>
          <p className="text-xs text-muted-foreground">OpenAI WebRTC voice agent</p>
        </div>
        {conv.connectionError && (
          <span className="text-[10px] text-destructive truncate max-w-[120px]">{conv.connectionError}</span>
        )}
      </div>

      {/* Pulsing ring visual */}
      <div className="flex items-center justify-center py-4">
        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full border-2 border-primary/30 transition-transform duration-150"
            style={{ width: 80, height: 80, transform: `scale(${ringScale})` }}
          />
          <div
            className="absolute rounded-full border border-primary/20 transition-transform duration-150"
            style={{ width: 100, height: 100, transform: `scale(${1 + level * 0.3})` }}
          />
          <button
            onClick={toggle}
            disabled={isConnecting}
            className={`relative z-10 h-14 w-14 rounded-full flex items-center justify-center transition-colors min-h-[48px] min-w-[48px] ${
              isConnected
                ? 'bg-destructive text-destructive-foreground'
                : isConnecting
                ? 'bg-muted text-muted-foreground animate-pulse'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isConnected ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Transcript lines */}
      <div className="flex-1 min-h-0 space-y-1 overflow-hidden">
        {lastTranscripts.map((t, i) => (
          <p key={i} className={`text-xs truncate ${t.role === 'user' ? 'text-primary/70' : 'text-muted-foreground'}`}>
            <span className="font-medium">{t.role === 'user' ? 'You' : 'AI'}:</span> {t.text}
          </p>
        ))}
        {!isConnected && lastTranscripts.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center">Tap to start a voice session</p>
        )}
      </div>
    </div>
  );
}
