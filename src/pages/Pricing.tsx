import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

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
      title="Pricing - ƷBI Voice"
      description="Choose the plan that fits your needs. Starter, Plus, or Pro — unlock premium voice features and more."
      showFooter
    >
      <main id="main-content" className="flex-1 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-10 sm:mb-14"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="secondary" className="mb-4">
            <Crown className="h-3 w-3 mr-1" aria-hidden="true" />
            ƷBI Voice
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight mb-3 sm:mb-4">Choose Your Plan</h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Unlock premium voices, advanced providers, and priority support.
          </p>
        </motion.div>

        {/* Subscription Management */}
        {isSubscribed && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <ManageSubscriptionButton />
          </div>
        )}

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
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
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
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
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
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
          </motion.div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          className="mt-14 sm:mt-20 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight mb-6 sm:mb-8">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 text-left">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.' },
              { q: 'Can I switch between plans?', a: 'Yes, you can upgrade or downgrade at any time through the billing portal. Changes will be prorated.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, and many local payment methods through our secure payment processor.' },
            ].map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-medium mb-2 text-base">{q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </PageWrapper>
  );
}
