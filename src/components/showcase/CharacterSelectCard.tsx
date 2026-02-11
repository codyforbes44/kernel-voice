import { useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const VOICE_MAP: Record<string, { id: string; sample: string }> = {
  rachel: { id: 'EXAVITQu4vr4xnSDxMaL', sample: 'Hi there! I\'m Rachel. How can I help you today?' },
  drew: { id: 'onwK4e9ZLuTAKqWW03F9', sample: 'Hey, I\'m Drew. Ready to assist you with anything.' },
  clyde: { id: 'iP95p4xoKVk53GoZ742B', sample: 'Hello! Clyde here. Let me know what you need.' },
  aria: { id: 'FGY2WhTYpPnrIDTdsKH5', sample: 'Hi! I\'m Aria. What can I do for you today?' },
};

export function CharacterSelectCard() {
  const [loading, setLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const playPreview = useCallback(async (character: string) => {
    const voice = VOICE_MAP[character];
    if (!voice) return;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('widget-tts', {
        body: { text: voice.sample, voiceId: voice.id },
      });

      if (error || !data?.audioContent) {
        console.error('[CharacterSelect] TTS error:', error);
        return;
      }

      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      setCurrentAudio(audio);
      await audio.play();
    } catch (err) {
      console.error('[CharacterSelect]', err);
    } finally {
      setLoading(false);
    }
  }, [currentAudio]);

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">Character</h3>
        {loading && <Loader2 className="h-3 w-3 text-violet-400 animate-spin" />}
      </div>
      <Select defaultValue="rachel" onValueChange={playPreview}>
        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="rachel" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">Rachel</SelectItem>
          <SelectItem value="drew" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">Drew</SelectItem>
          <SelectItem value="clyde" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">Clyde</SelectItem>
          <SelectItem value="aria" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">Aria</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
