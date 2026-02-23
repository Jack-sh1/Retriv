import { useRef, useCallback, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';

export function useSSEChat() {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Access store actions directly
  const { 
    appendToken, 
    setMessageSources, 
    setDone, 
    setStreaming, 
    getMessages,
    selectedDocIds 
  } = useChatStore();

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('[SSE] Aborting request...');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
  }, [setStreaming]);

  const send = useCallback(async (query: string) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Get current history from store (excluding the last placeholder if needed, 
      // but backend usually handles it. Here we send all previous messages minus the current query/placeholder pair
      // actually, let's just send what we have. Ideally backend filters.
      // For simplicity, let's filter out the last two messages we just added (User + Placeholder)
      // to avoid duplication if backend appends user query again.
      // BUT: The standard pattern is: Frontend adds to UI -> Frontend sends Query + History -> Backend returns Answer.
      // So history should be messages.slice(0, -2).
      const allMessages = getMessages();
      const history = allMessages.slice(0, -2).map(({ role, content }) => ({ role, content }));
      
      console.log('[SSE] Sending request. Query:', query);
      console.log('[SSE] History length:', history.length);

      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          doc_ids: selectedDocIds,
          history,
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
            console.log('[SSE] Stream complete');
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
              // console.log('[SSE] Token:', data.content); // Too noisy
              appendToken(data.content);
            } else if (data.type === 'sources') {
              console.log('[SSE] Sources:', data.sources);
              setMessageSources(data.sources);
            } else if (data.type === 'done') {
              console.log('[SSE] Done. Usage:', data.usage);
              setDone(data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
            } else if (data.type === 'error') {
               console.error('[SSE] Server Error:', data.message);
               appendToken(`\n\n**Error:** ${data.message}`);
               setStreaming(false);
            }
          } catch (e) {
             console.error('[SSE] Failed to parse message:', e, 'Line:', line);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[SSE] Request aborted by user');
      } else {
        console.error('[SSE] Network/Logic Error:', error);
        appendToken(`\n\n**Connection Error:** ${error.message}`);
      }
      setStreaming(false);
    } finally {
      abortControllerRef.current = null;
    }
  }, [appendToken, setMessageSources, setDone, setStreaming, getMessages, selectedDocIds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { send, abort };
}
