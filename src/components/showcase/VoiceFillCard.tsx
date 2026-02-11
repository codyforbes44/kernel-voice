import { Input } from '@/components/ui/input';
import { Mic } from 'lucide-react';

export function VoiceFillCard() {
  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Voice Fill</h3>
          <p className="text-xs text-zinc-500">Powered by ElevenLabs Scribe</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-full bg-violet-600/20 text-violet-400 px-3 py-1 text-xs font-medium border border-violet-500/30 hover:bg-violet-600/30 transition-colors">
          <Mic className="h-3 w-3" />
          Voice Fill
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">
            First Name <span className="text-red-400">*</span>
          </label>
          <Input placeholder="John" className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">
            Last Name <span className="text-red-400">*</span>
          </label>
          <Input placeholder="Doe" className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 h-9 text-sm" />
        </div>
      </div>
    </div>
  );
}
