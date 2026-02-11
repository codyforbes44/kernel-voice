import { useState, useCallback } from 'react';
import { Mic, MessageSquare, Phone, Loader2 } from 'lucide-react';
import { LiveWaveformCanvas } from '@/components/voice/LiveWaveformCanvas';
import { useShowcaseMic } from '@/hooks/useShowcaseMic';
import { useGeminiLiveConversation } from '@/hooks/useGeminiLiveConversation';
import { supabase } from '@/integrations/supabase/client';

export function LiveStatusCard() {
  const mic = useShowcaseMic();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const gemini = useGeminiLiveConversation({
    systemPrompt: 'You are a live support agent. Keep responses very short.',
  });

  const isCall = gemini.status === 'connected';
  const activeLevel = isCall
    ? (gemini.isSpeaking ? gemini.outputAudioLevel : gemini.inputAudioLevel)
    : mic.audioLevel;

  const toggleMic = () => {
    if (mic.isActive) mic.stop(); else mic.start();
  };

  const toggleCall = () => {
    if (isCall) gemini.endSession(); else gemini.startSession();
  };

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatLoading(true);
    try {
      const { data } = await supabase.functions.invoke('gemini-chat', {
        body: { messages: [{ role: 'user', text }], systemPrompt: 'Reply in one sentence.' },
      });
      setChatReply(data?.message || '…');
    } catch { setChatReply('Error'); }
    finally { setChatLoading(false); }
  }, [chatInput, chatLoading]);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 sm:p-5 flex flex-col gap-3 h-full">
      <div className="h-12">
        <LiveWaveformCanvas level={activeLevel} isActive={mic.isActive || isCall} barColor="hsl(180, 100%, 50%)" barWidth={2} barGap={1} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${mic.isActive || isCall ? 'bg-destructive animate-pulse' : 'bg-muted-foreground/40'}`} />
          <span className={`text-xs font-medium ${mic.isActive || isCall ? 'text-destructive' : 'text-muted-foreground'}`}>
            {isCall ? 'Call' : mic.isActive ? 'Live' : 'Off'}
          </span>
          <span className="text-xs text-muted-foreground/60">128 kbps</span>
        </div>
      </div>

      {chatOpen && (
        <div className="space-y-1">
          {chatReply && <p className="text-xs text-muted-foreground truncate">{chatReply}</p>}
          <div className="flex gap-1">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Ask something…"
              className="flex-1 bg-input rounded px-2 py-1 text-base sm:text-xs text-foreground placeholder:text-muted-foreground/60 outline-none border border-border"
            />
            {chatLoading && <Loader2 className="h-4 w-4 text-primary animate-spin self-center" />}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground font-display">Customer Support</span>
        <div className="flex items-center gap-1">
          <button onClick={toggleMic} className={`transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center ${mic.isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
            <Mic className="h-4 w-4" />
          </button>
          <button onClick={() => setChatOpen(!chatOpen)} className={`transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center ${chatOpen ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
            <MessageSquare className="h-4 w-4" />
          </button>
          <button onClick={toggleCall} className={`transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center ${isCall ? 'text-destructive' : gemini.status === 'connecting' ? 'text-yellow-400' : 'text-muted-foreground hover:text-primary'}`}>
            {gemini.status === 'connecting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
