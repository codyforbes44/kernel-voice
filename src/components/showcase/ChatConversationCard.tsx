import { useState, useCallback, useRef, useEffect } from 'react';
import { User, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Msg {
  role: 'user' | 'agent';
  text: string;
}

export function ChatConversationCard() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'agent', text: "Hi there! How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
        body: {
          messages: apiMessages,
          systemPrompt: 'You are a helpful customer support assistant. Keep responses concise (2-3 sentences max).',
        },
      });

      if (error || !data?.message) throw new Error('No response');
      setMessages((prev) => [...prev, { role: 'agent', text: data.message }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'agent', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 flex flex-col gap-3 h-full">
      <h3 className="text-sm font-semibold text-foreground px-2 font-display">Conversation</h3>
      <div ref={scrollRef} className="flex flex-col gap-2.5 overflow-y-auto max-h-52 px-1 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'agent' && (
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[80%] ${
              m.role === 'user'
                ? 'bg-primary/20 text-primary/80 border border-primary/20'
                : 'bg-muted text-foreground border border-border'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <User className="h-3 w-3 text-primary-foreground" />
            </div>
            <div className="rounded-xl px-3 py-2 bg-muted border border-border">
              <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          className="flex-1 bg-input rounded-lg px-3 py-2 text-base sm:text-xs text-foreground placeholder:text-muted-foreground/60 outline-none border border-border focus:border-primary/50 transition-colors"
        />
        <button onClick={send} disabled={loading || !input.trim()} className="text-primary hover:text-primary/80 disabled:text-muted-foreground/40 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
