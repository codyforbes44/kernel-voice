import { motion } from 'framer-motion';
import { AgentOrbsCard } from '@/components/showcase/AgentOrbsCard';
import { OpenAIRealtimeCard } from '@/components/showcase/OpenAIRealtimeCard';
import { VoiceChatCard } from '@/components/showcase/VoiceChatCard';
import { ChatConversationCard } from '@/components/showcase/ChatConversationCard';
import { WebSearchCard } from '@/components/showcase/WebSearchCard';
import { ClaudeReasoningCard } from '@/components/showcase/ClaudeReasoningCard';
import { WidgetChatCard } from '@/components/showcase/WidgetChatCard';
import { VoiceFillCard } from '@/components/showcase/VoiceFillCard';
import { CharacterSelectCard } from '@/components/showcase/CharacterSelectCard';
import { ShowcaseWaveform } from '@/components/showcase/ShowcaseWaveform';
import { MusicPlayerCard } from '@/components/showcase/MusicPlayerCard';
import { ParticleFieldCard } from '@/components/showcase/ParticleFieldCard';

import { LiveStatusCard } from '@/components/showcase/LiveStatusCard';
import { PageWrapper } from '@/components/layout/PageWrapper';
import logo from '@/assets/logo.png';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full flex items-center gap-3 pt-6 first:pt-0">
      <div className="h-px flex-1 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
      <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/60 shrink-0">
        {children}
      </p>
      <div className="h-px flex-1 bg-gradient-to-l from-primary/30 via-primary/10 to-transparent" />
    </div>
  );
}

export default function Showcase() {
  return (
    <PageWrapper
      title="ƷBI Voice Playground"
      description="Interactive playground of voice AI components powered by Gemini and ElevenLabs"
      showHeader={false}
      className="dark"
    >
      <div className="px-4 pt-6 sm:pt-10 pb-24 safe-area-inset">
        {/* Hero strip */}
        <div className="mx-auto max-w-7xl flex items-center gap-3 mb-6 sm:mb-8">
          <img src={logo} alt="ƷBI Voice" className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
          <div>
            <h1 className="text-lg sm:text-xl font-display font-bold text-gradient">ƷBI Voice Playground</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Interactive voice AI components</p>
          </div>
        </div>

        {/* Card grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5"
        >
          {/* Voice Agents */}
          <SectionLabel>Voice Agents</SectionLabel>
          <motion.div variants={fadeUp} className="sm:col-span-2 lg:col-span-1 transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><AgentOrbsCard /></motion.div>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><OpenAIRealtimeCard /></motion.div>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><VoiceChatCard /></motion.div>

          {/* Text Conversations */}
          <SectionLabel>Text Conversations</SectionLabel>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><ChatConversationCard /></motion.div>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><WebSearchCard /></motion.div>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><ClaudeReasoningCard /></motion.div>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><WidgetChatCard /></motion.div>

          {/* Voice Input + Processing */}
          <SectionLabel>Voice Input</SectionLabel>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><VoiceFillCard /></motion.div>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><CharacterSelectCard /></motion.div>

          {/* Visualizations */}
          <SectionLabel>Visualizations</SectionLabel>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><ShowcaseWaveform /></motion.div>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><MusicPlayerCard /></motion.div>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><ParticleFieldCard /></motion.div>
          <motion.div variants={fadeUp} className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-glow-subtle"><LiveStatusCard /></motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
