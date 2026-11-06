import React from 'react';
import { Shield, Zap, Lock } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="pt-10 pb-6 text-center max-w-4xl mx-auto px-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold uppercase tracking-wider mb-4">
        ✨ DesiPDF • Enhanced with Pure Client-Side Privacy
      </div>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
        Every tool you need to work with PDFs in one place
      </h1>
      <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
        Merge, split, rotate, watermark, and convert documents directly in your browser.
        No file uploads, zero wait times, and complete confidentiality.
      </p>

      {/* Trust pill row */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Zero Server Uploads</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Instant Processing</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-blue-500" />
          <span>GDPR & Privacy Compliant</span>
        </div>
      </div>
    </div>
  );
};
