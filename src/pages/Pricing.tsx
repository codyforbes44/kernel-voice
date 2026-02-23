import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PricingCard } from '@/components/subscription/PricingCard';
import { ManageSubscriptionButton } from '@/components/subscription/ManageSubscriptionButton';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { PRICING_INFO } from '@/lib/stripe';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const STARTER_FEATURES = [
  '3BI Voice Assistant',
  'Basic conversation history (7 days)',
  'Standard voice quality',
  'Community support',
];

const PLUS_FEATURES = [
  'Everything in Starter',
  'Premium ElevenLabs voices',
  'Extended conversation history (30 days)',
  'Advanced voice customization',
  'Priority response quality',
  'Email support',
];

const PRO_FEATURES = [
  'Everything in Plus',
  'Gemini Live & OpenAI Realtime providers',
  'Unlimited conversation history',
  'Custom agent personalities',
  'Priority support',
  'Early access to new features',
  'API access',
];

export default function Pricing() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { isSubscribed, productId, createCheckout, isLoading } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast({ title: "Checkout canceled", description: "You can try again whenever you're ready." });
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
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch {
      toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" });
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <PageWrapper
      title="Pricing - Kernel Voice"
      description="Choose the plan that fits your needs. Starter, Plus, or Pro — unlock premium voice features and more."
      showFooter
    >
      <main id="main-content" className="flex-1 container max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Crown className="h-3 w-3 mr-1" />
            Kernel Voice
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock premium voices, advanced providers, and priority support.
          </p>
        </div>

        {/* Subscription Management */}
        {isSubscribed && (
          <div className="flex justify-center mb-8">
            <ManageSubscriptionButton />
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            name="Starter"
            description="Get started with AI voice"
            price={PRICING_INFO.starter.amount}
            interval="month"
            features={STARTER_FEATURES}
            isCurrentPlan={productId === PRICING_INFO.starter.productId}
            onSelect={() => handleSelectPlan(PRICING_INFO.starter.priceId)}
            isLoading={loadingPriceId === PRICING_INFO.starter.priceId}
            disabled={isLoading}
          />
          <PricingCard
            name="Plus"
            description="Premium voice experience"
            price={PRICING_INFO.plus.amount}
            interval="month"
            features={PLUS_FEATURES}
            isPopular={!isSubscribed}
            isCurrentPlan={productId === PRICING_INFO.plus.productId}
            onSelect={() => handleSelectPlan(PRICING_INFO.plus.priceId)}
            isLoading={loadingPriceId === PRICING_INFO.plus.priceId}
            disabled={isLoading}
          />
          <PricingCard
            name="Pro"
            description="Everything, unlimited"
            price={PRICING_INFO.pro.amount}
            interval="month"
            features={PRO_FEATURES}
            isCurrentPlan={productId === PRICING_INFO.pro.productId}
            onSelect={() => handleSelectPlan(PRICING_INFO.pro.priceId)}
            isLoading={loadingPriceId === PRICING_INFO.pro.priceId}
            disabled={isLoading}
          />
        </div>

        {/* FAQ */}
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
              <h3 className="font-medium mb-2">Can I switch between plans?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade at any time through the billing portal. Changes will be prorated.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards, debit cards, and many local payment methods through our secure payment processor.
              </p>
            </div>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
