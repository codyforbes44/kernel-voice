import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, Check, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PricingCard } from '@/components/subscription/PricingCard';
import { ManageSubscriptionButton } from '@/components/subscription/ManageSubscriptionButton';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { PRICING_INFO } from '@/lib/stripe';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const FREE_FEATURES = [
  'ƷBI voice assistant',
  '7-day conversation history',
  '1 saved agent',
  'Community support',
];

const PERSONAL_FEATURES = [
  'Everything in Free',
  'Premium ElevenLabs voices',
  '30-day history',
  '5 saved agents',
  'Advanced voice customization',
  'Email support',
];

const BUILDER_FEATURES = [
  'Everything in Personal',
  '1 embeddable widget (10k msgs/mo)',
  'Knowledge base (100 docs)',
  'VAPI provider',
  'Unlimited custom agents',
  'API access',
];

const TEAM_FEATURES = [
  'Everything in Builder',
  '5 widgets · 100k msgs/mo',
  'Knowledge base (1k docs)',
  '5 seats included',
  'Priority support',
  'SSO-ready',
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

type Billing = 'monthly' | 'annual';

const annualPrice = (monthly: number) => Math.round(monthly * 12 * 0.8);

export default function Pricing() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [billing, setBilling] = useState<Billing>('monthly');
  const { isAuthenticated } = useAuth();
  const { isSubscribed, productId, createCheckout, isLoading } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast({ title: 'Checkout canceled', description: "You can try again whenever you're ready." });
    }
  }, [searchParams]);

  const handleSelectPlan = async (priceId: string | null) => {
    if (!priceId) {
      navigate(isAuthenticated ? '/assistant' : '/auth?redirect=/assistant');
      return;
    }
    if (!isAuthenticated) {
      navigate('/auth?redirect=/pricing');
      return;
    }
    setLoadingPriceId(priceId);
    try {
      const result = await createCheckout(priceId);
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
        return;
      }
      if (result.url) window.open(result.url, '_blank');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPriceId(null);
    }
  };

  const showAnnual = billing === 'annual';

  // JSON-LD for SEO
  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'ƷBI',
      description: 'Real-time AI voice assistant and embeddable agent platform.',
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Personal', price: '9', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Builder', price: '29', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Team', price: '99', priceCurrency: 'USD' },
      ],
    }),
    []
  );

  const comparison = [
    {
      group: 'Voice',
      rows: [
        { label: '3BI · Gemini Live providers', values: [true, true, true, true] },
        { label: 'Premium ElevenLabs voices', values: [false, true, true, true] },
        { label: 'VAPI provider', values: [false, false, true, true] },
      ],
    },
    {
      group: 'Agents',
      rows: [
        { label: 'Saved agents', values: ['1', '5', 'Unlimited', 'Unlimited'] },
        { label: 'History retention', values: ['7 days', '30 days', '1 year', '1 year'] },
        { label: 'Required questions', values: [false, true, true, true] },
      ],
    },
    {
      group: 'Widgets & API',
      rows: [
        { label: 'Embeddable widgets', values: ['—', '—', '1', '5'] },
        { label: 'Widget messages / month', values: ['—', '—', '10k', '100k'] },
        { label: 'Knowledge base documents', values: ['—', '—', '100', '1,000'] },
        { label: 'API access', values: [false, false, true, true] },
      ],
    },
    {
      group: 'Support',
      rows: [
        { label: 'Community', values: [true, true, true, true] },
        { label: 'Email support', values: [false, true, true, true] },
        { label: 'Priority support', values: [false, false, false, true] },
        { label: 'Seats included', values: ['1', '1', '1', '5'] },
      ],
    },
  ];

  const planNames = ['Free', 'Personal', 'Builder', 'Team'];

  return (
    <PageWrapper
      title="Pricing — ƷBI"
      description="Free, Personal, Builder and Team plans. Start free, upgrade when you outgrow it."
      showFooter
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main
        id="main-content"
        className="flex-1 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16"
      >
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-10"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="secondary" className="mb-4">
            <Crown className="h-3 w-3 mr-1" aria-hidden="true" />
            Pricing
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight mb-3 sm:mb-4">
            Start free. Upgrade when you outgrow it.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Use ƷBI as a personal voice assistant or embed it into your product.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div role="tablist" aria-label="Billing interval" className="inline-flex p-1 rounded-full border border-border bg-card">
            {(['monthly', 'annual'] as Billing[]).map((b) => (
              <button
                key={b}
                role="tab"
                aria-selected={billing === b}
                onClick={() => setBilling(b)}
                className={cn(
                  'px-4 sm:px-5 py-2 text-sm font-medium rounded-full transition-all min-h-[40px] flex items-center gap-2',
                  billing === b
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {b === 'monthly' ? 'Monthly' : 'Annual'}
                {b === 'annual' && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-background/30">
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Subscription Management */}
        {isSubscribed && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <ManageSubscriptionButton />
          </div>
        )}

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.08, delayChildren: 0.15 }}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <PricingCard
              name="Free"
              description="Try ƷBI, no credit card"
              price={0}
              interval={showAnnual ? 'year' : 'month'}
              features={FREE_FEATURES}
              onSelect={() => handleSelectPlan(null)}
              isLoading={false}
              disabled={false}
            />
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <PricingCard
              name="Personal"
              description="For people using ƷBI daily"
              price={showAnnual ? annualPrice(PRICING_INFO.personal.amount) : PRICING_INFO.personal.amount}
              interval={showAnnual ? 'year' : 'month'}
              features={PERSONAL_FEATURES}
              isCurrentPlan={productId === PRICING_INFO.personal.productId}
              onSelect={() => handleSelectPlan(PRICING_INFO.personal.priceId)}
              isLoading={loadingPriceId === PRICING_INFO.personal.priceId}
              disabled={isLoading || showAnnual}
              savings={showAnnual ? PRICING_INFO.personal.amount * 12 - annualPrice(PRICING_INFO.personal.amount) : undefined}
            />
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <PricingCard
              name="Builder"
              description="For builders shipping AI"
              price={showAnnual ? annualPrice(PRICING_INFO.builder.amount) : PRICING_INFO.builder.amount}
              interval={showAnnual ? 'year' : 'month'}
              features={BUILDER_FEATURES}
              isPopular={!isSubscribed}
              isCurrentPlan={productId === PRICING_INFO.builder.productId}
              onSelect={() => handleSelectPlan(PRICING_INFO.builder.priceId)}
              isLoading={loadingPriceId === PRICING_INFO.builder.priceId}
              disabled={isLoading || showAnnual}
              savings={showAnnual ? PRICING_INFO.builder.amount * 12 - annualPrice(PRICING_INFO.builder.amount) : undefined}
            />
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <PricingCard
              name="Team"
              description="For teams in production"
              price={showAnnual ? annualPrice(PRICING_INFO.team.amount) : PRICING_INFO.team.amount}
              interval={showAnnual ? 'year' : 'month'}
              features={TEAM_FEATURES}
              isCurrentPlan={productId === PRICING_INFO.team.productId}
              onSelect={() => handleSelectPlan(PRICING_INFO.team.priceId)}
              isLoading={loadingPriceId === PRICING_INFO.team.priceId}
              disabled={isLoading || showAnnual}
              savings={showAnnual ? PRICING_INFO.team.amount * 12 - annualPrice(PRICING_INFO.team.amount) : undefined}
            />
          </motion.div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Prices in USD. Cancel anytime. {showAnnual && 'Annual billing coming soon — contact us for early access.'}
        </p>

        {/* Comparison table */}
        <motion.section
          aria-labelledby="compare-heading"
          className="mt-14 sm:mt-20"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="compare-heading" className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-center mb-6 sm:mb-8">
            Compare plans
          </h2>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-medium sticky left-0 bg-muted/50 z-10 w-1/3">Feature</th>
                  {planNames.map((name) => (
                    <th key={name} className="p-3 sm:p-4 text-center font-semibold">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((group) => (
                  <Fragment key={group.group}>
                    <tr className="bg-card/40">
                      <td colSpan={5} className="p-3 sm:p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold sticky left-0 bg-card/40 z-10">
                        {group.group}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label} className="border-t border-border">
                        <td className="p-3 sm:p-4 sticky left-0 bg-background z-10">{row.label}</td>
                        {row.values.map((v, i) => (
                          <td key={i} className="p-3 sm:p-4 text-center">
                            {v === true ? (
                              <Check className="h-4 w-4 text-primary mx-auto" aria-label="Included" />
                            ) : v === false ? (
                              <Minus className="h-4 w-4 text-muted-foreground/50 mx-auto" aria-label="Not included" />
                            ) : (
                              <span className="text-muted-foreground">{v}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.div
          className="mt-14 sm:mt-20 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight mb-6 sm:mb-8">
            Frequently asked questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 text-left">
            {[
              {
                q: 'Do I need an account to try it?',
                a: 'No — start a guest conversation in the assistant. Create an account when you want to save it or unlock more features.',
              },
              {
                q: "What's the difference between Personal and Builder?",
                a: 'Personal is for talking to ƷBI yourself. Builder adds embeddable widgets, a knowledge base and API access for shipping AI in your product.',
              },
              {
                q: 'Can I cancel anytime?',
                a: "Yes. Cancel any time from the billing portal — you'll keep access until the end of your billing period.",
              },
              {
                q: 'Can I switch between plans?',
                a: 'Yes — upgrade or downgrade any time. Changes are prorated automatically.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'All major credit cards, debit cards and many local payment methods through our secure payment processor.',
              },
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
