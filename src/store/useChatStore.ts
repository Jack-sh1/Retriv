import { create } from 'zustand';
import { Document, Message, KBScope } from '../types';

interface ChatStore {
  messages: Message[];
  documents: Document[];
  selectedDocIds: string[];
  isStreaming: boolean;
  kbScope: KBScope;
  
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string, sources?: Message['sources']) => void;
  setStreaming: (isStreaming: boolean) => void;
  
  addDocument: (doc: Document) => void;
  removeDocument: (id: string) => void;
  toggleDocumentSelection: (id: string) => void;
  
  setKBScope: (scope: KBScope) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  documents: [],
  selectedDocIds: [],
  isStreaming: false,
  kbScope: 'all',
  
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  updateLastMessage: (content, sources) => set((state) => {
    const newMessages = [...state.messages];
    if (newMessages.length > 0) {
      const lastIdx = newMessages.length - 1;
      newMessages[lastIdx] = {
        ...newMessages[lastIdx],
        content: newMessages[lastIdx].content + content,
        sources: sources || newMessages[lastIdx].sources,
      };
    }
    return { messages: newMessages };
  }),
  
  setStreaming: (isStreaming) => set({ isStreaming }),
  
  addDocument: (doc) => set((state) => ({ 
    documents: [...state.documents, doc],
    selectedDocIds: [...state.selectedDocIds, doc.id]
  })),
  
  removeDocument: (id) => set((state) => ({
    documents: state.documents.filter(d => d.id !== id),
    selectedDocIds: state.selectedDocIds.filter(docId => docId !== id)
  })),
  
  toggleDocumentSelection: (id) => set((state) => ({
    selectedDocIds: state.selectedDocIds.includes(id)
      ? state.selectedDocIds.filter(docId => docId !== id)
      : [...state.selectedDocIds, id]
  })),
  
  setKBScope: (kbScope) => set({ kbScope }),
}));
