import { useState, useCallback, useRef } from 'react';
import { Phone, Loader2 } from 'lucide-react';
import { useGeminiLiveConversation } from '@/hooks/useGeminiLiveConversation';

export function VoiceChatCard() {
  const [transcripts, setTranscripts] = useState<Array<{ role: string; text: string }>>([]);

  const gemini = useGeminiLiveConversation({
    onTranscript: (t) => setTranscripts((prev) => [...prev.slice(-3), t]),
    systemPrompt: 'You are a friendly customer support agent. Keep responses very short, 1-2 sentences.',
  });

  const isLive = gemini.status === 'connected';
  const isConnecting = gemini.status === 'connecting';

  const toggle = useCallback(() => {
    if (isLive) {
      gemini.endSession();
      setTranscripts([]);
    } else {
      gemini.startSession();
    }
  }, [isLive, gemini]);

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col items-center gap-4">
      <div
        className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 shadow-lg shadow-violet-500/20 transition-transform"
        style={{
          transform: gemini.isSpeaking ? `scale(${1 + gemini.outputAudioLevel * 0.15})` : isLive ? `scale(${1 + gemini.inputAudioLevel * 0.1})` : 'scale(1)',
        }}
      />
      <div className="text-center">
        <h3 className="text-sm font-semibold text-zinc-100">Customer Support</h3>
        <p className="text-xs text-zinc-500">
          {isConnecting ? 'Connecting…' : isLive ? (gemini.isSpeaking ? 'Speaking…' : 'Listening…') : 'Tap to start voice chat'}
        </p>
      </div>
      {transcripts.length > 0 && (
        <div className="w-full max-h-20 overflow-y-auto space-y-1 px-1">
          {transcripts.map((t, i) => (
            <p key={i} className={`text-xs truncate ${t.role === 'user' ? 'text-violet-300 text-right' : 'text-zinc-400'}`}>
              {t.text}
            </p>
          ))}
        </div>
      )}
      <button
        onClick={toggle}
        disabled={isConnecting}
        className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
          isLive ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30'
        } disabled:opacity-50`}
      >
        {isConnecting ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Phone className="h-5 w-5 text-white" />}
      </button>
    </div>
  );
}
