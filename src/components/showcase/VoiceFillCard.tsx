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
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Voice Fill</h3>
          <p className="text-xs text-zinc-500">Powered by ElevenLabs Scribe</p>
        </div>
        <button
          onClick={stt.toggleListening}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            stt.isListening
              ? 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30'
              : stt.isConnecting
              ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
              : 'bg-violet-600/20 text-violet-400 border-violet-500/30 hover:bg-violet-600/30'
          }`}
        >
          {stt.isListening && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
          <Mic className="h-3 w-3" />
          {stt.isListening ? 'Listening…' : stt.isConnecting ? 'Connecting…' : 'Voice Fill'}
        </button>
      </div>
      {stt.partialTranscript && (
        <p className="text-xs text-violet-300 italic truncate">"{stt.partialTranscript}"</p>
      )}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">
            First Name <span className="text-red-400">*</span>
          </label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">
            Last Name <span className="text-red-400">*</span>
          </label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 h-9 text-sm" />
        </div>
      </div>
    </div>
  );
}
