import { lazy, Suspense, type ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Eagerly import lightweight cards, lazy-load heavy ones
import { LiveStatusCard } from './LiveStatusCard';
import { CharacterSelectCard } from './CharacterSelectCard';

const AgentOrbsCard = lazy(() => import('./AgentOrbsCard').then((m) => ({ default: m.AgentOrbsCard })));
const OpenAIRealtimeCard = lazy(() => import('./OpenAIRealtimeCard').then((m) => ({ default: m.OpenAIRealtimeCard })));
const VoiceChatCard = lazy(() => import('./VoiceChatCard').then((m) => ({ default: m.VoiceChatCard })));
const ChatConversationCard = lazy(() => import('./ChatConversationCard').then((m) => ({ default: m.ChatConversationCard })));
const WebSearchCard = lazy(() => import('./WebSearchCard').then((m) => ({ default: m.WebSearchCard })));
const ClaudeReasoningCard = lazy(() => import('./ClaudeReasoningCard').then((m) => ({ default: m.ClaudeReasoningCard })));
const WidgetChatCard = lazy(() => import('./WidgetChatCard').then((m) => ({ default: m.WidgetChatCard })));
const VoiceFillCard = lazy(() => import('./VoiceFillCard').then((m) => ({ default: m.VoiceFillCard })));
const ShowcaseWaveform = lazy(() => import('./ShowcaseWaveform').then((m) => ({ default: m.ShowcaseWaveform })));
const MusicPlayerCard = lazy(() => import('./MusicPlayerCard').then((m) => ({ default: m.MusicPlayerCard })));
const ParticleFieldCard = lazy(() => import('./ParticleFieldCard').then((m) => ({ default: m.ParticleFieldCard })));

const registry: Record<string, ComponentType> = {
  'agent-orbs': AgentOrbsCard,
  'openai-realtime': OpenAIRealtimeCard,
  'voice-chat': VoiceChatCard,
  'chat-conversation': ChatConversationCard,
  'web-search': WebSearchCard,
  'claude-reasoning': ClaudeReasoningCard,
  'widget-chat': WidgetChatCard,
  'voice-fill': VoiceFillCard,
  'character-select': CharacterSelectCard,
  'showcase-waveform': ShowcaseWaveform,
  'music-player': MusicPlayerCard,
  'particle-field': ParticleFieldCard,
  'live-status': LiveStatusCard,
};

function CardFallback() {
  return <Skeleton className="w-full h-48 rounded-2xl" />;
}

export function renderCard(id: string) {
  const Component = registry[id];
  if (!Component) return null;
  return (
    <Suspense fallback={<CardFallback />}>
      <Component />
    </Suspense>
  );
}

export { registry };
