import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Bot, Rocket, Sliders, FileSearch, Code2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { cn } from '@/lib/utils';

type Mode = 'talk' | 'build';

const flows: Record<Mode, { steps: { icon: typeof Settings2; title: string; description: string }[]; ctaLabel: string; ctaHref: string }> = {
  talk: {
    steps: [
      { icon: Settings2, title: 'Pick a voice', description: 'Choose from 4 voice providers and dial in personality.' },
      { icon: Bot, title: 'Start talking', description: 'Speak naturally — ƷBI listens, thinks, and replies in real time.' },
      { icon: Rocket, title: 'Save agents', description: 'Keep favourite personalities for different moods and tasks.' },
    ],
    ctaLabel: 'Open the assistant',
    ctaHref: '/assistant',
  },
  build: {
    steps: [
      { icon: Sliders, title: 'Configure widget', description: 'Style colors, prompts and required questions in the studio.' },
      { icon: FileSearch, title: 'Add knowledge', description: 'Upload PDFs and docs — your agent answers from your content.' },
      { icon: Code2, title: 'Embed and ship', description: 'One script tag and your widget is live on any site.' },
    ],
    ctaLabel: 'Start building',
    ctaHref: '/widgets',
  },
};

const tabs: { id: Mode; label: string }[] = [
  { id: 'talk', label: 'For talking' },
  { id: 'build', label: 'For building' },
];

const stepVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const HowItWorksSection = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('talk');
  const flow = flows[mode];

  const handleKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setMode(tabs[(idx + 1) % tabs.length].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setMode(tabs[(idx - 1 + tabs.length) % tabs.length].id);
    }
  };

  return (
    <SectionWrapper glow="center">
      <SectionHeading title="How it works" subtitle="Three steps. Pick your path." />

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="How it works flow"
        className="flex justify-center mb-10 sm:mb-12"
      >
        <div className="inline-flex p-1 rounded-full border border-border bg-card">
          {tabs.map((t, idx) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={mode === t.id}
              tabIndex={mode === t.id ? 0 : -1}
              onClick={() => setMode(t.id)}
              onKeyDown={(e) => handleKey(e, idx)}
              className={cn(
                'px-4 sm:px-5 py-2 text-sm font-medium rounded-full transition-all min-h-[40px]',
                mode === t.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative"
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -8 }}
          transition={{ staggerChildren: 0.12, duration: 0.4 }}
        >
          <div
            className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            aria-hidden="true"
          />

          {flow.steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="relative text-center"
              variants={stepVariants}
              transition={{ duration: 0.5 }}
            >
              <div className="relative inline-block mb-4 sm:mb-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center mx-auto shadow-lg card-elevated dark:shadow-glow-subtle hover:border-primary/60 transition-all duration-300 hover:scale-105">
                  <step.icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary" aria-hidden="true" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold shadow-md" aria-hidden="true">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 tracking-tight">{step.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xs mx-auto leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="text-center mt-10 sm:mt-12 px-4 sm:px-0"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Button size="lg" onClick={() => navigate(flow.ctaHref)} className="w-full sm:w-auto px-8 py-6 text-lg glow-primary min-h-[48px]">
          {flow.ctaLabel}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </SectionWrapper>
  );
};
