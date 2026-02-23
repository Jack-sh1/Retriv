import { useRef, useCallback } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Source } from '../types';

interface SSEOptions {
  onDone?: () => void;
  onError?: (err: any) => void;
}

export function useSSE() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { updateLastMessage, setStreaming } = useChatStore();

  const startStream = useCallback((query: string, scope: 'all' | 'selected', selectedIds: string[], options?: SSEOptions) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStreaming(true);

    // MOCK IMPLEMENTATION for demonstration since there's no real backend:
    let count = 0;
    const mockText = "根据知识库内容，这是一个模拟的流式回复。在实际生产环境中，这里会连接到后端的 EventSource 或使用 fetch 读取 ReadableStream。\n\n我们可以看到 Markdown 渲染效果：\n- **加粗文本**\n- `代码片段`\n\n```typescript\nconsole.log('Hello World');\n```";
    
    const mockSources: Source[] = [
      { id: '1', text: '这是一个相关的知识库片段，包含了重要的背景信息。', similarity: 0.92, documentId: 'doc1', documentName: '设计文档.pdf' },
      { id: '2', text: '另一个相关的片段，补充了更多细节。', similarity: 0.85, documentId: 'doc2', documentName: '需求说明.txt' }
    ];

    const interval = setInterval(() => {
      if (count < mockText.length) {
        updateLastMessage(mockText[count]);
        count++;
      } else {
        clearInterval(interval);
        updateLastMessage('', mockSources);
        setStreaming(false);
        options?.onDone?.();
      }
    }, 50);

    // Real implementation would look like:
    /*
    const url = new URL('/api/chat', window.location.origin);
    url.searchParams.append('q', query);
    url.searchParams.append('scope', scope);
    if (scope === 'selected') {
      url.searchParams.append('docIds', selectedIds.join(','));
    }
    
    const es = new EventSource(url.toString());
    eventSourceRef.current = es;

    es.addEventListener('token', (e) => {
      updateLastMessage(e.data);
    });

    es.addEventListener('sources', (e) => {
      const sources = JSON.parse(e.data);
      updateLastMessage('', sources);
    });

    es.addEventListener('done', () => {
      es.close();
      setStreaming(false);
      options?.onDone?.();
    });

    es.onerror = (err) => {
      es.close();
      setStreaming(false);
      options?.onError?.(err);
    };
    */

    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [updateLastMessage, setStreaming]);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStreaming(false);
  }, [setStreaming]);

  return { startStream, stopStream };
}
