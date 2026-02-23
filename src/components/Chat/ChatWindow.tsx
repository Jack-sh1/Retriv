import { useRef, useEffect, useState, KeyboardEvent, ChangeEvent } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useSSEChat } from '../../hooks/useSSEChat';
import { Message } from '../../types';
import { MessageItem } from './MessageItem';

export const ChatWindow = () => {
  const { 
    messages, 
    addMessage, 
    appendTokenToLastMessage, 
    setLastMessageSources, 
    setLastMessageUsage, 
    selectedDocIds,
    setStreaming 
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // SSE Hook
  const { send, abort, isStreaming } = useSSEChat({
    onToken: (token) => {
      appendTokenToLastMessage(token);
    },
    onSources: (sources) => {
      setLastMessageSources(sources);
    },
    onDone: (usage) => {
      setLastMessageUsage(usage);
    },
    onError: (msg) => {
      appendTokenToLastMessage(`\n\n**Error:** ${msg}`);
    }
  });

  // Sync streaming state to store
  useEffect(() => {
    setStreaming(isStreaming);
  }, [isStreaming, setStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const currentInput = input.trim();
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentInput,
      createdAt: new Date(),
    };

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '', // Start empty
      createdAt: new Date(),
    };

    // Optimistic update
    addMessage(userMsg);
    addMessage(assistantMsg);
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Trigger API
    await send(currentInput, selectedDocIds, [...messages, userMsg]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputResize = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] text-gray-100 relative w-full max-w-5xl mx-auto border-x border-gray-800 shadow-2xl">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 select-none">
            <div className="text-6xl mb-4">🧠</div>
            <div className="text-xl font-medium">Recall Knowledge Base</div>
            <div className="text-sm mt-2">Ask me anything about your documents</div>
          </div>
        )}
        
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        
        {isStreaming && messages.length > 0 && messages[messages.length-1].role === 'assistant' && messages[messages.length-1].content === '' && (
          <div className="flex justify-start mb-6 animate-pulse">
            <div className="bg-[#1c1e24] p-4 rounded-lg border border-gray-700 w-12 h-8 flex items-center justify-center">
              <span className="w-2 h-2 bg-gray-500 rounded-full mx-0.5"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full mx-0.5 animation-delay-200"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full mx-0.5 animation-delay-400"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0d0f14] border-t border-gray-800">
        <div className="relative flex items-end gap-2 bg-[#1c1e24] rounded-xl border border-gray-700 p-2 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputResize}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "AI is thinking..." : "Ask a question..."}
            disabled={isStreaming}
            rows={1}
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 rounded-lg pl-2 py-2 resize-none focus:outline-none custom-scrollbar max-h-[200px]"
            style={{ minHeight: '40px' }}
          />
          <div className="flex-shrink-0 pb-1 pr-1">
            {isStreaming ? (
              <button 
                onClick={abort}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Stop generation"
              >
                <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-current rounded-[1px]"></div>
                </div>
              </button>
            ) : (
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            )}
          </div>
        </div>
        <div className="text-center mt-2 text-[10px] text-gray-600 select-none">
          <span className="hidden sm:inline">Press </span><kbd className="font-mono bg-gray-800 px-1 rounded text-gray-400">Enter</kbd><span className="hidden sm:inline"> to send, </span><kbd className="font-mono bg-gray-800 px-1 rounded text-gray-400 ml-1">Shift+Enter</kbd><span className="hidden sm:inline"> for new line</span>
        </div>
      </div>
    </div>
  );
};
