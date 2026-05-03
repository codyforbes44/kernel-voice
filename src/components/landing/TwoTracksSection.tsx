import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Code2, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';

const tracks = [
  {
    id: 'use',
    icon: Mic,
    eyebrow: 'For people',
    title: 'Talk to ƷBI',
    description: 'A personal voice assistant that listens, thinks and speaks naturally — anywhere.',
    bullets: [
      'Daily briefings and hands-free Q&A',
      'Voice journaling with full transcripts',
      'Pick from 4 best-in-class voice providers',
      'Save personalities for different moods',
    ],
    cta: 'Open the assistant',
    href: '/assistant',
  },
  {
    id: 'build',
    icon: Code2,
    eyebrow: 'For builders',
    title: 'Build with ƷBI',
    description: 'Embed voice and chat agents into any product. Bring your own knowledge, prompts and brand.',
    bullets: [
      'Drop-in widget on any website',
      'Knowledge base with semantic search',
      'Custom agents, prompts and required questions',
      'API access and analytics dashboard',
    ],
    cta: 'Start building',
    href: '/admin/widgets',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

export const TwoTracksSection = () => {
  const navigate = useNavigate();

  return (
    <SectionWrapper id="tracks" muted>
      <SectionHeading
        title="One platform. Two ways to use it."
        subtitle="Whether you want to talk to AI or ship AI to your users — start in the same place."
      />

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ staggerChildren: 0.12 }}
      >
        {tracks.map((track) => (
          <motion.article
            key={track.id}
            id={track.id}
            className="group relative rounded-2xl border border-border bg-card p-6 sm:p-8 md:p-10 card-elevated transition-all duration-500 hover:border-primary/50 glow-hover scroll-mt-24"
            variants={cardVariants}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <track.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {track.eyebrow}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-3">
              {track.title}
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
              {track.description}
            </p>

            <ul className="space-y-3 mb-8" role="list">
              {track.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm sm:text-base">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => navigate(track.href)}
              size="lg"
              className="w-full sm:w-auto min-h-[48px] group/btn"
            >
              {track.cta}
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </motion.article>
        ))}
      </motion.div>
    </SectionWrapper>
  );
};
