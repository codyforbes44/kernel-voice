import { Mic, Bot, Code2, FileSearch, Keyboard, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';

type Cluster = 'talk' | 'build';

const features: { icon: typeof Mic; title: string; description: string; cluster: Cluster }[] = [
  {
    icon: Mic,
    title: 'Multi-Provider Voice',
    description: 'Pick the voice engine that best matches your brand and budget — switch any time.',
    cluster: 'talk',
  },
  {
    icon: Bot,
    title: 'Custom AI Agents',
    description: 'Create, save and switch between personalized assistants with unique personalities.',
    cluster: 'talk',
  },
  {
    icon: Keyboard,
    title: 'Voice, Text or Both',
    description: 'Seamlessly switch between voice, text and combined input modes mid-conversation.',
    cluster: 'talk',
  },
  {
    icon: Code2,
    title: 'Embeddable Widgets',
    description: 'Deploy chat and voice widgets on any website with one script tag.',
    cluster: 'build',
  },
  {
    icon: FileSearch,
    title: 'Knowledge Base',
    description: 'Upload PDFs and docs, then let your agent answer questions with semantic search.',
    cluster: 'build',
  },
  {
    icon: Palette,
    title: 'Widget Studio',
    description: 'Customize colors, dark mode, headers, bubble shapes and brand identity.',
    cluster: 'build',
  },
];

const clusters: { id: Cluster; label: string; description: string }[] = [
  { id: 'talk', label: 'Talk', description: 'For people using ƷBI day-to-day.' },
  { id: 'build', label: 'Build', description: 'For teams shipping AI in production.' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

export const PlatformCapabilitiesSection = () => {
  return (
    <SectionWrapper muted>
      <SectionHeading
        title="Everything you need, nothing you don't"
        subtitle="Capabilities grouped around how you'll actually use ƷBI."
      />

      <div className="space-y-12 sm:space-y-16">
        {clusters.map((cluster) => {
          const items = features.filter((f) => f.cluster === cluster.id);
          return (
            <div key={cluster.id}>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
                  <span className="text-primary">{cluster.label}</span>
                </h3>
                <p className="text-sm text-muted-foreground">{cluster.description}</p>
              </div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ staggerChildren: 0.08 }}
              >
                {items.map((feature) => (
                  <motion.article
                    key={feature.title}
                    className="group p-5 sm:p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-500 card-elevated glow-hover"
                    variants={cardVariants}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold mb-1.5 tracking-tight">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
};
