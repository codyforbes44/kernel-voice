import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, ChevronRight, Code2, ShieldCheck } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AnimatedHeroBackground } from './AnimatedHeroBackground';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const trust = [
  { icon: ShieldCheck, label: 'No credit card' },
  { icon: Mic, label: '4 voice providers' },
  { icon: Code2, label: 'Embed anywhere' },
];

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

  const scrollToTracks = () => {
    document.getElementById('tracks')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden" aria-labelledby="hero-heading">
      <motion.div className="absolute inset-0" style={{ y: bgY }} aria-hidden="true">
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
          {/* Mini orb */}
          <motion.div
            className="flex justify-center mb-6 sm:mb-8"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            aria-hidden="true"
          >
            <div className="relative">
              {/* Outer glow halo */}
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl scale-[2] animate-pulse" />
              {/* Animated conic-gradient orb — echoes the BrandLogo identity */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full animate-glow-pulse overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-secondary">
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,hsl(var(--primary)),hsl(var(--secondary)),hsl(var(--primary-glow)),hsl(var(--primary)))] animate-[spin_10s_linear_infinite] opacity-90" />
                {/* Inner glass highlight */}
                <div className="absolute inset-[6%] rounded-full bg-gradient-to-br from-background/30 to-transparent mix-blend-overlay" />
                {/* Soft inner ring */}
                <div className="absolute inset-[12%] rounded-full border border-background/20" />
              </div>
            </div>
          </motion.div>

          {/* Eyebrow */}
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <span className="inline-block px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur text-xs font-medium text-muted-foreground mb-5 sm:mb-6">
              Voice AI for everyone — and every product
            </span>
          </motion.div>

          {/* Dual headline */}
          <motion.h1
            id="hero-heading"
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-4 sm:mb-6 leading-[1.05]"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <span className="text-gradient">Talk to ƷBI.</span>
            <br />
            <span className="text-foreground">Or build with it.</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-7 sm:mb-9 max-w-2xl mx-auto px-2 leading-relaxed"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            A real-time AI voice assistant you can use today — and embed in your product tomorrow.
            Pick your voice, your model, your agent.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 py-6 text-lg glow-primary group min-h-[48px]"
              onClick={() => navigate('/assistant')}
            >
              <Mic className="mr-2 h-5 w-5" aria-hidden="true" />
              Try the assistant
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 py-6 text-lg min-h-[48px]"
              onClick={scrollToTracks}
            >
              <Code2 className="mr-2 h-5 w-5" aria-hidden="true" />
              Build with ƷBI
            </Button>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-8 sm:mt-12"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            {trust.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
