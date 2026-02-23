import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { MessageItem } from './MessageItem';

export function MessageList() {
  const { messages } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#13151c] border border-white/5 flex items-center justify-center mx-auto mb-4">
            <span className="text-[#f5a623] text-xl">⚡</span>
          </div>
          <p className="mb-2 text-gray-300">系统已就绪</p>
          <p className="text-xs">请在左侧上传文档，或直接在下方输入问题开始检索问答。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6 scroll-smooth">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
