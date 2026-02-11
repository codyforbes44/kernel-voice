import { useRef, useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Bot, Info, ChevronDown, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LiveTranscript {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  isPartial?: boolean;
}

interface LiveTranscriptsProps {
  transcripts: LiveTranscript[];
  isConnected: boolean;
  isSpeaking: boolean;
  isThinking?: boolean;
  className?: string;
}

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'now';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

export function LiveTranscripts({ transcripts, isConnected, isSpeaking, isThinking, className }: LiveTranscriptsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Observe sentinel to detect if user is at bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
        setShowScrollBtn(!entry.isIntersecting && transcripts.length > 3);
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [transcripts.length]);

  // Auto-scroll only when at bottom
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, isAtBottom]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  // Empty state
  if (!isConnected && transcripts.length === 0) {
    return (
      <div className={`rounded-xl bg-card border border-border p-6 md:p-8 shadow-lg flex flex-col items-center justify-center min-h-[200px] ${className || ''}`}>
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mic className="w-6 h-6 text-primary/60" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Start a conversation</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Transcripts will appear here</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-card border border-border p-3 md:p-4 shadow-lg relative ${className || ''}`}>
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h3 className="text-xs md:text-sm font-semibold text-foreground">Live Transcript</h3>
        {isConnected && (
          <Badge
            variant={isSpeaking ? 'default' : 'secondary'}
            className="text-xs"
            role="status"
            aria-live="polite"
          >
            {isThinking ? '🔧 Thinking...' : isSpeaking ? '🗣️ AI Speaking' : '👂 Listening'}
          </Badge>
        )}
      </div>

      <div className="relative">
        {transcripts.length > 3 && (
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none rounded-t-lg" />
        )}
        <ScrollArea className="h-40 md:h-48 pr-2 md:pr-4" ref={scrollRef}>
          {transcripts.length === 0 ? (
            <p className="text-xs md:text-sm text-muted-foreground text-center py-6 md:py-8">
              Transcripts will appear here as you speak...
            </p>
          ) : (
            <div className="space-y-2 md:space-y-3" role="log" aria-live="polite" aria-label="Conversation transcripts">
              <AnimatePresence initial={false}>
                {transcripts.map((transcript) => (
                  <motion.div
                    key={transcript.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-1.5 md:gap-2 ${
                      transcript.role === 'user' ? 'justify-end' : transcript.role === 'system' ? 'justify-center' : 'justify-start'
                    }`}
                  >
                    {transcript.role === 'system' ? (
                      <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-muted/50 border border-border text-xs text-muted-foreground italic">
                        <Info className="w-3 h-3" />
                        {transcript.text}
                      </div>
                    ) : (
                      <>
                        {transcript.role === 'assistant' && (
                          <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <Bot className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] md:max-w-[75%] rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm ${
                            transcript.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          } ${transcript.isPartial ? 'opacity-70' : ''}`}
                        >
                          <p className="break-words">
                            {transcript.text}
                            {transcript.isPartial && <TypingDots />}
                          </p>
                          <span className="text-[9px] md:text-[10px] opacity-50 mt-0.5 block text-right">
                            {relativeTime(transcript.timestamp)}
                          </span>
                        </div>

                        {transcript.role === 'user' && (
                          <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center">
                            <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary-foreground" />
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking shimmer */}
              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Bot className="w-2.5 h-2.5 md:w-3 md:h-3 text-purple-500" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-muted text-xs text-muted-foreground italic">
                      Thinking<TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom sentinel */}
              <div ref={sentinelRef} className="h-px" />
            </div>
          )}
        </ScrollArea>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-2 right-4 z-20"
            >
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-full shadow-md"
                onClick={scrollToBottom}
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
