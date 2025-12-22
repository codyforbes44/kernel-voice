import { useState, useCallback, useRef } from 'react';
import { type LiveTranscript } from '@/components/voice/LiveTranscripts';

export interface UseTranscriptManagerReturn {
  liveTranscripts: LiveTranscript[];
  addTranscript: (role: 'user' | 'assistant', text: string, isPartial?: boolean) => void;
  clearTranscripts: () => void;
  updateLastAssistantTranscript: (text: string, isPartial?: boolean) => void;
}

export function useTranscriptManager(): UseTranscriptManagerReturn {
  const [liveTranscripts, setLiveTranscripts] = useState<LiveTranscript[]>([]);
  const [currentAssistantId, setCurrentAssistantId] = useState<string | null>(null);
  const currentAssistantIdRef = useRef(currentAssistantId);
  
  // Keep ref in sync
  currentAssistantIdRef.current = currentAssistantId;

  const addTranscript = useCallback((role: 'user' | 'assistant', text: string, isPartial = false) => {
    const id = `${role}-${Date.now()}`;
    
    if (role === 'assistant' && isPartial) {
      setLiveTranscripts(prev => {
        const lastTranscript = prev[prev.length - 1];
        if (lastTranscript?.role === 'assistant' && lastTranscript?.isPartial) {
          return prev.map((t, i) => 
            i === prev.length - 1 
              ? { ...t, text: t.text + text }
              : t
          );
        }
        setCurrentAssistantId(id);
        return [...prev, { id, role, text, timestamp: new Date(), isPartial: true }];
      });
    } else if (role === 'assistant' && !isPartial && currentAssistantIdRef.current) {
      setLiveTranscripts(prev => 
        prev.map(t => 
          t.id === currentAssistantIdRef.current 
            ? { ...t, isPartial: false }
            : t
        )
      );
      setCurrentAssistantId(null);
    } else {
      setLiveTranscripts(prev => [...prev, { id, role, text, timestamp: new Date(), isPartial }]);
    }
  }, []);

  const clearTranscripts = useCallback(() => {
    setLiveTranscripts([]);
    setCurrentAssistantId(null);
  }, []);

  const updateLastAssistantTranscript = useCallback((text: string, isPartial = false) => {
    setLiveTranscripts(prev => {
      const lastAssistantIdx = [...prev].reverse().findIndex(t => t.role === 'assistant');
      if (lastAssistantIdx === -1) return prev;
      const actualIdx = prev.length - 1 - lastAssistantIdx;
      return prev.map((t, i) => 
        i === actualIdx 
          ? { ...t, text, isPartial }
          : t
      );
    });
  }, []);

  return {
    liveTranscripts,
    addTranscript,
    clearTranscripts,
    updateLastAssistantTranscript,
  };
}
