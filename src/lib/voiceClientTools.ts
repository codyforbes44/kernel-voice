import { supabase } from '@/integrations/supabase/client';

// Type compatible with voice provider hooks
export type VoiceClientTools = Record<string, (parameters: any) => Promise<string>>;

export interface CreateClientToolsOptions {
  onGuestMessage: (message: { role: string; content: string }) => void;
  getGuestMessages: () => Array<{ role: string; content: string }>;
  getConversationId: () => string | null;
  setConversationId: (id: string | null) => void;
  onRateLimitError: () => void;
  onCreditsError: () => void;
}

export function createVoiceClientTools(options: CreateClientToolsOptions): VoiceClientTools {
  const {
    onGuestMessage,
    getGuestMessages,
    getConversationId,
    setConversationId,
    onRateLimitError,
    onCreditsError,
  } = options;

  return {
    chat: async (parameters: { message: string }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          onGuestMessage({ role: 'user', content: parameters.message });
          
          const { data, error } = await supabase.functions.invoke('chat', {
            body: {
              messages: [...getGuestMessages(), { role: 'user', content: parameters.message }],
            },
          });

          if (error) {
            if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
              onRateLimitError();
              return JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' });
            }
            if (error.message?.includes('402') || error.message?.includes('Payment')) {
              onCreditsError();
              return JSON.stringify({ error: 'AI credits exhausted.' });
            }
            throw error;
          }
          
          onGuestMessage({ role: 'assistant', content: data.message });
          return JSON.stringify({ response: data.message });
        }

        let currentConvId = getConversationId();
        if (!currentConvId) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({ user_id: user.id })
            .select()
            .single();
          
          if (newConv) {
            currentConvId = newConv.id;
            setConversationId(currentConvId);
          }
        }

        const { data, error } = await supabase.functions.invoke('chat', {
          body: {
            messages: [{ role: 'user', content: parameters.message }],
            conversationId: currentConvId,
            userId: user.id,
          },
        });

        if (error) {
          if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
            onRateLimitError();
            return JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' });
          }
          if (error.message?.includes('402') || error.message?.includes('Payment')) {
            onCreditsError();
            return JSON.stringify({ error: 'AI credits exhausted.' });
          }
          throw error;
        }

        return JSON.stringify({ response: data.message });
      } catch (error) {
        console.error('Error in conversation:', error);
        return JSON.stringify({ error: 'Failed to get response' });
      }
    },

    search: async (parameters: { query: string }) => {
      try {
        const { data, error } = await supabase.functions.invoke('search', {
          body: { query: parameters.query },
        });

        if (error) throw error;

        return JSON.stringify(data);
      } catch (error) {
        console.error('Error in search:', error);
        return JSON.stringify({ error: 'Search failed' });
      }
    },

    query_document: async (parameters: { documentId: string; query: string }) => {
      try {
        const { data } = await supabase
          .from('document_chunks')
          .select('content')
          .eq('document_id', parameters.documentId)
          .order('chunk_index');

        if (!data || data.length === 0) {
          return JSON.stringify({ error: 'Document not found' });
        }

        const fullContent = data.map(chunk => chunk.content).join('\n');
        
        const { data: response, error } = await supabase.functions.invoke('chat', {
          body: {
            messages: [
              { 
                role: 'system', 
                content: `You are analyzing a document. Here is the content:\n\n${fullContent}` 
              },
              { role: 'user', content: parameters.query }
            ],
          },
        });

        if (error) throw error;

        return JSON.stringify({ answer: response.message });
      } catch (error) {
        console.error('Error querying document:', error);
        return JSON.stringify({ error: 'Failed to query document' });
      }
    },

    kb_search: async (parameters: { query: string }) => {
      try {
        const { data, error } = await supabase.functions.invoke('kb-search', {
          body: { query: parameters.query, limit: 5 },
        });

        if (error) throw error;

        return JSON.stringify({
          summary: data.summary,
          resultCount: data.resultCount,
          results: data.results?.map((r: any) => ({
            documentName: r.documentName,
            snippet: r.content?.substring(0, 200) + '...',
          })),
        });
      } catch (error) {
        console.error('Error in kb_search:', error);
        return JSON.stringify({ 
          error: 'Failed to search knowledge base',
          summary: 'I was unable to search the knowledge base. Please try again.'
        });
      }
    },
  };
}
