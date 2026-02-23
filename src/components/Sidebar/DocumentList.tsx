import React from 'react';
import { Trash2, FileText, CheckSquare, Square } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export function DocumentList() {
  const { documents, selectedDocIds, toggleDocumentSelection, removeDocument } = useChatStore();

  if (documents.length === 0) {
    return (
      <div className="text-center text-xs text-gray-600 py-8">
        暂无文档，请先上传
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map(doc => {
        const isSelected = selectedDocIds.includes(doc.id);
        return (
          <div 
            key={doc.id} 
            className={`group flex items-center p-2 rounded border transition-colors cursor-pointer
              ${isSelected ? 'bg-[#f5a623]/10 border-[#f5a623]/30' : 'bg-[#13151c] border-white/5 hover:border-white/10'}`}
            onClick={() => toggleDocumentSelection(doc.id)}
          >
            <div className="mr-3 text-gray-400">
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-[#f5a623]" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-200 truncate">{doc.filename}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 flex gap-2">
                <span>{doc.chunkCount} chunks</span>
                <span>{new Date(doc.uploadTime).toLocaleDateString()}</span>
              </div>
            </div>
            
            <button 
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all rounded hover:bg-white/5"
              onClick={(e) => {
                e.stopPropagation();
                removeDocument(doc.id);
              }}
              title="删除文档"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
