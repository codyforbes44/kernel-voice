import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;
    
    setMessage('');
    await onSend(trimmedMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Focus input when not loading
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`flex items-center gap-2 ${className}`}
    >
      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading || disabled}
        className="flex-1 min-h-[44px]"
        aria-label="Message input"
      />
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
    </form>
  );
}
