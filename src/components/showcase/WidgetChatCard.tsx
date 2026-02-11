import { Send, Sparkles, User } from 'lucide-react';

export function WidgetChatCard() {
  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-zinc-800">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-zinc-100">Customer Support</span>
      </div>

      {/* Orb */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 shadow-xl shadow-violet-500/20" />
      </div>

      {/* Prompt */}
      <div className="text-center pb-3">
        <p className="text-xs text-zinc-500">Start a conversation</p>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none"
          />
          <button className="text-zinc-500 hover:text-violet-400 transition-colors">
            <Sparkles className="h-4 w-4" />
          </button>
          <button className="text-zinc-500 hover:text-violet-400 transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
