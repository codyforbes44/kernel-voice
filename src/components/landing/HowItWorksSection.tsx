import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings2, Bot, Rocket, ChevronRight } from 'lucide-react';
import { useStaggeredAnimation } from '@/hooks/useScrollAnimation';

const steps = [
  {
    icon: Settings2,
    title: 'Choose Your Mode',
    description: 'Voice, text, or combined. Pick from 4 AI providers.',
  },
  {
    icon: Bot,
    title: 'Customize Your Agent',
    description: 'Set personality, voice, and system prompt. Save it for later.',
  },
  {
    icon: Rocket,
    title: 'Talk or Embed',
    description: 'Use it directly or deploy as a widget on your website.',
  },
];

export const HowItWorksSection = () => {
  const navigate = useNavigate();
  const animation = useStaggeredAnimation(3, { threshold: 0.15 });

  return (
    <section ref={animation.ref} className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`text-center mb-16 transition-all duration-700 ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Get started in three simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`relative text-center transition-all duration-700 ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={animation.getItemDelay(index)}
            >
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center mx-auto shadow-lg card-elevated dark:shadow-glow-subtle group hover:border-primary/60 transition-all duration-300 hover:scale-105">
                  <step.icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-6">
                  <ChevronRight className="w-6 h-6 text-primary/50 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={`text-center mt-12 transition-all duration-700 delay-500 ${animation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Button size="lg" onClick={() => navigate('/assistant')} className="px-8 py-6 text-lg glow-primary">
            Get Started Free
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
