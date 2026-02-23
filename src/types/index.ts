export interface Document {
  id: string;
  filename: string;
  chunkCount: number;
  uploadTime: string;
}

export type KBScope = 'all' | 'selected';

export interface Source {
  text: string;
  score: number;
  source: string;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  usage?: Usage;
  createdAt: Date;
}

export interface ChatRequest {
  query: string;
  doc_ids: string[];
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export type SSEEvent =
  | { type: 'token'; content: string }
  | { type: 'sources'; sources: Source[] }
  | { type: 'done'; usage: Usage }
  | { type: 'error'; message: string };
