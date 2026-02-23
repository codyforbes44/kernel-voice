import { useState, useCallback } from 'react';
import { Brain, Send, Loader2 } from 'lucide-react';

export function ClaudeReasoningCard() {
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setLoading(true);
    setAnswer('');

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-reason`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        setAnswer(err.error || 'Request failed.');
        return;
      }

      // Parse Anthropic SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            // Anthropic streaming events
            if (json.type === 'content_block_delta' && json.delta?.text) {
              setAnswer(prev => prev + json.delta.text);
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch {
      setAnswer('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-accent-foreground" />
        <div>
          <h3 className="text-sm font-semibold text-foreground font-display">Claude Reasoning</h3>
          <p className="text-xs text-muted-foreground">Anthropic step-by-step analysis</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="Ask a reasoning question…"
          className="flex-1 bg-input rounded-lg px-3 py-2 text-base sm:text-xs text-foreground placeholder:text-muted-foreground/60 outline-none border border-border focus:border-primary/50 transition-colors"
        />
        <button
          onClick={ask}
          disabled={loading || !input.trim()}
          className="text-primary hover:text-primary/80 disabled:text-muted-foreground/40 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      {answer && (
        <div className="flex-1 min-h-0 overflow-y-auto max-h-28 scrollbar-hide">
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{answer}</p>
        </div>
      )}

      {!answer && !loading && (
        <p className="text-xs text-muted-foreground/50 text-center py-2">Try: "Why is the sky blue?" or "Explain P vs NP"</p>
      )}
    </div>
  );
}
