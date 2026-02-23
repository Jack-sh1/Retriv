import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useSSE } from '../../hooks/useSSE';

export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { documents, selectedDocIds, kbScope, isStreaming, addMessage } = useChatStore();
  const { startStream } = useSSE();

  const isKbEmpty = documents.length === 0;
  const activeDocCount = kbScope === 'all' ? documents.length : selectedDocIds.length;
  const isDisabled = isKbEmpty || activeDocCount === 0 || isStreaming;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isDisabled) return;

    const userMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user' as const,
      content: input.trim(),
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInput('');
    
    // Add empty AI message placeholder
    addMessage({
      id: Math.random().toString(36).substring(7),
      role: 'ai' as const,
      content: '',
      timestamp: Date.now(),
    });

    startStream(userMessage.content, kbScope, selectedDocIds);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {isKbEmpty && (
        <div className="flex items-center gap-2 text-xs text-[#f5a623] bg-[#f5a623]/10 p-2 rounded border border-[#f5a623]/20">
          <AlertCircle className="w-4 h-4" />
          <span>知识库为空，请先在左侧上传文档。</span>
        </div>
      )}
      
      <div className={`relative flex items-end bg-[#0d0f14] border rounded-lg overflow-hidden transition-colors
        ${isDisabled ? 'border-white/5 opacity-50' : 'border-white/10 focus-within:border-[#f5a623]/50'}`}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isDisabled ? "暂不可用..." : "输入问题，Shift + Enter 换行..."}
          disabled={isDisabled}
          className="w-full max-h-[200px] min-h-[56px] bg-transparent text-sm text-gray-200 p-4 pr-14 resize-none focus:outline-none"
          rows={1}
        />
        
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          <span className="text-[10px] text-gray-600 pointer-events-none">
            {input.length} 字符
          </span>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isDisabled}
            className={`p-2 rounded-md transition-all flex items-center justify-center
              ${!input.trim() || isDisabled 
                ? 'bg-white/5 text-gray-600' 
                : 'bg-[#f5a623] text-black hover:bg-[#f5a623]/90 shadow-[0_0_10px_rgba(245,166,35,0.2)]'}`}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
