import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, Music, MessageCircle, Radio, AudioWaveform, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';

const showcaseCards = [
  { title: 'Voice Chat', icon: Mic, gradient: 'from-primary to-secondary' },
  { title: 'Audio Player', icon: Music, gradient: 'from-secondary to-primary-glow' },
  { title: 'Chat Widget', icon: MessageCircle, gradient: 'from-primary-glow to-primary' },
  { title: 'Live Status', icon: Radio, gradient: 'from-primary to-primary-glow' },
  { title: 'Waveform', icon: AudioWaveform, gradient: 'from-secondary to-primary' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const ShowcaseTeaserSection = () => {
  const navigate = useNavigate();

  return (
    <SectionWrapper muted>
      <SectionHeading
        title="Playground"
        subtitle="Explore interactive components built with our platform."
      />

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ staggerChildren: 0.08 }}
      >
        {showcaseCards.map(({ title, icon: Icon, gradient }) => (
          <motion.div
            key={title}
            className="rounded-2xl border border-border bg-card p-4 sm:p-6 card-elevated glow-hover transition-all duration-300 hover:scale-[1.03] cursor-pointer"
            variants={cardVariants}
            transition={{ duration: 0.5 }}
            onClick={() => navigate('/showcase')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/showcase')}
            aria-label={`Open ${title} in Playground`}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 sm:mb-4`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-xs sm:text-sm tracking-tight">{title}</h3>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="text-center mt-8 sm:mt-10 px-4 sm:px-0"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Button variant="outline" size="lg" onClick={() => navigate('/showcase')} className="w-full sm:w-auto px-8 py-6 text-lg min-h-[48px]">
          Explore the Playground
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </SectionWrapper>
  );
};
