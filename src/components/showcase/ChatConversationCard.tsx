import { useState, useCallback, useRef, useEffect } from 'react';
import { User, Send, Loader2 } from 'lucide-react';

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
        content: m.text,
      }));

      // Streaming fetch to Lovable AI Gateway
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
      });

      if (res.status === 429) {
        setMessages((prev) => [...prev, { role: 'agent', text: 'Rate limit reached. Try again shortly.' }]);
        return;
      }
      if (res.status === 402) {
        setMessages((prev) => [...prev, { role: 'agent', text: 'AI credits exhausted.' }]);
        return;
      }
      if (!res.ok || !res.body) throw new Error('No response');

      // Add empty agent message and stream into it
      setMessages((prev) => [...prev, { role: 'agent', text: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'agent') {
                  updated[updated.length - 1] = { ...last, text: last.text + delta };
                }
                return updated;
              });
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'agent', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 flex flex-col gap-3 h-full">
      <h3 className="text-sm font-semibold text-foreground px-2 font-display">AI Chat <span className="text-[10px] font-normal text-muted-foreground ml-1">streaming</span></h3>
      <div ref={scrollRef} className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto max-h-28 px-1 scrollbar-hide">
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
              {m.text || (loading && i === messages.length - 1 ? '…' : '')}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== 'agent' && (
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
