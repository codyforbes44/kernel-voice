import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Upload } from 'lucide-react';
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
import MicrophonePermissionRequest from '@/components/voice/MicrophonePermissionRequest';
import { LiveTranscripts } from '@/components/voice/LiveTranscripts';
import { ConnectionStatusBadge } from '@/components/voice/ConnectionStatusBadge';
import { AudioLevelVisualizer } from '@/components/voice/AudioLevelMeter';
import { TextMessageInput } from '@/components/voice/TextMessageInput';
import { InputModeSelector } from '@/components/voice/InputModeSelector';
import { WakeWordIndicator } from '@/components/voice/WakeWordIndicator';
import { VoiceControlPanel } from '@/components/voice/VoiceControlPanel';
import { VoiceSettingsPanel } from '@/components/voice/VoiceSettingsPanel';
import { GuestModeBanner } from '@/components/voice/GuestModeBanner';
import { ConversationBanner } from '@/components/voice/ConversationBanner';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useWakeWordDetection } from '@/hooks/useWakeWordDetection';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCallback } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare as MessageIcon } from 'lucide-react';

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    isAuthenticated,
    conversationId,
    setConversationId,
    conversationTitle,
    setConversationTitle,
    voiceProvider,
    setVoiceProvider,
    grokVoice,
    setGrokVoice,
    systemPrompt,
    setSystemPrompt,
    providerLoading,
    isConnected,
    isConnecting,
    connectionError,
    connectionAuthMethod,
    connectionPhase,
    isFallbackMode,
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
  } = useVoiceAssistant();

  const showVoiceInterface = inputMode === 'voice' || inputMode === 'combined';
  const showTextInput = inputMode === 'text' || inputMode === 'combined';

  // Wake word detection - only active in text-only mode when not connected
  const handleWakeWordDetected = useCallback(async () => {
    setInputMode('voice');
    setTimeout(() => {
      if (isReady) {
        startConversation();
      }
    }, 100);
  }, [setInputMode, isReady, startConversation]);

  const wakeWordEnabled = inputMode === 'text' && !isConnected && isReady;
  
  const { 
    isListening: isWakeWordListening, 
    isSupported: isWakeWordSupported,
    lastHeard: wakeWordLastHeard,
  } = useWakeWordDetection({
    wakeWords: ['hey kernel', 'ok kernel', 'kernel'],
    onWakeWordDetected: handleWakeWordDetected,
    enabled: wakeWordEnabled,
  });

  const handleNewConversation = () => {
    setConversationId(null);
    setConversationTitle(null);
  };

  // Main Voice Interface Card
  const VoiceInterfaceCard = () => (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-8 shadow-xl dark:shadow-glow-subtle dark:border-primary/10 transition-shadow duration-300 hover:dark:shadow-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex-1 flex justify-start">
          {showVoiceInterface && (
            <ConnectionStatusBadge
              isConnected={isConnected}
              isConnecting={isConnecting}
              hasError={!!connectionError}
              errorMessage={connectionError || undefined}
              provider={voiceProvider}
              authMethod={connectionAuthMethod}
              connectionPhase={connectionPhase}
              isFallbackMode={isFallbackMode}
              onRetry={retryConnection}
            />
          )}
        </div>
        <h1 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Kernel
        </h1>
        <div className="flex-1 flex justify-end">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isConnected} className="h-11 w-11 min-h-[44px]">
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Voice Settings</SheetTitle>
                  <SheetDescription>Configure your voice assistant preferences</SheetDescription>
                </SheetHeader>
                <div className="pt-4 pb-8">
                  <VoiceSettingsPanel
                    voiceProvider={voiceProvider}
                    onVoiceProviderChange={setVoiceProvider}
                    grokVoice={grokVoice}
                    onGrokVoiceChange={setGrokVoice}
                    systemPrompt={systemPrompt}
                    onSystemPromptChange={setSystemPrompt}
                    inputMode={inputMode}
                    onInputModeChange={setInputMode}
                    isConnected={isConnected}
                    providerLoading={providerLoading}
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isConnected} className="min-h-[44px] min-w-[44px]">
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <VoiceSettingsPanel
                  voiceProvider={voiceProvider}
                  onVoiceProviderChange={setVoiceProvider}
                  grokVoice={grokVoice}
                  onGrokVoiceChange={setGrokVoice}
                  systemPrompt={systemPrompt}
                  onSystemPromptChange={setSystemPrompt}
                  inputMode={inputMode}
                  onInputModeChange={setInputMode}
                  isConnected={isConnected}
                  providerLoading={providerLoading}
                  isAuthenticated={isAuthenticated}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Input Mode Selector */}
      <div className="flex justify-center mb-4 md:mb-6">
        <InputModeSelector
          value={inputMode}
          onChange={setInputMode}
          disabled={isConnected}
        />
      </div>

      {/* Voice Interface */}
      {showVoiceInterface && (
        <>
          {!isReady && (
            <MicrophonePermissionRequest 
              permissionState={permissionState}
              onRequestPermission={requestPermission}
            />
          )}

          <VoiceControlPanel
            isConnected={isConnected}
            isConnecting={isConnecting}
            connectionError={connectionError}
            isSpeaking={isSpeaking}
            inputAudioLevel={inputAudioLevel}
            outputAudioLevel={outputAudioLevel}
            isMuted={isMuted}
            volume={volume}
            isReady={isReady}
            providerLoading={providerLoading}
            isMobile={isMobile}
            onStartConversation={startConversation}
            onEndConversation={endConversation}
            onRetryConnection={retryConnection}
            onClearError={clearConnectionError}
            onToggleMute={toggleMute}
            onVolumeChange={setVolume}
          />

          {/* Audio Level Meters - Desktop only */}
          {isConnected && !isMobile && (
            <div className="flex justify-center mt-4">
              <AudioLevelVisualizer
                inputLevel={inputAudioLevel}
                outputLevel={outputAudioLevel}
                isConnected={isConnected}
                isSpeaking={isSpeaking}
              />
            </div>
          )}

          {/* Status Text */}
          <div className="text-center mt-4">
            <p className="text-base md:text-lg font-medium">
              {connectionError 
                ? 'Connection failed'
                : isConnecting
                  ? 'Connecting...'
                  : isConnected 
                    ? isSpeaking 
                      ? '🗣️ Speaking...' 
                      : '👂 Listening...'
                    : 'Ready to connect'
              }
            </p>
            {connectionError ? (
              <p className="text-xs md:text-sm text-destructive mt-1 max-w-xs mx-auto">
                {connectionError}
              </p>
            ) : (
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Using {voiceProvider === 'elevenlabs' ? 'ElevenLabs' : 'Grok'}
              </p>
            )}
          </div>
        </>
      )}

      {/* Text Mode Content */}
      {inputMode === 'text' && (
        <div className="text-center mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <MessageIcon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </div>
          <p className="text-base md:text-lg font-medium">Text Mode</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Type your messages below
          </p>
          <div className="mt-3 flex justify-center">
            <WakeWordIndicator
              isListening={isWakeWordListening}
              isSupported={isWakeWordSupported}
              lastHeard={wakeWordLastHeard}
            />
          </div>
        </div>
      )}

      {/* Text Input */}
      {showTextInput && (
        <div className="mt-4">
          <TextMessageInput
            onSend={sendTextMessage}
            isLoading={isProcessingText}
            placeholder={inputMode === 'combined' ? "Type or speak..." : "Type a message..."}
          />
        </div>
      )}
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <SEO 
          title="Kernel - Voice Assistant"
          description="Experience the future of AI interaction with real-time voice conversations, intelligent web search, and advanced document analysis."
          image="/og-home.png"
          keywords={["AI voice assistant", "voice AI", "real-time conversation", "document analysis", "web search AI"]}
        />
        <div className="flex flex-col min-h-screen bg-background safe-area-inset">
          <Header />
          <div className="flex-1 flex flex-col px-3 pt-2 pb-4">
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

            {/* Main Voice Interface */}
            <VoiceInterfaceCard />

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

                {/* Main Voice Interface */}
                <VoiceInterfaceCard />

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
    </>
  );
};

export default VoiceAssistant;
