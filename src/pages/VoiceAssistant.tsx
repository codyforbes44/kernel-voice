import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, LogIn, Settings, MessageSquare, Upload, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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
import { VoiceProviderSelector } from '@/components/voice/VoiceProviderSelector';
import { LiveTranscripts } from '@/components/voice/LiveTranscripts';
import { ConnectionStatusBadge } from '@/components/voice/ConnectionStatusBadge';
import { AudioLevelVisualizer, WaveformOrb } from '@/components/voice/AudioLevelMeter';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  } = useVoiceAssistant();

  // Shared voice settings component
  const VoiceSettings = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-lg">Voice Settings</h4>
      <VoiceProviderSelector
        value={voiceProvider}
        onChange={setVoiceProvider}
        grokVoice={grokVoice}
        onGrokVoiceChange={setGrokVoice}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        disabled={isConnected || providerLoading}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );

  // Shared main voice interface
  const VoiceInterface = () => (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-8 shadow-xl">
      {/* Header with Settings */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex-1 flex justify-start">
          <ConnectionStatusBadge
            isConnected={isConnected}
            isConnecting={isConnecting}
            hasError={!!connectionError}
            provider={voiceProvider}
          />
        </div>
        <h1 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AI Intelligence
        </h1>
        <div className="flex-1 flex justify-end">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isConnected} className="h-10 w-10">
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Voice Settings</SheetTitle>
                  <SheetDescription>Configure your voice assistant preferences</SheetDescription>
                </SheetHeader>
                <div className="pt-4 pb-8">
                  <VoiceSettings />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isConnected}>
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <VoiceSettings />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Microphone Permission Request */}
      {!isReady && (
        <MicrophonePermissionRequest 
          permissionState={permissionState}
          onRequestPermission={requestPermission}
        />
      )}

      {/* Microphone Orb */}
      <div className="flex items-center justify-center mb-6 md:mb-8">
        <div className={`
          relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center
          ${isConnected 
            ? 'bg-gradient-to-br from-primary to-primary/50' 
            : isConnecting
              ? 'bg-gradient-to-br from-primary/30 to-primary/10'
              : connectionError
                ? 'bg-gradient-to-br from-destructive/30 to-destructive/10'
                : 'bg-gradient-to-br from-muted to-muted-foreground/20'
          }
          transition-all duration-300 shadow-lg
        `}>
          {/* Waveform visualization */}
          {isConnected && (
            <WaveformOrb 
              level={isSpeaking ? outputAudioLevel : inputAudioLevel} 
              isActive={isConnected}
            />
          )}
          
          {isConnecting ? (
            <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-primary animate-spin" />
          ) : connectionError ? (
            <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-destructive" />
          ) : (
            <Mic className={`w-10 h-10 md:w-12 md:h-12 ${isConnected ? 'text-primary-foreground' : 'text-primary-foreground/70'}`} />
          )}
          {isConnected && !isSpeaking && inputAudioLevel > 0.1 && (
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
          )}
        </div>
      </div>

      {/* Audio Level Meters - Show when connected */}
      {isConnected && !isMobile && (
        <div className="flex justify-center mb-4">
          <AudioLevelVisualizer
            inputLevel={inputAudioLevel}
            outputLevel={outputAudioLevel}
            isConnected={isConnected}
            isSpeaking={isSpeaking}
          />
        </div>
      )}

      {/* Status Text */}
      <div className="text-center mb-6 md:mb-8">
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

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-3 md:gap-4">
          {connectionError ? (
            <>
              <Button
                onClick={retryConnection}
                size="lg"
                className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg min-h-[48px]"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Try Again
              </Button>
              <Button
                onClick={clearConnectionError}
                variant="outline"
                size="lg"
                className="min-h-[48px]"
              >
                Cancel
              </Button>
            </>
          ) : isConnecting ? (
            <Button
              disabled
              size="lg"
              className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg min-h-[48px]"
            >
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </Button>
          ) : !isConnected ? (
            <Button
              onClick={startConversation}
              size="lg"
              className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg min-h-[48px]"
              disabled={!isReady || providerLoading}
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Conversation
            </Button>
          ) : (
            <>
              <Button
                onClick={endConversation}
                variant="destructive"
                size="lg"
                className="min-h-[48px]"
              >
                {isMobile ? 'End' : 'Continue Later'}
              </Button>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    size="lg"
                    className="min-h-[48px] min-w-[48px]"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMuted ? 'Unmute microphone' : 'Mute microphone'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setVolume(volume > 0 ? 0 : 1)}
                    variant="outline"
                    size="lg"
                    className="min-h-[48px] min-w-[48px]"
                    aria-label={volume > 0 ? 'Mute audio' : 'Unmute audio'}
                  >
                    {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {volume > 0 ? 'Mute audio' : 'Unmute audio'}
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Volume Slider - Show when connected */}
        {isConnected && !isMobile && (
          <div className="flex items-center gap-3 w-48">
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              onValueChange={([v]) => setVolume(v / 100)}
              max={100}
              step={1}
              className="flex-1"
              aria-label="Volume"
            />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <SEO 
          title="AI Intelligence - Voice Assistant"
          description="Experience the future of AI interaction with real-time voice conversations, intelligent web search, and advanced document analysis."
          image="/og-home.png"
          keywords={["AI voice assistant", "voice AI", "real-time conversation", "document analysis", "web search AI"]}
        />
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <div className="flex-1 flex flex-col px-3 pt-2 pb-4">
            {/* Guest Banner */}
            {!isAuthenticated && (
              <div className="mb-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Guest Mode</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-9 min-h-[44px]"
                    onClick={() => navigate('/auth')}
                  >
                    <LogIn className="h-3 w-3 mr-1" />
                    Sign In
                  </Button>
                </div>
              </div>
            )}

            {/* Current Conversation Banner */}
            {isAuthenticated && conversationTitle && (
              <div className="mb-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Continuing:</p>
                    <p className="text-sm font-medium truncate">{conversationTitle}</p>
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="h-9 min-h-[44px] shrink-0"
                    onClick={() => {
                      setConversationId(null);
                      setConversationTitle(null);
                    }}
                  >
                    New
                  </Button>
                </div>
              </div>
            )}
            
            {/* Top Action Buttons */}
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
            <VoiceInterface />

            {/* Live Transcripts */}
            {(isConnected || liveTranscripts.length > 0) && (
              <div className="mt-4">
                <LiveTranscripts 
                  transcripts={liveTranscripts}
                  isConnected={isConnected}
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
                {!isAuthenticated && (
                  <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium">Guest Mode - Conversations won't be saved</p>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/auth')}
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In to Save
                      </Button>
                    </div>
                  </div>
                )}

                {/* Current Conversation Banner */}
                {isAuthenticated && conversationTitle && (
                  <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Continuing conversation:</p>
                        <p className="font-medium">{conversationTitle}</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setConversationId(null);
                          setConversationTitle(null);
                        }}
                      >
                        New Conversation
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Sidebar Trigger */}
                {isAuthenticated && (
                  <div className="mb-4">
                    <SidebarTrigger />
                  </div>
                )}

                {/* Main Voice Interface */}
                <VoiceInterface />

                {/* Live Transcripts */}
                {(isConnected || liveTranscripts.length > 0) && (
                  <div className="mt-6">
                    <LiveTranscripts 
                      transcripts={liveTranscripts}
                      isConnected={isConnected}
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
