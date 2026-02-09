import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Zap, Crown, Check } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PricingCard } from '@/components/subscription/PricingCard';
import { ManageSubscriptionButton } from '@/components/subscription/ManageSubscriptionButton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { PRICING_INFO, STRIPE_PRODUCTS } from '@/lib/stripe';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';

const FREE_FEATURES = [
  '3ʙɪ Voice Assistant',
  'Basic conversation history',
  'Standard response quality',
  'Community support',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Premium ElevenLabs voices',
  'Priority response quality',
  'Extended conversation history',
  'Advanced voice customization',
  'Priority support',
  'Early access to new features',
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isSubscribed, productId, createCheckout, isLoading } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Checkout canceled",
        description: "You can try again whenever you're ready.",
      });
    }
  }, [searchParams]);

  const handleSelectPlan = async (priceId: string) => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/pricing');
      return;
    }

    setLoadingPriceId(priceId);
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
      setLoadingPriceId(null);
    }
  };

  const selectedPricing = isYearly ? PRICING_INFO.yearly : PRICING_INFO.monthly;
  const isCurrentPlanMonthly = productId === STRIPE_PRODUCTS.KERNEL_PRO_MONTHLY;
  const isCurrentPlanYearly = productId === STRIPE_PRODUCTS.KERNEL_PRO_YEARLY;

  return (
    <PageWrapper>
      <SEO 
        title="Pricing - ƷBI Voice Pro" 
        description="Upgrade to ƷBI Voice Pro for premium voice features, ElevenLabs voices, and priority support."
      />
      
      <div className="container max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Crown className="h-3 w-3 mr-1" />
            ƷBI Voice Pro
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Upgrade Your Voice Experience
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock premium voices, advanced features, and priority support with ƷBI Voice Pro.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Yearly
            <Badge variant="secondary" className="ml-2 text-green-600">
              Save $38
            </Badge>
          </Label>
        </div>

        {/* Subscription Management */}
        {isSubscribed && (
          <div className="flex justify-center mb-8">
            <ManageSubscriptionButton />
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <PricingCard
            name="Free"
            description="Get started with AI voice"
            price={0}
            interval="month"
            features={FREE_FEATURES}
            isCurrentPlan={!isSubscribed}
            onSelect={() => navigate('/assistant')}
            disabled={!isSubscribed}
          />

          {/* Pro Plan */}
          <PricingCard
            name="ƷBI Voice Pro"
            description="Premium voice experience"
            price={selectedPricing.amount}
            interval={selectedPricing.interval}
            features={PRO_FEATURES}
            isPopular={!isSubscribed}
            isCurrentPlan={isYearly ? isCurrentPlanYearly : isCurrentPlanMonthly}
            onSelect={() => handleSelectPlan(selectedPricing.priceId)}
            isLoading={loadingPriceId === selectedPricing.priceId}
            disabled={isLoading}
            savings={isYearly ? PRICING_INFO.yearly.savings : undefined}
          />
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-6 text-left">
            <div>
              <h3 className="font-medium mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards, debit cards, and many local payment methods through our secure payment processor.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Can I switch between monthly and yearly?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can switch between plans at any time through the billing portal. Changes will be prorated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
