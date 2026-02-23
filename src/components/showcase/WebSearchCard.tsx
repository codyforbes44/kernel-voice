import { useState, useCallback } from 'react';
import { Search, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function WebSearchCard() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [citations, setCitations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setResult('');
    setCitations([]);

    try {
      const { data, error } = await supabase.functions.invoke('search', {
        body: { query: q },
      });
      if (error || !data?.result) throw new Error('No result');
      setResult(data.result);
      setCitations(data.citations || []);
    } catch {
      setResult('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, loading]);

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 flex flex-col gap-3 h-full">
      <div>
        <h3 className="text-sm font-semibold text-foreground font-display">Web Search</h3>
        <p className="text-xs text-muted-foreground">Perplexity-powered answers</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Ask anything…"
          className="flex-1 bg-input rounded-lg px-3 py-2 text-base sm:text-xs text-foreground placeholder:text-muted-foreground/60 outline-none border border-border focus:border-primary/50 transition-colors"
        />
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="text-primary hover:text-primary/80 disabled:text-muted-foreground/40 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </div>

      {result && (
        <div className="flex-1 min-h-0 overflow-y-auto max-h-28 scrollbar-hide space-y-2">
          <p className="text-xs text-foreground leading-relaxed">{result}</p>
          {citations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {citations.slice(0, 3).map((url, i) => {
                let host = '';
                try { host = new URL(url).hostname.replace('www.', ''); } catch { host = 'source'; }
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    {host}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
