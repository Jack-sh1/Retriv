import { create } from 'zustand';
import { Message, Source, Usage, Document, KBScope } from '../types';

interface ChatState {
  // Chat State
  messages: Message[];
  isStreaming: boolean;
  selectedDocIds: string[];
  
  // Knowledge Base State
  documents: Document[];
  kbScope: KBScope;
  
  // Chat Actions
  addMessage: (message: Message) => void;
  updateLastMessage: (updater: (msg: Message) => Message) => void;
  appendTokenToLastMessage: (token: string) => void;
  setLastMessageSources: (sources: Source[]) => void;
  setLastMessageUsage: (usage: Usage) => void;
  setStreaming: (isStreaming: boolean) => void;
  setSelectedDocIds: (ids: string[]) => void;
  clearMessages: () => void;

  // Knowledge Base Actions
  setKBScope: (scope: KBScope) => void;
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  removeDocument: (id: string) => void;
  toggleDocumentSelection: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial State
  messages: [],
  isStreaming: false,
  selectedDocIds: [],
  documents: [],
  kbScope: 'all',

  // Chat Actions Implementation
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastMessage: (updater) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length === 0) return state;
      
      const lastIndex = messages.length - 1;
      messages[lastIndex] = updater(messages[lastIndex]);
      return { messages };
    }),

  appendTokenToLastMessage: (token) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length === 0) return state;

      const lastIndex = messages.length - 1;
      const lastMsg = messages[lastIndex];
      
      messages[lastIndex] = {
        ...lastMsg,
        content: lastMsg.content + token,
      };
      return { messages };
    }),

  setLastMessageSources: (sources) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length === 0) return state;

      const lastIndex = messages.length - 1;
      messages[lastIndex] = { ...messages[lastIndex], sources };
      return { messages };
    }),

  setLastMessageUsage: (usage) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length === 0) return state;

      const lastIndex = messages.length - 1;
      messages[lastIndex] = { ...messages[lastIndex], usage };
      return { messages };
    }),

  setStreaming: (isStreaming) => set({ isStreaming }),
  
  setSelectedDocIds: (ids) => set({ selectedDocIds: ids }),
  
  clearMessages: () => set({ messages: [] }),

  // Knowledge Base Actions Implementation
  setKBScope: (scope) => set({ kbScope: scope }),
  
  setDocuments: (docs) => set({ documents: docs }),

  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
  
  removeDocument: (id) => set((state) => ({ 
    documents: state.documents.filter(d => d.id !== id),
    selectedDocIds: state.selectedDocIds.filter(sid => sid !== id)
  })),
  
  toggleDocumentSelection: (id) => set((state) => {
    const isSelected = state.selectedDocIds.includes(id);
    return {
      selectedDocIds: isSelected 
        ? state.selectedDocIds.filter(sid => sid !== id)
        : [...state.selectedDocIds, id]
    };
  })
}));
