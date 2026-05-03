import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

export const FinalCTASection = () => {
  const navigate = useNavigate();

  return (
    <SectionWrapper glow="center">
      <motion.div
        className="relative max-w-4xl mx-auto rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-8 sm:p-12 md:p-16 text-center card-elevated overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.18),transparent_60%)]"
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary mb-5">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Start free, upgrade when you outgrow it
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight mb-4">
            Your next conversation starts now.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            No credit card. No setup. Talk to ƷBI in your browser, then build it into your product when you're ready.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/assistant')}
              className="w-full sm:w-auto px-8 py-6 text-lg glow-primary min-h-[48px]"
            >
              Try the assistant
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/pricing')}
              className="w-full sm:w-auto px-8 py-6 text-lg min-h-[48px]"
            >
              View pricing
            </Button>
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  );
};
