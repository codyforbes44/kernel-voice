import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Bot } from 'lucide-react';

export interface LiveTranscript {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isPartial?: boolean;
}

interface LiveTranscriptsProps {
  transcripts: LiveTranscript[];
  isConnected: boolean;
  isSpeaking: boolean;
}

export function LiveTranscripts({ transcripts, isConnected, isSpeaking }: LiveTranscriptsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  if (!isConnected && transcripts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-card border border-border p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Live Transcript</h3>
        {isConnected && (
          <Badge variant={isSpeaking ? 'default' : 'secondary'} className="text-xs">
            {isSpeaking ? '🗣️ AI Speaking' : '👂 Listening'}
          </Badge>
        )}
      </div>

      <ScrollArea className="h-48 pr-4" ref={scrollRef}>
        {transcripts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Transcripts will appear here as you speak...
          </p>
        ) : (
          <div className="space-y-3">
            {transcripts.map((transcript) => (
              <div
                key={transcript.id}
                className={`flex gap-2 ${
                  transcript.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {transcript.role === 'assistant' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    transcript.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  } ${transcript.isPartial ? 'opacity-70' : ''}`}
                >
                  <p className="break-words">
                    {transcript.text}
                    {transcript.isPartial && (
                      <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
                    )}
                  </p>
                </div>

                {transcript.role === 'user' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
