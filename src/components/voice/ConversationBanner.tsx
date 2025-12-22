import { Button } from '@/components/ui/button';

interface ConversationBannerProps {
  title: string;
  onNewConversation: () => void;
  variant?: 'compact' | 'full';
  className?: string;
}

export const ConversationBanner = ({ 
  title, 
  onNewConversation, 
  variant = 'full',
  className = '' 
}: ConversationBannerProps) => {
  if (variant === 'compact') {
    return (
      <div className={`p-3 rounded-lg bg-primary/10 border border-primary/20 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Continuing:</p>
            <p className="text-sm font-medium truncate">{title}</p>
          </div>
          <Button 
            size="sm"
            variant="outline"
            className="h-9 min-h-[44px] shrink-0"
            onClick={onNewConversation}
          >
            New
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg bg-primary/10 border border-primary/20 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Continuing conversation:</p>
          <p className="font-medium">{title}</p>
        </div>
        <Button 
          variant="outline"
          onClick={onNewConversation}
          className="min-h-[44px]"
        >
          New Conversation
        </Button>
      </div>
    </div>
  );
};
