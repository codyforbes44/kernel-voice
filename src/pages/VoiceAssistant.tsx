import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Upload, Plus, X } from 'lucide-react';
import ConversationHistory from '@/components/voice/ConversationHistory';
import DocumentUpload from '@/components/voice/DocumentUpload';
import MessageHistory from '@/components/voice/MessageHistory';
import { ConversationReceipt } from '@/components/voice/ConversationReceipt';
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
import { VoiceSettingsPanel } from '@/components/voice/VoiceSettingsPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { agents, isLoading: agentsLoading, createAgent, updateAgent, deleteAgent, duplicateAgent } = useSavedAgents();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SavedAgent | null>(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    isPaused,
    resumeConversation,
    lastSessionStats,
  } = useVoiceAssistant();

  // Wake word detection
  const handleWakeWordDetected = useCallback(() => {
    setInputMode('voice');
    setTimeout(() => { startConversation(); }, 100);
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

  const handleResumeDetected = useCallback(() => { resumeConversation(); }, [resumeConversation]);

  useWakeWordDetection({
    wakeWords: ['continue the conversation', 'resume the conversation', 'unpause'],
    onWakeWordDetected: handleResumeDetected,
    enabled: isPaused && isConnected,
  });

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

  const voiceInterfaceProps = useMemo(() => ({
    voiceProvider, setVoiceProvider,
    openaiVoice, setOpenAIVoice, openaiSettings, setOpenAISettings,
    elevenlabsSettings, setElevenLabsSettings, geminiLiveSettings, setGeminiLiveSettings,
    systemPrompt, setSystemPrompt, providerLoading,
    isConnected, isConnecting, connectionError, connectionAuthMethod, connectionPhase,
    isSpeaking, inputAudioLevel, outputAudioLevel, isMuted, toggleMute, volume, setVolume,
    inputMode, setInputMode, startConversation, endConversation, retryConnection, clearConnectionError,
    sendTextMessage, isProcessingText, activeToolCall, permissionState, requestPermission, isReady,
    isAuthenticated, isMobile: isMobile ?? false,
    isWakeWordListening, isWakeWordSupported, wakeWordLastHeard,
    onSaveAgent: () => { setEditingAgent(null); setSaveDialogOpen(true); },
    isPaused, onResume: resumeConversation,
    onToggleSettings: () => setSettingsOpen(prev => !prev),
    settingsOpen,
  }), [
    voiceProvider, setVoiceProvider, openaiVoice, setOpenAIVoice, openaiSettings, setOpenAISettings,
    elevenlabsSettings, setElevenLabsSettings, geminiLiveSettings, setGeminiLiveSettings,
    systemPrompt, setSystemPrompt, providerLoading,
    isConnected, isConnecting, connectionError, connectionAuthMethod, connectionPhase,
    isSpeaking, inputAudioLevel, outputAudioLevel, isMuted, toggleMute, volume, setVolume,
    inputMode, setInputMode, startConversation, endConversation, retryConnection, clearConnectionError,
    sendTextMessage, isProcessingText, activeToolCall, permissionState, requestPermission, isReady,
    isAuthenticated, isMobile, isWakeWordListening, isWakeWordSupported, wakeWordLastHeard,
    isPaused, resumeConversation, settingsOpen,
  ]);

  // Shared dialogs
  const dialogs = (
    <>
      <RegistrationPromptModal 
        open={showRegistrationPrompt}
        onOpenChange={setShowRegistrationPrompt}
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

  // ─── Mobile Layout ───
  if (isMobile) {
    return (
      <>
        <SEO 
          title="ƷBI Voice - Voice Assistant"
          description="Experience the future of AI interaction with real-time voice conversations, intelligent web search, and advanced document analysis."
          image="/og-home.png"
          keywords={["AI voice assistant", "voice AI", "real-time conversation", "document analysis", "web search AI"]}
        />
        <div className="flex flex-col h-[100dvh] bg-background safe-area-inset">
          <Header />
          <main id="main-content" className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
            <div className="flex-1 flex flex-col px-3 pt-2 pb-4">
              {/* Banners */}
              {isAuthenticated && <UpgradeBanner className="mb-2" />}
              {!isAuthenticated && <GuestModeBanner variant="compact" className="mb-2" />}
              {isAuthenticated && conversationTitle && (
                <ConversationBanner 
                  title={conversationTitle} 
                  onNewConversation={handleNewConversation}
                  variant="compact"
                  className="mb-2"
                />
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

              {/* Main Voice Interface - expanded for immersion */}
              <VoiceErrorBoundary>
                <VoiceInterfaceCard {...voiceInterfaceProps} />
              </VoiceErrorBoundary>

              {/* Live Transcripts */}
              {(isConnected || liveTranscripts.length > 0 || inputMode === 'text') && (
                <div className="mt-3">
                  <LiveTranscripts 
                    transcripts={liveTranscripts}
                    isConnected={isConnected || inputMode === 'text'}
                    isSpeaking={isSpeaking}
                  />
                </div>
              )}

              {/* Conversation Receipt (mobile) */}
              {isAuthenticated && lastSessionStats && !isConnected && (
                <ConversationReceipt 
                  stats={lastSessionStats} 
                  onDismiss={() => {}} 
                />
              )}

              {/* Message History for guests */}
              {!isAuthenticated && guestMessages.length > 0 && (
                <div className="mt-3">
                  <MessageHistory conversationId={conversationId} />
                </div>
              )}
            </div>
          </main>

          {/* FAB for Conversations & Upload */}
          {isAuthenticated && (
            <Sheet open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="fixed bottom-6 right-4 z-40 h-14 w-14 rounded-full shadow-lg glow-primary"
                  aria-label="Open actions menu"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Actions</SheetTitle>
                  <SheetDescription>Manage conversations and documents</SheetDescription>
                </SheetHeader>
                <div className="pt-4 pb-8 space-y-6">
                  <ConversationHistory 
                    currentConversationId={conversationId}
                    onSelectConversation={(id) => { setConversationId(id); setMobileActionsOpen(false); }}
                    onConversationCreated={() => {}}
                  />
                  <DocumentUpload conversationId={conversationId} />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
        {dialogs}
      </>
    );
  }

  // ─── Desktop Layout ───
  return (
    <>
      <SEO 
        title="Voice Assistant"
        description="Start a real-time voice conversation with AI."
        image="/og-assistant.png"
        keywords={["voice conversation", "AI chat", "voice control", "hands-free AI"]}
      />
      <div className="h-screen bg-background flex flex-col">
        <Header />
        <SidebarProvider defaultOpen={isAuthenticated}>
          <div className="flex flex-1 w-full overflow-hidden">
            {isAuthenticated && (
              <Sidebar collapsible="offcanvas" className="w-72">
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

            <SidebarInset className="flex-1 min-w-0">
              <main id="main-content" className="h-full overflow-y-auto scrollbar-hide">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                  {isAuthenticated && <UpgradeBanner className="mb-4" />}
                  {!isAuthenticated && <GuestModeBanner className="mb-4" />}
                  {isAuthenticated && conversationTitle && (
                    <ConversationBanner 
                      title={conversationTitle} 
                      onNewConversation={handleNewConversation}
                      className="mb-4"
                    />
                  )}
                  
                  {isAuthenticated && (
                    <div className="mb-4">
                      <SidebarTrigger className="min-h-[44px]" />
                    </div>
                  )}

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

                  <VoiceErrorBoundary>
                    <VoiceInterfaceCard {...voiceInterfaceProps} />
                  </VoiceErrorBoundary>

                  {(isConnected || liveTranscripts.length > 0 || inputMode === 'text') && (
                    <div className="mt-6">
                      <LiveTranscripts 
                        transcripts={liveTranscripts}
                        isConnected={isConnected || inputMode === 'text'}
                        isSpeaking={isSpeaking}
                      />
                    </div>
                  )}

                  {/* Conversation Receipt */}
                  {isAuthenticated && lastSessionStats && !isConnected && (
                    <ConversationReceipt 
                      stats={lastSessionStats} 
                      onDismiss={() => {}} 
                    />
                  )}

                  <div className="mt-6">
                    <MessageHistory conversationId={conversationId} />
                  </div>
                </div>
              </main>
            </SidebarInset>

            {/* Right Settings Panel */}
            <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${settingsOpen ? 'w-80' : 'w-0'}`}>
              <div
                className={`w-80 h-full border-l border-border bg-card transition-transform duration-300 ease-in-out ${
                  settingsOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                <div className="w-80 h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                  <h2 className="text-sm font-semibold">Settings</h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <VoiceSettingsPanel
                      voiceProvider={voiceProvider}
                      onVoiceProviderChange={setVoiceProvider}
                      openaiVoice={openaiVoice}
                      onOpenAIVoiceChange={setOpenAIVoice}
                      openaiSettings={openaiSettings}
                      onOpenAISettingsChange={setOpenAISettings}
                      elevenlabsSettings={elevenlabsSettings}
                      onElevenLabsSettingsChange={setElevenLabsSettings}
                      geminiLiveSettings={geminiLiveSettings}
                      onGeminiLiveSettingsChange={setGeminiLiveSettings}
                      systemPrompt={systemPrompt}
                      onSystemPromptChange={setSystemPrompt}
                      inputMode={inputMode}
                      onInputModeChange={setInputMode}
                      isConnected={isConnected}
                      providerLoading={providerLoading}
                      isAuthenticated={isAuthenticated}
                      onSaveAgent={() => { setEditingAgent(null); setSaveDialogOpen(true); }}
                    />
                  </div>
                </ScrollArea>
              </div>
              </div>
            </div>
          </div>
        </SidebarProvider>
      </div>
      {dialogs}
    </>
  );
};

export default VoiceAssistant;
