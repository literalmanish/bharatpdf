import React from 'react';
import { FileText, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  onHomeClick: () => void;
  activeToolName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onHomeClick, activeToolName }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={onHomeClick}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Desi<span className="text-red-600">PDF</span>
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                Local
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">100% Client-Side PDF Suite</p>
          </div>
        </div>

        {/* Center Breadcrumb (if tool open) */}
        {activeToolName && (
          <div className="hidden md:flex items-center gap-2 text-sm">
            <button 
              onClick={onHomeClick}
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              All Tools
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">{activeToolName}</span>
          </div>
        )}

        {/* Privacy & Speed Badges */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Files Never Leave Your Device</span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>No Limits</span>
          </div>
        </div>
      </div>
    </header>
  );
};
