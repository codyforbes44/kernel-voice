import { useState, useCallback, useRef } from 'react';
import { Send, Sparkles, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Msg { role: 'user' | 'agent'; text: string }

export function WidgetChatCard() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Msg = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        text: m.text,
      }));

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { messages: apiMessages, systemPrompt: 'You are a helpful customer support widget. Keep responses concise (1-2 sentences).' },
      });

      if (error || !data?.message) throw new Error('No response');
      setMessages((prev) => [...prev, { role: 'agent', text: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'agent', text: 'Sorry, please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const speakLast = useCallback(async () => {
    const lastAgent = [...messages].reverse().find((m) => m.role === 'agent');
    if (!lastAgent) return;

    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setTtsPlaying(true);

    try {
      const { data, error } = await supabase.functions.invoke('widget-tts', {
        body: { text: lastAgent.text, voiceId: 'EXAVITQu4vr4xnSDxMaL' },
      });
      if (error || !data?.audioContent) return;

      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.addEventListener('ended', () => setTtsPlaying(false));
      await audio.play();
    } catch { setTtsPlaying(false); }
  }, [messages]);

  const lastAgentExists = messages.some((m) => m.role === 'agent');

  return (
    <div className="rounded-2xl bg-card border border-border glow-border overflow-hidden flex flex-col">
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground font-display">Customer Support</span>
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div
            className="h-24 w-24 rounded-full bg-gradient-to-br from-primary via-secondary to-accent shadow-xl transition-transform"
            style={{
              boxShadow: ttsPlaying ? '0 0 40px hsl(180 100% 50% / 0.3)' : undefined,
              transform: ttsPlaying ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-48 p-3 space-y-2 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'gap-2'}`}>
              {m.role === 'agent' && (
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
              <div className={`rounded-lg px-2.5 py-1.5 text-xs max-w-[80%] ${
                m.role === 'user' ? 'bg-primary/20 text-primary/80' : 'bg-muted text-foreground'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <User className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              <div className="rounded-lg px-2.5 py-1.5 bg-muted"><Loader2 className="h-3 w-3 text-muted-foreground animate-spin" /></div>
            </div>
          )}
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-center pb-3">
          <p className="text-xs text-muted-foreground">Start a conversation</p>
        </div>
      )}

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-input rounded-lg px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-base sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          <button
            onClick={speakLast}
            disabled={!lastAgentExists || ttsPlaying}
            className="text-muted-foreground hover:text-primary transition-colors disabled:text-muted-foreground/30 min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            {ttsPlaying ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Sparkles className="h-4 w-4" />}
          </button>
          <button onClick={send} disabled={loading || !input.trim()} className="text-muted-foreground hover:text-primary transition-colors disabled:text-muted-foreground/30 min-h-[48px] min-w-[48px] flex items-center justify-center">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
