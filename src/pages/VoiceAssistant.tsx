import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Upload } from 'lucide-react';
import ConversationHistory from '@/components/voice/ConversationHistory';
import DocumentUpload from '@/components/voice/DocumentUpload';
import MessageHistory from '@/components/voice/MessageHistory';
import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarTrigger,
  SidebarInset 
} from '@/components/ui/sidebar';
import RegistrationPromptModal from '@/components/voice/RegistrationPromptModal';
import { LiveTranscripts } from '@/components/voice/LiveTranscripts';
import { GuestModeBanner } from '@/components/voice/GuestModeBanner';
import { ConversationBanner } from '@/components/voice/ConversationBanner';
import { VoiceInterfaceCard } from '@/components/voice/VoiceInterfaceCard';
import { VoiceErrorBoundary } from '@/components/voice/VoiceErrorBoundary';
import { SavedAgentsList } from '@/components/voice/SavedAgentsList';
import { SaveAgentDialog } from '@/components/voice/SaveAgentDialog';
import { useSavedAgents, type SavedAgent } from '@/hooks/useSavedAgents';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useWakeWordDetection } from '@/hooks/useWakeWordDetection';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCallback, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

/**
 * Voice Assistant page - main interface for AI voice conversations.
 * Supports both mobile and desktop layouts with voice/text input modes.
 */

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { agents, isLoading: agentsLoading, createAgent, updateAgent, deleteAgent, duplicateAgent } = useSavedAgents();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SavedAgent | null>(null);
  
  const {
    isAuthenticated,
    conversationId,
    setConversationId,
    conversationTitle,
    setConversationTitle,
    voiceProvider,
    setVoiceProvider,
    openaiVoice,
    setOpenAIVoice,
    openaiSettings,
    setOpenAISettings,
    elevenlabsSettings,
    setElevenLabsSettings,
    vapiSettings,
    setVapiSettings,
    geminiLiveSettings,
    setGeminiLiveSettings,
    systemPrompt,
    setSystemPrompt,
    providerLoading,
    isConnected,
    isConnecting,
    connectionError,
    connectionAuthMethod,
    connectionPhase,
    isSpeaking,
    inputAudioLevel,
    outputAudioLevel,
    isMuted,
    toggleMute,
    volume,
    setVolume,
    startConversation,
    endConversation,
    retryConnection,
    clearConnectionError,
    liveTranscripts,
    permissionState,
    requestPermission,
    isReady,
    guestMessages,
    showRegistrationPrompt,
    setShowRegistrationPrompt,
    sendTextMessage,
    isProcessingText,
    inputMode,
    setInputMode,
    activeToolCall,
  } = useVoiceAssistant();

  // Wake word detection - only active in text-only mode when not connected
  const handleWakeWordDetected = useCallback(() => {
    setInputMode('voice');
    // Use a small delay to ensure mode switch is complete
    setTimeout(() => {
      startConversation();
    }, 100);
  }, [setInputMode, startConversation]);

  const wakeWordEnabled = inputMode === 'text' && !isConnected && isReady;
  
  const { 
    isListening: isWakeWordListening, 
    isSupported: isWakeWordSupported,
    lastHeard: wakeWordLastHeard,
  } = useWakeWordDetection({
    wakeWords: ['hey 3bi', 'ok 3bi', '3bi'],
    onWakeWordDetected: handleWakeWordDetected,
    enabled: wakeWordEnabled,
  });

  // Keyboard shortcuts (Ctrl+M for mute, Escape to end, Enter to start)
  useKeyboardShortcuts({
    onMuteToggle: toggleMute,
    onEndConversation: endConversation,
    onStartConversation: startConversation,
    isConnected,
    isReady,
    enabled: true,
  });

  const handleNewConversation = useCallback(() => {
    setConversationId(null);
    setConversationTitle(null);
  }, [setConversationId, setConversationTitle]);

  // Agent management handlers
  const getCurrentConfig = useCallback(() => {
    let voiceId = '';
    let providerSettings: Json = {};
    let firstMessage = '';
    if (voiceProvider === 'openai') {
      voiceId = openaiVoice;
      providerSettings = openaiSettings as unknown as Json;
      firstMessage = openaiSettings.firstMessage || '';
    } else if (voiceProvider === 'elevenlabs') {
      providerSettings = elevenlabsSettings as unknown as Json;
      firstMessage = elevenlabsSettings.customFirstMessage || '';
    } else if (voiceProvider === 'vapi' && vapiSettings) {
      providerSettings = vapiSettings as unknown as Json;
    } else if (voiceProvider === 'gemini' && geminiLiveSettings) {
      voiceId = geminiLiveSettings.voice;
      providerSettings = geminiLiveSettings as unknown as Json;
      firstMessage = geminiLiveSettings.customFirstMessage || '';
    }
    return { voiceProvider, voiceId, providerSettings, systemPrompt, firstMessage };
  }, [voiceProvider, openaiVoice, openaiSettings, elevenlabsSettings, vapiSettings, geminiLiveSettings, systemPrompt]);

  const handleLoadAgent = useCallback((agent: SavedAgent) => {
    setVoiceProvider(agent.voice_provider as any);
    if (agent.voice_provider === 'openai' && agent.voice_id) {
      setOpenAIVoice(agent.voice_id as any);
    }
    if (agent.provider_settings && typeof agent.provider_settings === 'object') {
      const settings = agent.provider_settings as Record<string, any>;
      if (agent.voice_provider === 'openai') setOpenAISettings(settings as any);
      else if (agent.voice_provider === 'elevenlabs') setElevenLabsSettings(settings as any);
      else if (agent.voice_provider === 'vapi') setVapiSettings?.(settings as any);
      else if (agent.voice_provider === 'gemini') setGeminiLiveSettings?.(settings as any);
    }

    // Inject required questions into system prompt
    let prompt = agent.system_prompt;
    const rq = agent.required_questions;
    if (rq && rq.length > 0) {
      const lines = rq.map((q, i) => {
        const tag = q.required ? '[Required]' : '[Optional]';
        return `${i + 1}. ${tag} ${q.question} (expect: ${q.type.replace('_', '/')})`;
      });
      prompt += `\n\nIMPORTANT: You must collect answers to the following questions during this conversation. Ask them naturally in the flow of conversation. Do not skip required questions.\n\nQuestions to collect:\n${lines.join('\n')}`;
    }

    setSystemPrompt(prompt);
    setActiveAgentId(agent.id);
    toast.success(`Loaded agent: ${agent.name}`);
  }, [setVoiceProvider, setOpenAIVoice, setOpenAISettings, setElevenLabsSettings, setVapiSettings, setGeminiLiveSettings, setSystemPrompt]);

  const handleSaveAgent = useCallback(async (input: Parameters<typeof createAgent.mutateAsync>[0]) => {
    await createAgent.mutateAsync(input);
  }, [createAgent]);

  const handleUpdateAgent = useCallback(async (id: string, input: Record<string, any>) => {
    await updateAgent.mutateAsync({ id, ...input });
  }, [updateAgent]);

  const handleEditAgent = useCallback((agent: SavedAgent) => {
    setEditingAgent(agent);
    setSaveDialogOpen(true);
  }, []);

  const handleDeleteAgent = useCallback((id: string) => {
    deleteAgent.mutate(id);
    if (activeAgentId === id) setActiveAgentId(null);
  }, [deleteAgent, activeAgentId]);

  // Memoize voice interface card props to prevent unnecessary re-renders
  const voiceInterfaceProps = useMemo(() => ({
    voiceProvider,
    setVoiceProvider,
    openaiVoice,
    setOpenAIVoice,
    openaiSettings,
    setOpenAISettings,
    elevenlabsSettings,
    setElevenLabsSettings,
    geminiLiveSettings,
    setGeminiLiveSettings,
    systemPrompt,
    setSystemPrompt,
    providerLoading,
    isConnected,
    isConnecting,
    connectionError,
    connectionAuthMethod,
    connectionPhase,
    isSpeaking,
    inputAudioLevel,
    outputAudioLevel,
    isMuted,
    toggleMute,
    volume,
    setVolume,
    inputMode,
    setInputMode,
    startConversation,
    endConversation,
    retryConnection,
    clearConnectionError,
    sendTextMessage,
    isProcessingText,
    activeToolCall,
    permissionState,
    requestPermission,
    isReady,
    isAuthenticated,
    isMobile: isMobile ?? false,
    isWakeWordListening,
    isWakeWordSupported,
    wakeWordLastHeard,
    onSaveAgent: () => { setEditingAgent(null); setSaveDialogOpen(true); },
  }), [
    voiceProvider, setVoiceProvider,
    openaiVoice, setOpenAIVoice, openaiSettings, setOpenAISettings,
    elevenlabsSettings, setElevenLabsSettings, geminiLiveSettings, setGeminiLiveSettings,
    systemPrompt, setSystemPrompt,
    providerLoading, isConnected, isConnecting, connectionError, connectionAuthMethod, connectionPhase,
    isSpeaking, inputAudioLevel, outputAudioLevel, isMuted, toggleMute, volume, setVolume,
    inputMode, setInputMode, startConversation, endConversation, retryConnection, clearConnectionError,
    sendTextMessage, isProcessingText, activeToolCall, permissionState, requestPermission, isReady,
    isAuthenticated, isMobile, isWakeWordListening, isWakeWordSupported, wakeWordLastHeard,
  ]);

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <SEO 
          title="ƷBI Voice - Voice Assistant"
          description="Experience the future of AI interaction with real-time voice conversations, intelligent web search, and advanced document analysis."
          image="/og-home.png"
          keywords={["AI voice assistant", "voice AI", "real-time conversation", "document analysis", "web search AI"]}
        />
        <div className="flex flex-col min-h-screen bg-background safe-area-inset">
          <Header />
          <div className="flex-1 flex flex-col px-3 pt-2 pb-4">
            {/* Upgrade Banner for free users */}
            {isAuthenticated && <UpgradeBanner className="mb-2" />}

            {/* Guest Banner */}
            {!isAuthenticated && <GuestModeBanner variant="compact" className="mb-2" />}

            {/* Conversation Banner */}
            {isAuthenticated && conversationTitle && (
              <ConversationBanner 
                title={conversationTitle} 
                onNewConversation={handleNewConversation}
                variant="compact"
                className="mb-2"
              />
            )}
            
            {/* Action Buttons */}
            {isAuthenticated && (
              <div className="flex justify-end gap-2 mb-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11 min-h-[44px]">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[85vw] flex flex-col">
                    <SheetHeader>
                      <SheetTitle>Conversations</SheetTitle>
                      <SheetDescription>View your conversation history</SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 space-y-4 overflow-y-auto pt-4">
                      <ConversationHistory 
                        currentConversationId={conversationId}
                        onSelectConversation={setConversationId}
                        onConversationCreated={() => {}}
                      />
                      <MessageHistory conversationId={conversationId} />
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11 min-h-[44px]">
                      <Upload className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw]">
                    <SheetHeader>
                      <SheetTitle>Document Upload</SheetTitle>
                      <SheetDescription>Upload documents for analysis</SheetDescription>
                    </SheetHeader>
                    <div className="pt-4">
                      <DocumentUpload conversationId={conversationId} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}

            {/* Saved Agents */}
            {isAuthenticated && (
              <SavedAgentsList
                agents={agents}
                isLoading={agentsLoading}
                activeAgentId={activeAgentId}
                onLoadAgent={handleLoadAgent}
                onEditAgent={handleEditAgent}
                onDuplicateAgent={duplicateAgent}
                onDeleteAgent={handleDeleteAgent}
              />
            )}

            {/* Main Voice Interface */}
            <VoiceErrorBoundary>
              <VoiceInterfaceCard {...voiceInterfaceProps} />
            </VoiceErrorBoundary>

            {/* Live Transcripts */}
            {(isConnected || liveTranscripts.length > 0 || inputMode === 'text') && (
              <div className="mt-4">
                <LiveTranscripts 
                  transcripts={liveTranscripts}
                  isConnected={isConnected || inputMode === 'text'}
                  isSpeaking={isSpeaking}
                />
              </div>
            )}

            {/* Message History for guests */}
            {!isAuthenticated && guestMessages.length > 0 && (
              <div className="mt-4">
                <MessageHistory conversationId={conversationId} />
              </div>
            )}
          </div>
        </div>
        
        <RegistrationPromptModal 
          open={showRegistrationPrompt}
          onOpenChange={setShowRegistrationPrompt}
          messageCount={guestMessages.length / 2}
        />
        <SaveAgentDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={handleSaveAgent}
          onUpdate={handleUpdateAgent}
          editingAgent={editingAgent}
          currentConfig={getCurrentConfig()}
          saving={createAgent.isPending || updateAgent.isPending}
        />
      </>
    );
  }

  // Desktop Layout
  return (
    <>
      <SEO 
        title="Voice Assistant"
        description="Start a real-time voice conversation with AI. Natural, fluid interactions with intelligent web search and advanced document analysis capabilities."
        image="/og-assistant.png"
        keywords={["voice conversation", "AI chat", "voice control", "hands-free AI", "conversational AI"]}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <SidebarProvider defaultOpen={isAuthenticated}>
          <div className="flex w-full">
            {isAuthenticated && (
              <Sidebar collapsible="offcanvas">
                <SidebarContent className="p-4 space-y-6">
                  <ConversationHistory 
                    currentConversationId={conversationId}
                    onSelectConversation={setConversationId}
                    onConversationCreated={() => {}}
                  />
                  <DocumentUpload conversationId={conversationId} />
                </SidebarContent>
              </Sidebar>
            )}

            <SidebarInset>
              <div className="container mx-auto px-4 py-8">
                {/* Upgrade Banner for free users */}
                {isAuthenticated && <UpgradeBanner className="mb-4" />}

                {/* Guest Banner */}
                {!isAuthenticated && <GuestModeBanner className="mb-4" />}

                {/* Conversation Banner */}
                {isAuthenticated && conversationTitle && (
                  <ConversationBanner 
                    title={conversationTitle} 
                    onNewConversation={handleNewConversation}
                    className="mb-4"
                  />
                )}
                
                {/* Sidebar Trigger */}
                {isAuthenticated && (
                  <div className="mb-4">
                    <SidebarTrigger className="min-h-[44px]" />
                  </div>
                )}

                {/* Saved Agents */}
                {isAuthenticated && (
                  <SavedAgentsList
                    agents={agents}
                    isLoading={agentsLoading}
                    activeAgentId={activeAgentId}
                    onLoadAgent={handleLoadAgent}
                    onEditAgent={handleEditAgent}
                    onDuplicateAgent={duplicateAgent}
                    onDeleteAgent={handleDeleteAgent}
                  />
                )}

                {/* Main Voice Interface */}
                <VoiceErrorBoundary>
                  <VoiceInterfaceCard {...voiceInterfaceProps} />
                </VoiceErrorBoundary>

                {/* Live Transcripts */}
                {(isConnected || liveTranscripts.length > 0 || inputMode === 'text') && (
                  <div className="mt-6">
                    <LiveTranscripts 
                      transcripts={liveTranscripts}
                      isConnected={isConnected || inputMode === 'text'}
                      isSpeaking={isSpeaking}
                    />
                  </div>
                )}

                {/* Message History */}
                <div className="mt-6">
                  <MessageHistory conversationId={conversationId} />
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
      
      <RegistrationPromptModal 
        open={showRegistrationPrompt}
        onOpenChange={setShowRegistrationPrompt}
        messageCount={guestMessages.length / 2}
      />
      <SaveAgentDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveAgent}
        onUpdate={handleUpdateAgent}
        editingAgent={editingAgent}
        currentConfig={getCurrentConfig()}
        saving={createAgent.isPending || updateAgent.isPending}
      />
    </>
  );
};

export default VoiceAssistant;
