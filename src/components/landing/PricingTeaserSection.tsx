import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

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

export const PricingTeaserSection = () => {
  const navigate = useNavigate();
  const animation = useScrollAnimation({ threshold: 0.2 });

  return (
    <section ref={animation.ref} className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.1),transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Simple Pricing</h2>
          <p className="text-lg text-muted-foreground mb-12">Start with Starter. Scale when you need more.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 text-left transition-all duration-300 ${
                  plan.featured
                    ? 'border-primary/50 bg-card card-elevated glow-border'
                    : 'border-border bg-card'
                }`}
              >
                <h3 className="text-xl font-display font-bold mb-1">{plan.name}</h3>
                <p className="text-2xl font-bold text-primary mb-4">{plan.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                <ul className="space-y-2">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="mt-10 px-10 py-6 text-lg glow-primary"
            onClick={() => navigate('/pricing')}
          >
            View Plans
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
