import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Message, Source, Usage } from '../types/index';

// Type definitions
interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  selectedDocIds: string[];
  
  // Actions
  sendMessage: (query: string) => Promise<void>;
  appendToken: (token: string) => void;
  setMessageSources: (sources: Source[]) => void;
  setDone: (usage: Usage) => void;
  setStreaming: (v: boolean) => void;
  clearMessages: () => void;
  setSelectedDocIds: (ids: string[]) => void;
  
  // Internal helper for SSE hook
  getMessages: () => Message[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  selectedDocIds: [],

  sendMessage: async (query: string) => {
    // 1. Create User Message
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: query,
      createdAt: new Date(),
    };

    // 2. Create Placeholder Assistant Message
    const assistantMsg: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    };

    // 3. Update State Optimistically
    console.log('[Store] sendMessage: Adding user and assistant placeholder messages');
    set((state) => ({
      messages: [...state.messages, userMsg, assistantMsg],
      isStreaming: true,
    }));
  },

  appendToken: (token: string) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length === 0) return state;

      const lastIndex = messages.length - 1;
      const lastMsg = messages[lastIndex];

      if (lastMsg.role !== 'assistant') {
        console.warn('[Store] appendToken: Last message is not assistant');
        return state;
      }

      // Immutably update the last message
      messages[lastIndex] = {
        ...lastMsg,
        content: lastMsg.content + token,
      };

      return { messages };
    });
  },

  setMessageSources: (sources: Source[]) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length === 0) return state;

      const lastIndex = messages.length - 1;
      messages[lastIndex] = {
        ...messages[lastIndex],
        sources,
      };

      return { messages };
    });
  },

  setDone: (usage: Usage) => {
    console.log('[Store] setDone: Usage', usage);
    set((state) => {
      const messages = [...state.messages];
      if (messages.length === 0) return { isStreaming: false };

      const lastIndex = messages.length - 1;
      messages[lastIndex] = {
        ...messages[lastIndex],
        usage,
      };

      return { messages, isStreaming: false };
    });
  },

  setStreaming: (v: boolean) => set({ isStreaming: v }),

  clearMessages: () => set({ messages: [] }),

  setSelectedDocIds: (ids: string[]) => set({ selectedDocIds: ids }),
  
  getMessages: () => get().messages,
}));

// Subscribe to store changes for debugging
useChatStore.subscribe((state) => {
  console.log('[Store] state changed, messages count:', state.messages.length);
  if (state.messages.length > 0) {
    const lastMsg = state.messages[state.messages.length - 1];
    // Print last 50 chars of content to verify updates
    console.log('[Store] Last message content (tail):', lastMsg.content.slice(-50));
  }
});
