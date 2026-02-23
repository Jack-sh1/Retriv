import { useState, useRef, useCallback, useEffect } from 'react';
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
  
  // Use a ref to keep track of the latest options to avoid stale closures
  const optionsRef = useRef(options);
  
  // Update options ref whenever options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

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
      console.log('[SSE] Starting request...');
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

      console.log('[SSE] Response status:', response.status);
      console.log('[SSE] Response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      if (!response.body) {
         throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      console.log('[SSE] Reader created:', reader);
      
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        console.log('[SSE] Chunk received. Done:', done, 'Value length:', value?.length);
        
        if (done) {
            break;
        }
        
        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });
        console.log('[SSE] Buffer content:', buffer);
        
        // Split buffer by newlines to process complete lines
        const lines = buffer.split('\n');
        
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          console.log('[SSE] Processing line:', trimmedLine);
          
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const dataStr = trimmedLine.slice(6);
          try {
            const data = JSON.parse(dataStr);
            console.log('[SSE] Parsed data:', data);

            if (data.type === 'token') {
              optionsRef.current.onToken(data.content);
            } else if (data.type === 'sources') {
              optionsRef.current.onSources(data.sources);
            } else if (data.type === 'done') {
              optionsRef.current.onDone(data.usage || { input_tokens: 0, output_tokens: 0 });
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
        console.error('SSE Error:', error);
        optionsRef.current.onError(error.message);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  return { send, abort, isStreaming };
}
