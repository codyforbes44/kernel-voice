import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { MessageSquare as MessageIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConnectionStatusBadge } from '@/components/voice/ConnectionStatusBadge';
import { VoiceControlPanel } from '@/components/voice/VoiceControlPanel';
import { VoiceSettingsPanel } from '@/components/voice/VoiceSettingsPanel';
import { AudioLevelVisualizer } from '@/components/voice/AudioLevelMeter';
import { TextMessageInput } from '@/components/voice/TextMessageInput';
import { InputModeSelector } from '@/components/voice/InputModeSelector';
import { WakeWordIndicator } from '@/components/voice/WakeWordIndicator';
import { ToolExecutionIndicator } from '@/components/voice/ToolExecutionIndicator';
import MicrophonePermissionRequest from '@/components/voice/MicrophonePermissionRequest';
import { type VoiceInterfaceCardProps } from '@/components/voice/voiceInterfaceTypes';

export type { VoiceInterfaceCardProps } from '@/components/voice/voiceInterfaceTypes';

export const VoiceInterfaceCard = React.memo(function VoiceInterfaceCard({
  voiceProvider, setVoiceProvider,
  openaiVoice, setOpenAIVoice,
  openaiSettings, setOpenAISettings,
  elevenlabsSettings, setElevenLabsSettings,
  geminiLiveSettings, setGeminiLiveSettings,
  systemPrompt, setSystemPrompt,
  providerLoading,
  isConnected, isConnecting, connectionError, connectionAuthMethod, connectionPhase,
  isSpeaking, inputAudioLevel, outputAudioLevel,
  isMuted, toggleMute, volume, setVolume,
  inputMode, setInputMode,
  startConversation, endConversation, retryConnection, clearConnectionError,
  sendTextMessage, isProcessingText, activeToolCall,
  permissionState, requestPermission,
  isReady, isAuthenticated, isMobile,
  isWakeWordListening, isWakeWordSupported, wakeWordLastHeard,
  onSaveAgent, isPaused, onResume,
}: VoiceInterfaceCardProps) {
  const showVoiceInterface = inputMode === 'voice' || inputMode === 'combined';
  const showTextInput = inputMode === 'text' || inputMode === 'combined';

  return (
    <div className="rounded-2xl bg-card border border-border p-3 md:p-8 shadow-xl card-elevated dark:shadow-glow-subtle dark:border-primary/10 transition-shadow duration-300 glow-hover">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-6">
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
              onRetry={retryConnection}
            />
          )}
        </div>
        {/* Title - hidden on mobile (redundant with Header) */}
        {!isMobile && (
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            ƷBI Voice
          </h1>
        )}
        <div className="flex-1 flex justify-end">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isConnected} className="h-11 min-h-[44px] gap-2 px-3">
                  <Settings className="h-5 w-5" />
                  <span className="text-xs">Settings</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Voice Settings</SheetTitle>
                  <SheetDescription>Configure your voice assistant preferences</SheetDescription>
                </SheetHeader>
                <div className="pt-4 pb-8">
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
                    onSaveAgent={onSaveAgent}
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
                  onSaveAgent={onSaveAgent}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Input Mode Selector */}
      <div className="flex justify-center mb-3 md:mb-6">
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
            isPaused={isPaused}
            onResume={onResume}
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

          {/* Tool Execution Indicator */}
          {activeToolCall && (
            <ToolExecutionIndicator toolExecution={activeToolCall} className="mt-4" />
          )}

          {/* Status Text */}
          <div className="text-center mt-4" role="status" aria-live="polite">
            <p className="text-base md:text-lg font-medium">
              {connectionError 
                ? 'Connection failed'
                : isConnecting
                  ? 'Connecting...'
                  : isConnected 
                    ? isPaused
                      ? '⏸️ Paused'
                      : activeToolCall
                        ? '🔧 Using tool...'
                        : isSpeaking 
                          ? '🗣️ Speaking...' 
                          : '👂 Listening...'
                    : 'Ready to connect'
              }
            </p>
            {connectionError ? (
              <p className="text-xs md:text-sm text-destructive mt-1 max-w-xs mx-auto">
                {connectionError}
              </p>
            ) : isPaused ? (
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Say &quot;continue the conversation&quot; to resume
              </p>
            ) : (
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Using {voiceProvider === 'elevenlabs' ? 'ElevenLabs' : voiceProvider === 'vapi' ? 'VAPI' : '3ʙɪ'}
              </p>
            )}
            
            {!isConnected && !isConnecting && (
              <div className="mt-3 flex justify-center">
                <WakeWordIndicator
                  isListening={isWakeWordListening}
                  isSupported={isWakeWordSupported}
                  lastHeard={wakeWordLastHeard}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Text Mode Content */}
      {inputMode === 'text' && (
        <div className="text-center mb-4 md:mb-8">
          <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <MessageIcon className="w-7 h-7 md:w-10 md:h-10 text-primary" />
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
});
