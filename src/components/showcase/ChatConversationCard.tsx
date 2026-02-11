import { User } from 'lucide-react';

const messages = [
  { role: 'agent', text: "Hi there! How can I help you today?" },
  { role: 'user', text: "I'd like to track my order #12345" },
  { role: 'agent', text: "I'd be happy to help! Your order #12345 is currently in transit and expected to arrive by Thursday." },
  { role: 'agent', text: "Would you like me to send you a tracking link?" },
];

export function ChatConversationCard() {
  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 flex flex-col gap-3 row-span-2">
      <h3 className="text-sm font-semibold text-zinc-100 px-2">Conversation</h3>
      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-64 px-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'agent' && (
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-3 w-3 text-white" />
              </div>
            )}
            <div
              className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[80%] ${
                m.role === 'user'
                  ? 'bg-violet-600/30 text-violet-200 border border-violet-500/20'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700/50'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
