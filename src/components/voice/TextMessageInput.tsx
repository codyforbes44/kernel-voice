import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Mic, MicOff, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface TextMessageInputProps {
  onSend: (message: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TextMessageInput({
  onSend,
  isLoading,
  disabled = false,
  placeholder = "Type a message...",
  className = "",
}: TextMessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSend(trimmedMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const stopRecording = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setPartialTranscript('');
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Get scribe token
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');
      if (error || !data?.token) {
        console.error('Failed to get scribe token:', error);
        return;
      }

      // Get mic stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      mediaStreamRef.current = stream;

      // Connect WebSocket
      const ws = new WebSocket(`wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&token=${data.token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsRecording(true);

        // Set up audio processing
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          // Convert Float32 to Int16
          const int16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, Math.round(input[i] * 32767)));
          }
          // Encode as base64
          const bytes = new Uint8Array(int16.buffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          ws.send(JSON.stringify({ audio: btoa(binary) }));
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'partial_transcript' && msg.text) {
            setPartialTranscript(msg.text);
          } else if (msg.type === 'committed_transcript' && msg.text) {
            setMessage((prev) => (prev ? prev + ' ' + msg.text : msg.text));
            setPartialTranscript('');
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = () => stopRecording();
      ws.onclose = () => stopRecording();
    } catch (err) {
      console.error('Recording error:', err);
      stopRecording();
    }
  }, [stopRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRecording();
  }, [stopRecording]);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  return (
    <div className={className}>
      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded-t-md bg-primary/10 text-xs text-primary"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-medium">Listening...</span>
            {partialTranscript && (
              <span className="text-muted-foreground truncate ml-1 italic">
                {partialTranscript}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            rows={1}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] max-h-[120px] resize-none"
            aria-label="Message input"
            style={{ overflow: 'hidden' }}
          />
          {message.length > 200 && (
            <span className="absolute bottom-1 right-2 text-[10px] text-muted-foreground tabular-nums">
              {message.length}
            </span>
          )}
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isLoading || disabled}
          className="min-h-[44px] min-w-[44px] shrink-0"
          aria-label={isLoading ? "Sending..." : "Send message"}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>

        {/* Mic button for speech-to-text */}
        <Button
          type="button"
          size="icon"
          variant={isRecording ? 'default' : 'outline'}
          onClick={toggleRecording}
          disabled={disabled}
          className={`min-h-[44px] min-w-[44px] shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
          aria-label={isRecording ? 'Stop recording' : 'Voice input'}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        {/* Sparkle button (visual) */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled}
          className="min-h-[44px] min-w-[44px] shrink-0 text-muted-foreground hover:text-primary"
          aria-label="AI suggestions"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
