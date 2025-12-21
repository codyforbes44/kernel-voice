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
  className?: string;
}

export function LiveTranscripts({ transcripts, isConnected, isSpeaking, className }: LiveTranscriptsProps) {
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
    <div className={`rounded-xl bg-card border border-border p-3 md:p-4 shadow-lg ${className || ''}`}>
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h3 className="text-xs md:text-sm font-semibold text-foreground">Live Transcript</h3>
        {isConnected && (
          <Badge 
            variant={isSpeaking ? 'default' : 'secondary'} 
            className="text-xs"
            aria-live="polite"
          >
            {isSpeaking ? '🗣️ AI Speaking' : '👂 Listening'}
          </Badge>
        )}
      </div>

      <ScrollArea className="h-32 md:h-48 pr-2 md:pr-4" ref={scrollRef}>
        {transcripts.length === 0 ? (
          <p className="text-xs md:text-sm text-muted-foreground text-center py-6 md:py-8">
            Transcripts will appear here as you speak...
          </p>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {transcripts.map((transcript) => (
              <div
                key={transcript.id}
                className={`flex gap-1.5 md:gap-2 ${
                  transcript.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {transcript.role === 'assistant' && (
                  <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm ${
                    transcript.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  } ${transcript.isPartial ? 'opacity-70' : ''}`}
                >
                  <p className="break-words">
                    {transcript.text}
                    {transcript.isPartial && (
                      <span className="inline-block w-0.5 md:w-1 h-3 md:h-4 ml-0.5 md:ml-1 bg-current animate-pulse" />
                    )}
                  </p>
                </div>

                {transcript.role === 'user' && (
                  <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary-foreground" />
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
