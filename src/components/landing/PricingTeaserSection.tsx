import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    price: '$0',
    audience: 'Try ƷBI',
    highlights: ['Voice assistant', '7-day history', '1 saved agent'],
  },
  {
    name: 'Personal',
    price: '$9',
    audience: 'For people',
    highlights: ['Premium ElevenLabs voices', '30-day history', '5 saved agents'],
  },
  {
    name: 'Builder',
    price: '$29',
    audience: 'For builders',
    highlights: ['1 embeddable widget', 'Knowledge base + API', 'Unlimited agents'],
    featured: true,
  },
  {
    name: 'Team',
    price: '$99',
    audience: 'For teams',
    highlights: ['5 widgets, 5 seats', 'Priority support', 'SSO-ready'],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const PricingTeaserSection = () => {
  const navigate = useNavigate();

  return (
    <SectionWrapper glow="bottom">
      <div className="max-w-6xl mx-auto text-center">
        <SectionHeading
          title="Simple, dual-track pricing"
          subtitle="Start free. Upgrade only when you outgrow it."
        />

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ staggerChildren: 0.08 }}
        >
          {plans.map((plan) => (
            <motion.article
              key={plan.name}
              className={cn(
                'relative rounded-2xl border p-5 sm:p-6 text-left transition-all duration-300',
                plan.featured
                  ? 'border-primary/60 bg-card card-elevated glow-border ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/30'
              )}
              variants={cardVariants}
              transition={{ duration: 0.5 }}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Popular
                </span>
              )}

              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {plan.audience}
              </p>
              <h3 className="text-lg sm:text-xl font-display font-bold tracking-tight mb-1">
                {plan.name}
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-primary mb-4">
                {plan.price}
                <span className="text-sm text-muted-foreground font-normal">/mo</span>
              </p>
              <ul className="space-y-2" role="list">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button
            size="lg"
            className="mt-8 sm:mt-10 w-full sm:w-auto px-10 py-6 text-lg glow-primary min-h-[48px]"
            onClick={() => navigate('/pricing')}
          >
            Compare all plans
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};
