import { useState, useRef, useCallback } from 'react';
import { Source, Usage, Message } from '../types/index';

interface UseChatOptions {
  onToken: (token: string) => void;
  onSources: (sources: Source[]) => void;
  onDone: (usage: Usage) => void;
  onError: (msg: string) => void;
}

export function useSSEChat(options: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const send = useCallback(async (query: string, docIds: string[], history: Message[]) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          doc_ids: docIds,
          history: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      if (!response.body) {
         throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
            break;
        }
        
        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Split buffer by newlines to process complete lines
        const lines = buffer.split('\n');
        
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const dataStr = trimmedLine.slice(6);
          try {
            const data = JSON.parse(dataStr);

            if (data.type === 'token') {
              options.onToken(data.content);
            } else if (data.type === 'sources') {
              options.onSources(data.sources);
            } else if (data.type === 'done') {
              options.onDone(data.usage || { input_tokens: 0, output_tokens: 0 });
            } else if (data.type === 'error') {
               throw new Error(data.message);
            }
          } catch (e) {
             console.error('Failed to parse SSE message:', e);
             // Continue processing other lines
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        options.onError(error.message || 'Unknown error occurred');
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [options]);

  return {
    send,
    abort,
    isStreaming,
  };
}
