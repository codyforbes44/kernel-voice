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

export default function Showcase() {
  return (
    <PageWrapper
      title="ƷBI Voice Showcase"
      description="Interactive showcase of voice AI components powered by Gemini and ElevenLabs"
      showHeader={true}
      className="dark"
    >
      <div className="px-4 pt-6 pb-20 safe-area-inset">
        {/* Hero strip */}
        <div className="mx-auto max-w-7xl flex items-center gap-3 mb-6 sm:mb-8">
          <img src={logo} alt="ƷBI Voice" className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
          <div>
            <h1 className="text-lg sm:text-xl font-display font-bold text-gradient">ƷBI Voice Showcase</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Interactive voice AI components</p>
          </div>
        </div>

        {/* Card grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:grid-rows-[repeat(4,minmax(0,1fr))] lg:min-h-[calc(100vh-120px)]"
        >
          {/* Row 1: Input-focused */}
          <motion.div variants={fadeUp}><WaveformCard /></motion.div>
          <motion.div variants={fadeUp}><VoiceFillCard /></motion.div>
          <motion.div variants={fadeUp}><AgentOrbsCard /></motion.div>
          {/* Row 2: Audio/viz */}
          <motion.div variants={fadeUp}><CharacterSelectCard /></motion.div>
          <motion.div variants={fadeUp}><ShowcaseWaveform /></motion.div>
          <motion.div variants={fadeUp}><MusicPlayerCard /></motion.div>
          {/* Row 3: Conversation */}
          <motion.div variants={fadeUp}><VoiceChatCard /></motion.div>
          <motion.div variants={fadeUp}><ChatConversationCard /></motion.div>
          <motion.div variants={fadeUp}><TrackListCard /></motion.div>
          {/* Row 4: Playback/support */}
          <motion.div variants={fadeUp}><AudioPlayerCard /></motion.div>
          <motion.div variants={fadeUp}><LiveStatusCard /></motion.div>
          <motion.div variants={fadeUp}><WidgetChatCard /></motion.div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
