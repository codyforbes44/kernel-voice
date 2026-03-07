import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, ChevronRight, Radio, Code2, Bot } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AnimatedHeroBackground } from './AnimatedHeroBackground';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const HeroSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const scrollToDemo = () => {
    document.getElementById('product-preview')?.scrollIntoView({ behavior: 'smooth' });
  };

  const differentiators = [
    { icon: Radio, label: '4 Voice Providers' },
    { icon: Code2, label: 'Embeddable Widgets' },
    { icon: Bot, label: 'Custom Agents' },
  ];

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Parallax background layer */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <AnimatedHeroBackground />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-24 md:pt-24 md:pb-32 relative">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          style={{ y: contentY, opacity: contentOpacity }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          transition={{ staggerChildren: 0.12 }}
        >
          {/* Mini Orb */}
          <motion.div className="flex justify-center mb-6 sm:mb-8" variants={fadeUp} transition={{ duration: 0.6 }}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl scale-[2] animate-pulse" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-secondary animate-glow-pulse flex items-center justify-center">
                <Mic className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary-foreground" />
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold mb-4 sm:mb-6" variants={fadeUp} transition={{ duration: 0.6 }}>
            <span className="text-gradient">Your AI, Your Voice</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2" variants={fadeUp} transition={{ duration: 0.6 }}>
            Multi-provider real-time voice & text conversations. 
            Build custom agents, embed widgets, power your platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0" variants={fadeUp} transition={{ duration: 0.6 }}>
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-8 py-6 text-lg glow-primary group min-h-[48px]"
              onClick={() => navigate('/assistant')}
            >
              <Mic className="mr-2 h-5 w-5" />
              Try It Now
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto px-8 py-6 text-lg min-h-[48px]"
              onClick={scrollToDemo}
            >
              See It In Action
            </Button>
          </motion.div>

          {/* Differentiators */}
          <motion.div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8 md:gap-12 mt-10 sm:mt-16" variants={fadeUp} transition={{ duration: 0.6 }}>
            {differentiators.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-muted-foreground">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
