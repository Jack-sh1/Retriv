export interface Document {
  id: string;
  filename: string;
  chunkCount: number;
  uploadTime: number;
}

export interface Source {
  id: string;
  text: string;
  similarity: number;
  documentId: string;
  documentName: string;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  sources?: Source[];
}

export type KBScope = 'all' | 'selected';
