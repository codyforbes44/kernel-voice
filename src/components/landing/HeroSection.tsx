import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, ChevronRight, Radio, Code2, Bot } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { AnimatedHeroBackground } from './AnimatedHeroBackground';

export const HeroSection = () => {
  const navigate = useNavigate();
  const heroAnimation = useScrollAnimation({ threshold: 0.1 });

  const scrollToDemo = () => {
    document.getElementById('product-preview')?.scrollIntoView({ behavior: 'smooth' });
  };

  const differentiators = [
    { icon: Radio, label: '4 Voice Providers' },
    { icon: Code2, label: 'Embeddable Widgets' },
    { icon: Bot, label: 'Custom Agents' },
  ];

  return (
    <section ref={heroAnimation.ref} className="relative overflow-hidden">
      <AnimatedHeroBackground />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32 relative">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Mini Orb */}
          <div className={`flex justify-center mb-8 transition-all duration-700 delay-100 ${heroAnimation.isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl scale-[2] animate-pulse" />
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-secondary animate-glow-pulse flex items-center justify-center">
                <Mic className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className={`text-4xl sm:text-5xl md:text-7xl font-display font-bold mb-6 transition-all duration-700 delay-200 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="text-gradient">Your AI, Your Voice</span>
          </h1>

          {/* Tagline */}
          <p className={`text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto transition-all duration-700 delay-300 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Multi-provider real-time voice & text conversations. 
            Build custom agents, embed widgets, power your platform.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-[400ms] ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg glow-primary group"
              onClick={() => navigate('/assistant')}
            >
              <Mic className="mr-2 h-5 w-5" />
              Try It Now
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-6 text-lg"
              onClick={scrollToDemo}
            >
              See It In Action
            </Button>
          </div>

          {/* Differentiators */}
          <div className={`flex flex-wrap items-center justify-center gap-8 md:gap-12 mt-16 transition-all duration-700 delay-500 ${heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {differentiators.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-muted-foreground">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
