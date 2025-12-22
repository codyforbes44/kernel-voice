// Centralized voice tool definitions for Grok and OpenAI conversations

export interface VoiceToolDefinition {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

/**
 * Create voice tool definitions for the session.
 * Used by both Grok and OpenAI conversation hooks.
 * 
 * @param includeDetailedDescriptions - Whether to include more detailed descriptions (for Grok)
 * @returns Array of tool definitions or undefined if no clientTools are provided
 */
export function createVoiceToolDefinitions(includeDetailedDescriptions = true): VoiceToolDefinition[] {
  return [
    {
      type: 'function',
      name: 'chat',
      description: includeDetailedDescriptions
        ? 'Have a conversation with the AI. Use this when the user wants to chat, ask questions, or discuss any topic. Always tell the user you are processing their request.'
        : 'Have a conversation with the AI. Use this when the user wants to chat, ask questions, or discuss any topic.',
      parameters: {
        type: 'object',
        properties: {
          message: { 
            type: 'string',
            description: 'The message or question to send to the AI'
          }
        },
        required: ['message']
      }
    },
    {
      type: 'function',
      name: 'search',
      description: includeDetailedDescriptions
        ? 'Search the web for information. Use this when the user asks about current events, needs to look something up, or wants real-time information. Tell the user you are searching.'
        : 'Search the web for information. Use this when the user asks about current events or needs to look something up.',
      parameters: {
        type: 'object',
        properties: {
          query: { 
            type: 'string',
            description: includeDetailedDescriptions 
              ? 'The search query to look up on the web'
              : 'The search query'
          }
        },
        required: ['query']
      }
    },
    {
      type: 'function',
      name: 'query_document',
      description: includeDetailedDescriptions
        ? 'Query an uploaded document for specific information. Use this when the user asks about content in a document they have uploaded.'
        : 'Query an uploaded document for specific information.',
      parameters: {
        type: 'object',
        properties: {
          documentId: { 
            type: 'string',
            description: includeDetailedDescriptions 
              ? 'The ID of the document to query'
              : 'The ID of the document'
          },
          query: { 
            type: 'string',
            description: includeDetailedDescriptions 
              ? 'The question to ask about the document'
              : 'The question about the document'
          }
        },
        required: ['documentId', 'query']
      }
    },
    {
      type: 'function',
      name: 'kb_search',
      description: includeDetailedDescriptions
        ? 'Search the knowledge base for information from uploaded documents. Use this when the user asks questions that might be answered by documents in the knowledge base, such as company policies, procedures, FAQs, or any other stored knowledge.'
        : 'Search the knowledge base for information from uploaded documents.',
      parameters: {
        type: 'object',
        properties: {
          query: { 
            type: 'string',
            description: includeDetailedDescriptions 
              ? 'The search query to find relevant information in the knowledge base'
              : 'The search query for the knowledge base'
          }
        },
        required: ['query']
      }
    }
  ];
}

/**
 * Get tool definitions if clientTools are provided.
 * Returns undefined if no tools are available.
 */
export function getVoiceToolsConfig(
  clientTools: Record<string, (params: unknown) => Promise<string>> | undefined,
  useDetailedDescriptions = true
): VoiceToolDefinition[] | undefined {
  if (!clientTools) return undefined;
  return createVoiceToolDefinitions(useDetailedDescriptions);
}

// Tool names for validation
export const VOICE_TOOL_NAMES = ['chat', 'search', 'query_document', 'kb_search'] as const;
export type VoiceToolName = typeof VOICE_TOOL_NAMES[number];
