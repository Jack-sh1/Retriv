import React from 'react';
import { ChatWindow } from './ChatWindow';
import { useChatStore } from '../../store/useChatStore';
import { Layers } from 'lucide-react';

export function ChatArea() {
  const { kbScope, setKBScope, selectedDocIds, documents } = useChatStore();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0f14] font-mono relative">
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#13151c]/50 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#f5a623]" />
          <h2 className="font-semibold text-gray-100">Nexus Knowledge Q&A</h2>
        </div>
        
        <div className="flex items-center bg-[#0d0f14] rounded-md p-1 border border-white/5">
          <button
            className={`px-3 py-1 text-xs rounded transition-colors ${kbScope === 'all' ? 'bg-[#f5a623]/20 text-[#f5a623]' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setKBScope('all')}
          >
            全部文档 ({documents.length})
          </button>
          <button
            className={`px-3 py-1 text-xs rounded transition-colors ${kbScope === 'selected' ? 'bg-[#f5a623]/20 text-[#f5a623]' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setKBScope('selected')}
          >
            选中文档 ({selectedDocIds.length})
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <ChatWindow />
      </div>
    </div>
  );
}
