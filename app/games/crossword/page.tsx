'use client';

import { RefreshCw, Check, Eye } from 'lucide-react';

export default function CrosswordPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-gray-500 text-sm">Crossword coming together...</p>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm">
            <Check size={16} /> Check
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm">
            <Eye size={16} /> Reveal
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm">
            <RefreshCw size={16} /> New puzzle
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-wrap">
        <div className="w-[400px] h-[300px] border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400">
          Grid renders here
        </div>
        <div className="flex gap-6 flex-1 min-w-[200px]">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Across</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Down</div>
          </div>
        </div>
      </div>
    </div>
  );
}