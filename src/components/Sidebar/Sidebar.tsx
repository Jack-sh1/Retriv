import React, { useEffect } from 'react';
import { UploadArea } from './UploadArea';
import { DocumentList } from './DocumentList';
import { useChatStore } from '../../store/useChatStore';
import { Database } from 'lucide-react';

export function Sidebar() {
  const { documents, selectedDocIds, setDocuments } = useChatStore();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/documents');
        if (response.ok) {
          const data = await response.json();
          // Map backend response to Document interface if needed
          // Backend returns: { doc_id, filename, chunk_count, created_at }
          // Frontend expects: { id, filename, chunkCount, uploadTime }
          const docs = data.map((d: any) => ({
            id: d.doc_id,
            filename: d.filename,
            chunkCount: d.chunk_count,
            uploadTime: d.created_at
          }));
          setDocuments(docs);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };

    fetchDocuments();
  }, [setDocuments]);

  return (
    <div className="w-[280px] h-full bg-[#0d0f14] border-r border-white/5 flex flex-col text-gray-300 font-mono text-sm">
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <Database className="w-5 h-5 text-[#f5a623]" />
        <h1 className="font-semibold text-gray-100">知识库管理</h1>
      </div>
      
      <div className="p-4">
        <UploadArea />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 pt-0">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">文档列表 ({documents.length})</div>
        <DocumentList />
      </div>
      
      <div className="p-4 border-t border-white/5 text-xs text-gray-500 flex justify-between items-center bg-[#0d0f14]">
        <span>已选中文档</span>
        <span className="text-[#f5a623] font-medium">{selectedDocIds.length} / {documents.length}</span>
      </div>
    </div>
  );
}
