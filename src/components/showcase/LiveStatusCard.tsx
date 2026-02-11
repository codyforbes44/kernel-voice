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
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 flex flex-col gap-3">
      <div className="h-12">
        <LiveWaveformCanvas level={activeLevel} isActive={mic.isActive || isCall} barColor="#8b5cf6" barWidth={2} barGap={1} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${mic.isActive || isCall ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span className={`text-xs font-medium ${mic.isActive || isCall ? 'text-red-400' : 'text-zinc-500'}`}>
            {isCall ? 'Call' : mic.isActive ? 'Live' : 'Off'}
          </span>
          <span className="text-xs text-zinc-600">128 kbps</span>
        </div>
      </div>

      {chatOpen && (
        <div className="space-y-1">
          {chatReply && <p className="text-xs text-zinc-400 truncate">{chatReply}</p>}
          <div className="flex gap-1">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Ask something…"
              className="flex-1 bg-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none border border-zinc-700"
            />
            {chatLoading && <Loader2 className="h-4 w-4 text-violet-400 animate-spin self-center" />}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">Customer Support</span>
        <div className="flex items-center gap-2">
          <button onClick={toggleMic} className={`transition-colors ${mic.isActive ? 'text-violet-400' : 'text-zinc-500 hover:text-violet-400'}`}>
            <Mic className="h-4 w-4" />
          </button>
          <button onClick={() => setChatOpen(!chatOpen)} className={`transition-colors ${chatOpen ? 'text-violet-400' : 'text-zinc-500 hover:text-violet-400'}`}>
            <MessageSquare className="h-4 w-4" />
          </button>
          <button onClick={toggleCall} className={`transition-colors ${isCall ? 'text-red-400' : gemini.status === 'connecting' ? 'text-yellow-400' : 'text-zinc-500 hover:text-violet-400'}`}>
            {gemini.status === 'connecting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
