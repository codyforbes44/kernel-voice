import { Mic, Bot, Code2, FileSearch, Keyboard, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';

const features = [
  {
    icon: Mic,
    title: 'Multi-Provider Voice',
    description: 'Choose from ElevenLabs, Gemini, OpenAI, or VAPI for the perfect voice experience.',
  },
  {
    icon: Bot,
    title: 'Custom AI Agents',
    description: 'Create, save, and switch between personalized AI assistants with unique personalities.',
  },
  {
    icon: Code2,
    title: 'Embeddable Widgets',
    description: 'Deploy AI chat and voice widgets on any website with full visual customization.',
  },
  {
    icon: FileSearch,
    title: 'Knowledge Base',
    description: 'Upload documents and build a searchable knowledge base your AI can reference.',
  },
  {
    icon: Keyboard,
    title: 'Voice, Text, or Both',
    description: 'Seamlessly switch between voice, text, and combined input modes.',
  },
  {
    icon: Palette,
    title: 'Widget Studio',
    description: 'Customize colors, dark mode, header styles, bubble shapes, and brand identity.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

export const PlatformCapabilitiesSection = () => {
  return (
    <SectionWrapper muted>
      <SectionHeading
        title="Platform Capabilities"
        subtitle="Everything you need to build, customize, and deploy AI-powered voice and chat experiences."
      />

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {features.map((feature) => (
          <motion.article
            key={feature.title}
            className="group p-5 sm:p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-500 card-elevated glow-hover"
            variants={cardVariants}
            transition={{ duration: 0.5 }}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
              <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 tracking-tight">{feature.title}</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
          </motion.article>
        ))}
      </motion.div>
    </SectionWrapper>
  );
};
