import React, { useState } from 'react';
import { 
  Combine, 
  Split, 
  RotateCw, 
  Trash2, 
  Image as ImageIcon, 
  Stamp, 
  Hash, 
  Search,
  ArrowRight
} from 'lucide-react';
import type { ToolDef, ToolCategory } from '../types';
import { TOOLS } from '../data/tools';

interface ToolGridProps {
  onSelectTool: (tool: ToolDef) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Combine,
  Split,
  RotateCw,
  Trash2,
  Image: ImageIcon,
  Stamp,
  Hash,
};

export const ToolGrid: React.FC<ToolGridProps> = ({ onSelectTool }) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
          {(['all', 'organize', 'convert', 'edit'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'All Tools' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PDF tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredTools.map((tool) => {
          const IconComponent = ICON_MAP[tool.iconName] || Combine;

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className={`group relative p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 ${tool.bgColor}`}
            >
              <div>
                {/* Header row with Icon and Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center ${tool.color} group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  {tool.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-xs border border-slate-200">
                      {tool.badge}
                    </span>
                  )}
                </div>

                {/* Tool title & description */}
                <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-red-600 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {tool.shortDesc}
                </p>
              </div>

              {/* Action link */}
              <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">No tools found matching "{searchQuery}"</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-3 text-xs font-semibold text-red-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
