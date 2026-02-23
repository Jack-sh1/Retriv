import React, { useEffect } from 'react';
import { UploadArea } from './UploadArea';
import { DocumentList } from './DocumentList';
import { useChatStore } from '../../store/useChatStore';
import { Database } from 'lucide-react';
import { Document } from '../../types/index';

export function Sidebar() {
  // Safe destructuring with default values
  const documents = useChatStore((state) => state.documents ?? []);
  const selectedDocIds = useChatStore((state) => state.selectedDocIds ?? []);
  const setDocuments = useChatStore((state) => state.setDocuments);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/documents');
        if (response.ok) {
          const data = await response.json();
          // Map backend response to Document interface
          const docs: Document[] = (data || []).map((d: any) => ({
            id: d.doc_id,
            filename: d.filename,
            chunkCount: d.chunk_count,
            uploadTime: d.created_at
          }));
          setDocuments(docs);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        setDocuments([]); // Ensure documents is reset on error to avoid undefined state
      }
    };

    fetchDocuments();
  }, [setDocuments]);

  // Safe lengths
  const docCount = documents?.length ?? 0;
  const selectedCount = selectedDocIds?.length ?? 0;

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
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
          文档列表 ({docCount})
        </div>
        <DocumentList />
      </div>
      
      <div className="p-4 border-t border-white/5 text-xs text-gray-500 flex justify-between items-center bg-[#0d0f14]">
        <span>已选中文档</span>
        <span className="text-[#f5a623] font-medium">
          {selectedCount} / {docCount}
        </span>
      </div>
    </div>
  );
}
