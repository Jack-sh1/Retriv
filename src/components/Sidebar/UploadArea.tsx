import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export function UploadArea() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addDocument } = useChatStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      addDocument({
        id: data.doc_id,
        filename: file.name,
        chunkCount: data.chunk_count,
        uploadTime: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadFile(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div 
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${isDragging ? 'border-[#f5a623] bg-[#f5a623]/10' : 'border-white/10 hover:border-white/20 bg-[#13151c]'}
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,.txt,.md"
          onChange={handleFileSelect}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center w-full">
            <Loader2 className="w-6 h-6 text-[#f5a623] animate-spin mb-2" />
            <span className="text-xs text-gray-400">Processing...</span>
          </div>
        ) : (
          <>
            <Upload className={`w-6 h-6 mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-300 mb-1">点击或拖拽上传</span>
            <span className="text-xs text-gray-500">支持 PDF / TXT / MD</span>
          </>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}
    </div>
  );
}
