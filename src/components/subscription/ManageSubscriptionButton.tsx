import { useState } from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';

interface ManageSubscriptionButtonProps extends Omit<ButtonProps, 'onClick'> {
  showIcon?: boolean;
}

export function ManageSubscriptionButton({
  showIcon = true,
  children,
  ...props
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { openCustomerPortal, isSubscribed } = useSubscription();

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const result = await openCustomerPortal();
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSubscribed) {
    return null;
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} variant="outline" {...props}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : showIcon ? (
        <Settings className="h-4 w-4 mr-2" />
      ) : null}
      {children || 'Manage Subscription'}
    </Button>
  );
}
