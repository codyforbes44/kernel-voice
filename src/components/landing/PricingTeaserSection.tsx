import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';

const plans = [
  {
    name: 'Starter',
    price: '$4.95',
    highlights: ['3BI Voice Assistant', 'Basic conversation history', 'Standard voice quality'],
  },
  {
    name: 'Plus',
    price: '$14.95',
    highlights: ['Premium ElevenLabs voices', 'Extended history (30 days)', 'Advanced voice customization'],
    featured: true,
  },
  {
    name: 'Pro',
    price: '$29.95',
    highlights: ['Gemini Live & OpenAI Realtime', 'Unlimited history & API access', 'Custom agent personalities'],
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
      <div className="max-w-4xl mx-auto text-center">
        <SectionHeading
          title="Simple Pricing"
          subtitle="Start with Starter. Scale when you need more."
        />

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {plans.map((plan) => (
            <motion.article
              key={plan.name}
              className={`rounded-2xl border p-5 sm:p-6 text-left transition-all duration-300 ${
                plan.featured
                  ? 'border-primary/50 bg-card card-elevated glow-border ring-1 ring-primary/20'
                  : 'border-border bg-card'
              }`}
              variants={cardVariants}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-lg sm:text-xl font-display font-bold mb-1 tracking-tight">{plan.name}</h3>
              <p className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-4">
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
            View Plans
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};
