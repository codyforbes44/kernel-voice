import { Phone } from 'lucide-react';

export function VoiceChatCard() {
  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col items-center gap-4">
      {/* Orb avatar */}
      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 shadow-lg shadow-violet-500/20" />
      <div className="text-center">
        <h3 className="text-sm font-semibold text-zinc-100">Customer Support</h3>
        <p className="text-xs text-zinc-500">Tap to start voice chat</p>
      </div>
      <button className="h-12 w-12 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center transition-colors shadow-lg shadow-violet-600/30">
        <Phone className="h-5 w-5 text-white" />
      </button>
    </div>
  );
}
