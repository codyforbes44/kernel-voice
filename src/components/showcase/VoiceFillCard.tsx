import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Mic } from 'lucide-react';
import { useElevenLabsSTT } from '@/embed/useElevenLabsSTT';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function VoiceFillCard() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const parseNames = useCallback((text: string) => {
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      setFirstName(words[0]);
      setLastName(words.slice(1).join(' '));
    } else if (words.length === 1) {
      setFirstName(words[0]);
    }
  }, []);

  const stt = useElevenLabsSTT({
    onTranscript: parseNames,
    onError: (err) => console.error('[VoiceFill]', err),
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
  });

  return (
    <div className="rounded-2xl bg-card border border-border glow-border p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground font-display">Voice Fill</h3>
          <p className="text-xs text-muted-foreground">Powered by ElevenLabs Scribe</p>
        </div>
        <button
          onClick={stt.toggleListening}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors min-h-[48px] ${
            stt.isListening
              ? 'bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30'
              : stt.isConnecting
              ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
              : 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30'
          }`}
        >
          {stt.isListening && <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />}
          <Mic className="h-3 w-3" />
          {stt.isListening ? 'Listening…' : stt.isConnecting ? 'Connecting…' : 'Voice Fill'}
        </button>
      </div>
      {stt.partialTranscript && (
        <p className="text-xs text-primary/80 italic truncate">"{stt.partialTranscript}"</p>
      )}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            First Name <span className="text-destructive">*</span>
          </label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="bg-input border-border text-foreground placeholder:text-muted-foreground/60 h-9 text-base sm:text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Last Name <span className="text-destructive">*</span>
          </label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="bg-input border-border text-foreground placeholder:text-muted-foreground/60 h-9 text-base sm:text-sm" />
        </div>
      </div>
    </div>
  );
}
