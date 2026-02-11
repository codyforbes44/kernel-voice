import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { STRIPE_PRICES } from '@/lib/stripe';

interface UpgradeButtonProps extends Omit<ButtonProps, 'onClick'> {
  priceId?: string;
  showIcon?: boolean;
  redirectToPricing?: boolean;
}

export function UpgradeButton({
  priceId = STRIPE_PRICES.STARTER_MONTHLY,
  showIcon = true,
  redirectToPricing = false,
  children,
  ...props
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createCheckout, isSubscribed } = useSubscription();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (redirectToPricing) {
      navigate('/pricing');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCheckout(priceId);
      
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
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return null;
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} {...props}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : showIcon ? (
        <Sparkles className="h-4 w-4 mr-2" />
      ) : null}
      {children || 'Upgrade to Pro'}
    </Button>
  );
}
