import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface UpgradeBannerProps {
  className?: string;
}

export function UpgradeBanner({ className }: UpgradeBannerProps) {
  const { isSubscribed, isLoading } = useSubscription();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if loading, subscribed, or dismissed
  if (isLoading || isSubscribed || isDismissed) {
    return null;
  }

  return (
    <Alert className={`relative border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 ${className}`}>
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-sm">
          <strong className="text-foreground">Upgrade to ƷBI Voice Pro</strong>
          <span className="text-muted-foreground"> — Unlock premium ElevenLabs voices and more features.</span>
        </span>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => navigate('/pricing')}
            className="whitespace-nowrap"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            View Plans
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 p-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
