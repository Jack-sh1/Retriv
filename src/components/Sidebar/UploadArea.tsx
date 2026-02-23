import React, { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export function UploadArea() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addDocument } = useChatStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          addDocument({
            id: Math.random().toString(36).substring(7),
            filename: file.name,
            chunkCount: Math.floor(Math.random() * 50) + 1,
            uploadTime: Date.now()
          });
          return 0;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) simulateUpload(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) simulateUpload(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer
        ${isDragging ? 'border-[#f5a623] bg-[#f5a623]/10' : 'border-white/10 hover:border-white/20 bg-[#13151c]'}`}
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
          <div className="w-full bg-black/50 rounded-full h-1.5 mb-1 overflow-hidden">
            <div 
              className="bg-[#f5a623] h-1.5 rounded-full transition-all duration-200" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-400">{progress}%</span>
        </div>
      ) : (
        <>
          <Upload className="w-6 h-6 text-gray-400 mb-2" />
          <span className="text-sm text-gray-300 mb-1">点击或拖拽上传</span>
          <span className="text-xs text-gray-500">支持 PDF / TXT / MD</span>
        </>
      )}
    </div>
  );
}
