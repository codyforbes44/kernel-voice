import { motion } from 'framer-motion';
import { WaveformCard } from '@/components/showcase/WaveformCard';
import { VoiceFillCard } from '@/components/showcase/VoiceFillCard';
import { AgentOrbsCard } from '@/components/showcase/AgentOrbsCard';
import { CharacterSelectCard } from '@/components/showcase/CharacterSelectCard';
import { ShowcaseWaveform } from '@/components/showcase/ShowcaseWaveform';
import { MusicPlayerCard } from '@/components/showcase/MusicPlayerCard';
import { VoiceChatCard } from '@/components/showcase/VoiceChatCard';
import { ChatConversationCard } from '@/components/showcase/ChatConversationCard';
import { TrackListCard } from '@/components/showcase/TrackListCard';
import { AudioPlayerCard } from '@/components/showcase/AudioPlayerCard';
import { LiveStatusCard } from '@/components/showcase/LiveStatusCard';
import { WidgetChatCard } from '@/components/showcase/WidgetChatCard';
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
    <p className="col-span-full text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 pt-2">
      {children}
    </p>
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
          {/* Voice Input */}
          <SectionLabel>Voice Input</SectionLabel>
          <motion.div variants={fadeUp} className="sm:col-span-2 lg:col-span-1"><AgentOrbsCard /></motion.div>
          <motion.div variants={fadeUp}><VoiceChatCard /></motion.div>
          <motion.div variants={fadeUp}><WaveformCard /></motion.div>

          {/* Conversations */}
          <SectionLabel>Conversations</SectionLabel>
          <motion.div variants={fadeUp} className="sm:col-span-2 lg:col-span-1"><ChatConversationCard /></motion.div>
          <motion.div variants={fadeUp}><VoiceFillCard /></motion.div>
          <motion.div variants={fadeUp}><WidgetChatCard /></motion.div>

          {/* Visualizations */}
          <SectionLabel>Visualizations</SectionLabel>
          <motion.div variants={fadeUp}><ShowcaseWaveform /></motion.div>
          <motion.div variants={fadeUp}><CharacterSelectCard /></motion.div>

          {/* Audio Playback */}
          <SectionLabel>Audio Playback</SectionLabel>
          <motion.div variants={fadeUp}><MusicPlayerCard /></motion.div>
          <motion.div variants={fadeUp}><AudioPlayerCard /></motion.div>
          <motion.div variants={fadeUp}><TrackListCard /></motion.div>
          <motion.div variants={fadeUp}><LiveStatusCard /></motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
