import React, { useState, useCallback, useEffect } from 'react';
import { WidgetThemeProvider, useWidgetTheme } from './WidgetTheme';
import { WidgetHeader } from './WidgetHeader';
import { WidgetChat } from './WidgetChat';
import { WidgetInput } from './WidgetInput';
import { WidgetButton } from './WidgetButton';
import { sendWidgetMessage, trackWidgetEvent } from './api';
import { KernelWidgetConfig, WidgetMessage, generateSessionId } from './types';

interface KernelWidgetProps {
  config: KernelWidgetConfig;
}

export function KernelWidget({ config }: KernelWidgetProps) {
  return (
    <WidgetThemeProvider config={config}>
      <WidgetContent />
    </WidgetThemeProvider>
  );
}

function WidgetContent() {
  const { config } = useWidgetTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [sessionId] = useState(() => generateSessionId());
  const [hasStarted, setHasStarted] = useState(false);

  // Add greeting message on first open
  useEffect(() => {
    if (isOpen && !hasStarted && config.greeting) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: config.greeting,
        timestamp: new Date(),
      }]);
      setHasStarted(true);
      
      // Track conversation start
      trackWidgetEvent(config.apiKey, 'open', {}, sessionId);
      config.onConversationStart?.();
    }
  }, [isOpen, hasStarted, config, sessionId]);

  const handleSend = useCallback(async (messageContent: string) => {
    const userMessage: WidgetMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Track message sent
    trackWidgetEvent(config.apiKey, 'message', { role: 'user' }, sessionId);
    config.onMessageSent?.(messageContent);

    try {
      const result = await sendWidgetMessage({
        message: messageContent,
        apiKey: config.apiKey,
        sessionId,
        systemPrompt: config.systemPrompt,
        enableKB: config.enableKB,
        kbDocumentIds: config.kbDocumentIds,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const assistantMessage: WidgetMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      }]);

      trackWidgetEvent(config.apiKey, 'error', { error: errorMessage }, sessionId);
      config.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [config, sessionId]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    trackWidgetEvent(config.apiKey, 'close', {}, sessionId);
  }, [config.apiKey, sessionId]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  return (
    <>
      {/* Widget Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            [config.position === 'bottom-left' ? 'left' : 'right']: '20px',
            width: '380px',
            maxWidth: 'calc(100vw - 40px)',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--kernel-bg)',
            borderRadius: 'var(--kernel-radius)',
            boxShadow: 'var(--kernel-shadow)',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <WidgetHeader onClose={handleClose} onMinimize={handleMinimize} />
          <WidgetChat messages={messages} isLoading={isLoading} />
          <WidgetInput 
            onSend={handleSend} 
            isLoading={isLoading} 
            enableVoice={config.enableVoice}
            voiceProvider={config.voiceProvider}
            supabaseUrl={config.supabaseUrl}
            supabaseKey={config.supabaseKey}
          />
        </div>
      )}

      {/* Floating Button */}
      <WidgetButton isOpen={isOpen} onClick={isOpen ? handleClose : handleOpen} />

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
}

export default KernelWidget;
