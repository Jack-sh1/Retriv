import React, { useState } from 'react';
import { Source } from '../../types';
import { FileText, Percent } from 'lucide-react';

interface Props {
  source: Source;
}

export function SourceCard({ source }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="bg-[#13151c] border border-white/5 rounded p-3 cursor-pointer hover:border-white/10 transition-colors"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <FileText className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px]">{source.source}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] bg-[#0d0f14] px-1.5 py-0.5 rounded border border-white/5 text-[#f5a623]">
          <Percent className="w-3 h-3" />
          <span>{(source.score * 100).toFixed(1)}%</span>
        </div>
      </div>
      
      <div className={`text-xs text-gray-500 leading-relaxed font-sans ${isExpanded ? '' : 'line-clamp-2'}`}>
        {source.text}
      </div>
    </div>
  );
}
