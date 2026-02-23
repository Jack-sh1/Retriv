import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../types';
import { SourceCard } from './SourceCard';
import { User, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  message: Message;
}

export function MessageItem({ message }: Props) {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-1
        ${isUser ? 'bg-[#f5a623] text-black' : 'bg-[#13151c] border border-white/10 text-[#f5a623]'}`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-semibold text-gray-400">{isUser ? 'YOU' : 'SYSTEM'}</span>
          <span className="text-[10px] text-gray-600">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        
        <div className={`p-4 rounded-lg text-sm leading-relaxed
          ${isUser 
            ? 'bg-[#13151c] border border-white/5 text-gray-200 rounded-tr-none' 
            : 'bg-transparent text-gray-300'}`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="markdown-body prose prose-invert prose-sm max-w-none prose-pre:bg-[#0d0f14] prose-pre:border prose-pre:border-white/10 prose-a:text-[#f5a623]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || '...'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 w-full">
            <button 
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#f5a623] transition-colors px-1 py-0.5 rounded hover:bg-white/5"
            >
              {showSources ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>查看来源 ({message.sources.length})</span>
            </button>
            
            {showSources && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 flex flex-col gap-2 overflow-hidden"
              >
                {message.sources.map((source, idx) => (
                  <SourceCard key={idx} source={source} />
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
