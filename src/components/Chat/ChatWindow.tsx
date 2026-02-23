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
  
  console.log('[ChatWindow] Render. Messages count:', messages.length);
  if (messages.length === 0) {
    console.log('[ChatWindow] Messages empty');
  } else {
    console.log('[ChatWindow] Last message:', messages[messages.length - 1]);
  }
  
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
    console.log('[ChatWindow] Adding messages:', userMsg, assistantMsg);
    addMessage(userMsg);
    addMessage(assistantMsg);
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Trigger API
    // Pass the NEW messages list including the optimistic updates
    const newMessages = [...messages, userMsg, assistantMsg]; 
    // Note: 'assistantMsg' is empty, so it won't affect history context much, 
    // but usually we exclude the last empty assistant message from history sent to API.
    // The previous implementation was: [...messages, userMsg]
    
    console.log('[ChatWindow] Sending request with history length:', newMessages.length);
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
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
            <p className="text-lg">Ask me anything about your documents...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0d0f14] border-t border-white/5">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputResize}
            onKeyDown={handleKeyDown}
            placeholder="Type your question... (Shift+Enter for new line)"
            rows={1}
            disabled={isStreaming}
            className="w-full bg-[#1c1e26] text-gray-100 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-[#f5a623] resize-none overflow-hidden min-h-[48px] max-h-[200px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors ${
              input.trim() && !isStreaming
                ? 'bg-[#f5a623] text-white hover:bg-[#e09612]'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isStreaming ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                className="w-5 h-5 transform rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        {isStreaming && (
          <div className="flex justify-center mt-2">
             <button 
               onClick={abort}
               className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
             >
               <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
               Stop generating
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
