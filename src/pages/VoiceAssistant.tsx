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
import { useAgentManager } from '@/hooks/useAgentManager';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useWakeWordDetection } from '@/hooks/useWakeWordDetection';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCallback, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { UpgradeBanner } from '@/components/subscription/UpgradeBanner';

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const va = useVoiceAssistant();

  const agentManager = useAgentManager({
    voiceProvider: va.voiceProvider,
    openaiVoice: va.openaiVoice,
    openaiSettings: va.openaiSettings,
    elevenlabsSettings: va.elevenlabsSettings,
    vapiSettings: va.vapiSettings,
    geminiLiveSettings: va.geminiLiveSettings,
    systemPrompt: va.systemPrompt,
    setVoiceProvider: va.setVoiceProvider,
    setOpenAIVoice: va.setOpenAIVoice,
    setOpenAISettings: va.setOpenAISettings,
    setElevenLabsSettings: va.setElevenLabsSettings,
    setVapiSettings: va.setVapiSettings,
    setGeminiLiveSettings: va.setGeminiLiveSettings,
    setSystemPrompt: va.setSystemPrompt,
  });

  // Wake word detection
  const handleWakeWordDetected = useCallback(() => {
    va.setInputMode('voice');
    setTimeout(() => { va.startConversation(); }, 100);
  }, [va.setInputMode, va.startConversation]);

  const wakeWordEnabled = va.inputMode === 'text' && !va.isConnected && va.isReady;
  
  const { 
    isListening: isWakeWordListening, 
    isSupported: isWakeWordSupported,
    lastHeard: wakeWordLastHeard,
  } = useWakeWordDetection({
    wakeWords: ['hey Ʒbi', 'ok Ʒbi', 'Ʒbi'],
    onWakeWordDetected: handleWakeWordDetected,
    enabled: wakeWordEnabled,
  });

  const handleResumeDetected = useCallback(() => { va.resumeConversation(); }, [va.resumeConversation]);

  useWakeWordDetection({
    wakeWords: ['continue the conversation', 'resume the conversation', 'unpause'],
    onWakeWordDetected: handleResumeDetected,
    enabled: va.isPaused && va.isConnected,
  });

  useKeyboardShortcuts({
    onMuteToggle: va.toggleMute,
    onEndConversation: va.endConversation,
    onStartConversation: va.startConversation,
    isConnected: va.isConnected,
    isReady: va.isReady,
    enabled: true,
  });

  const handleNewConversation = useCallback(() => {
    va.setConversationId(null);
    va.setConversationTitle(null);
  }, [va.setConversationId, va.setConversationTitle]);

  const voiceInterfaceProps = useMemo(() => ({
    voiceProvider: va.voiceProvider, setVoiceProvider: va.setVoiceProvider,
    openaiVoice: va.openaiVoice, setOpenAIVoice: va.setOpenAIVoice, 
    openaiSettings: va.openaiSettings, setOpenAISettings: va.setOpenAISettings,
    elevenlabsSettings: va.elevenlabsSettings, setElevenLabsSettings: va.setElevenLabsSettings, 
    geminiLiveSettings: va.geminiLiveSettings, setGeminiLiveSettings: va.setGeminiLiveSettings,
    systemPrompt: va.systemPrompt, setSystemPrompt: va.setSystemPrompt, providerLoading: va.providerLoading,
    isConnected: va.isConnected, isConnecting: va.isConnecting, connectionError: va.connectionError, 
    connectionAuthMethod: va.connectionAuthMethod, connectionPhase: va.connectionPhase,
    isSpeaking: va.isSpeaking, inputAudioLevel: va.inputAudioLevel, outputAudioLevel: va.outputAudioLevel, 
    isMuted: va.isMuted, toggleMute: va.toggleMute, volume: va.volume, setVolume: va.setVolume,
    inputMode: va.inputMode, setInputMode: va.setInputMode, startConversation: va.startConversation, 
    endConversation: va.endConversation, retryConnection: va.retryConnection, clearConnectionError: va.clearConnectionError,
    sendTextMessage: va.sendTextMessage, isProcessingText: va.isProcessingText, activeToolCall: va.activeToolCall, 
    permissionState: va.permissionState, requestPermission: va.requestPermission, isReady: va.isReady,
    isAuthenticated: va.isAuthenticated, isMobile: isMobile ?? false,
    isWakeWordListening, isWakeWordSupported, wakeWordLastHeard,
    onSaveAgent: agentManager.openSaveDialog,
    isPaused: va.isPaused, onResume: va.resumeConversation,
    onToggleSettings: () => setSettingsOpen(prev => !prev),
    settingsOpen,
  }), [va, isMobile, isWakeWordListening, isWakeWordSupported, wakeWordLastHeard, agentManager.openSaveDialog, settingsOpen]);

  // Shared dialogs
  const dialogs = (
    <>
      <RegistrationPromptModal 
        open={va.showRegistrationPrompt}
        onOpenChange={va.setShowRegistrationPrompt}
      />
      <SaveAgentDialog
        open={agentManager.saveDialogOpen}
        onOpenChange={agentManager.setSaveDialogOpen}
        onSave={agentManager.handleSaveAgent}
        onUpdate={agentManager.handleUpdateAgent}
        editingAgent={agentManager.editingAgent}
        currentConfig={agentManager.getCurrentConfig()}
        saving={agentManager.createAgent.isPending || agentManager.updateAgent.isPending}
      />
    </>
  );

  const agentsList = va.isAuthenticated && (
    <SavedAgentsList
      agents={agentManager.agents}
      isLoading={agentManager.agentsLoading}
      activeAgentId={agentManager.activeAgentId}
      onLoadAgent={agentManager.handleLoadAgent}
      onEditAgent={agentManager.handleEditAgent}
      onDuplicateAgent={agentManager.duplicateAgent}
      onDeleteAgent={agentManager.handleDeleteAgent}
    />
  );

  const transcripts = (va.isConnected || va.liveTranscripts.length > 0 || va.inputMode === 'text') && (
    <LiveTranscripts 
      transcripts={va.liveTranscripts}
      isConnected={va.isConnected || va.inputMode === 'text'}
      isSpeaking={va.isSpeaking}
    />
  );

  const receipt = va.isAuthenticated && va.lastSessionStats && !va.isConnected && (
    <ConversationReceipt stats={va.lastSessionStats} onDismiss={() => {}} />
  );

  // ─── Mobile Layout ───
  if (isMobile) {
    return (
      <>
        <SEO 
          title="ƷBI Assistant"
          description="Experience the future of AI interaction with real-time voice conversations, intelligent web search, and advanced document analysis."
          image="/og-home.png"
          keywords={["AI voice assistant", "voice AI", "real-time conversation", "document analysis", "web search AI"]}
        />
        <div className="flex flex-col min-h-dvh bg-background pt-safe pb-safe">
          <Header />
          <main id="main-content" className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
            <div className="flex-1 flex flex-col px-3 pt-2 pb-24">
              <div role="status" aria-live="polite" className="sr-only">
                {va.isConnecting ? 'Connecting' : va.isConnected ? 'Connected' : va.connectionError ? 'Connection error' : 'Idle'}
              </div>
              {va.isAuthenticated && <UpgradeBanner className="mb-2" />}
              {!va.isAuthenticated && <GuestModeBanner variant="compact" className="mb-2" />}
              {va.isAuthenticated && va.conversationTitle && (
                <ConversationBanner title={va.conversationTitle} onNewConversation={handleNewConversation} variant="compact" className="mb-2" />
              )}
              {agentsList}
              <VoiceErrorBoundary><VoiceInterfaceCard {...voiceInterfaceProps} /></VoiceErrorBoundary>
              {transcripts && <div className="mt-3" aria-live="polite">{transcripts}</div>}
              {receipt}
              {!va.isAuthenticated && va.guestMessages.length > 0 && (
                <div className="mt-3"><MessageHistory conversationId={va.conversationId} /></div>
              )}
            </div>
          </main>

          {va.isAuthenticated && (
            <Sheet open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  className="fixed right-4 z-40 h-14 w-14 rounded-full shadow-lg glow-primary tap-target"
                  style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
                  aria-label="Open conversations and uploads"
                >
                  <Plus className="h-6 w-6" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[85dvh] rounded-t-2xl pb-safe">
                <SheetHeader>
                  <SheetTitle>Actions</SheetTitle>
                  <SheetDescription>Manage conversations and documents</SheetDescription>
                </SheetHeader>
                <div className="pt-4 pb-8 space-y-6">
                  <ConversationHistory 
                    currentConversationId={va.conversationId}
                    onSelectConversation={(id) => { va.setConversationId(id); setMobileActionsOpen(false); }}
                    onConversationCreated={() => {}}
                  />
                  <DocumentUpload conversationId={va.conversationId} />
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
      <div className="h-dvh bg-background flex flex-col">
        <Header />
        <SidebarProvider defaultOpen={va.isAuthenticated}>
          <div className="flex flex-1 w-full overflow-hidden">
            {va.isAuthenticated && (
              <Sidebar collapsible="offcanvas" className="w-72">
                <SidebarContent className="p-4 space-y-6">
                  <ConversationHistory 
                    currentConversationId={va.conversationId}
                    onSelectConversation={va.setConversationId}
                    onConversationCreated={() => {}}
                  />
                  <DocumentUpload conversationId={va.conversationId} />
                </SidebarContent>
              </Sidebar>
            )}

            <SidebarInset className="flex-1 min-w-0">
              <main id="main-content" className="h-full overflow-y-auto scrollbar-hide">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                  {va.isAuthenticated && <UpgradeBanner className="mb-4" />}
                  {!va.isAuthenticated && <GuestModeBanner className="mb-4" />}
                  {va.isAuthenticated && va.conversationTitle && (
                    <ConversationBanner title={va.conversationTitle} onNewConversation={handleNewConversation} className="mb-4" />
                  )}
                  
                  {va.isAuthenticated && (
                    <div className="mb-4"><SidebarTrigger className="min-h-[44px]" /></div>
                  )}

                  {agentsList}

                  <VoiceErrorBoundary><VoiceInterfaceCard {...voiceInterfaceProps} /></VoiceErrorBoundary>

                  {transcripts && <div className="mt-6">{transcripts}</div>}
                  {receipt}

                  <div className="mt-6"><MessageHistory conversationId={va.conversationId} /></div>
                </div>
              </main>
            </SidebarInset>

            {/* Right Settings Panel */}
            <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${settingsOpen ? 'w-80' : 'w-0'}`}>
              <div className={`w-80 h-full border-l border-border bg-card transition-transform duration-300 ease-in-out ${settingsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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
                        voiceProvider={va.voiceProvider}
                        onVoiceProviderChange={va.setVoiceProvider}
                        openaiVoice={va.openaiVoice}
                        onOpenAIVoiceChange={va.setOpenAIVoice}
                        openaiSettings={va.openaiSettings}
                        onOpenAISettingsChange={va.setOpenAISettings}
                        elevenlabsSettings={va.elevenlabsSettings}
                        onElevenLabsSettingsChange={va.setElevenLabsSettings}
                        geminiLiveSettings={va.geminiLiveSettings}
                        onGeminiLiveSettingsChange={va.setGeminiLiveSettings}
                        systemPrompt={va.systemPrompt}
                        onSystemPromptChange={va.setSystemPrompt}
                        inputMode={va.inputMode}
                        onInputModeChange={va.setInputMode}
                        isConnected={va.isConnected}
                        providerLoading={va.providerLoading}
                        isAuthenticated={va.isAuthenticated}
                        onSaveAgent={agentManager.openSaveDialog}
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
