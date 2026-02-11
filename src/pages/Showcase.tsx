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

export default function Showcase() {
  return (
    <div className="dark min-h-screen bg-black p-4 md:p-8">
      <div className="mx-auto max-w-7xl columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        <WaveformCard />
        <VoiceFillCard />
        <AgentOrbsCard />
        <CharacterSelectCard />
        <ShowcaseWaveform />
        <MusicPlayerCard />
        <VoiceChatCard />
        <ChatConversationCard />
        <TrackListCard />
        <AudioPlayerCard />
        <LiveStatusCard />
        <WidgetChatCard />
      </div>
    </div>
  );
}
