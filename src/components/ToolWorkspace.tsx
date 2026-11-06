import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Download, 
  Loader2, 
  AlertCircle,
  Plus
} from 'lucide-react';
import type { ToolDef, UploadedFile } from '../types';
import { formatFileSize, downloadBlob } from '../lib/pdf/download';
import { mergePDFs } from '../lib/pdf/merge';
import { splitPDFByRange, splitAllPagesToZip } from '../lib/pdf/split';
import { rotatePDF } from '../lib/pdf/rotate';
import { convertImagesToPDF } from '../lib/pdf/imagesToPdf';
import { addWatermark } from '../lib/pdf/watermark';
import { addPageNumbers, type PageNumberPosition } from '../lib/pdf/pageNumbers';
import { removePagesFromPDF } from '../lib/pdf/removePages';

interface ToolWorkspaceProps {
  tool: ToolDef;
  onBack: () => void;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({ tool, onBack }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tool-specific options state
  const [splitMode, setSplitMode] = useState<'range' | 'all'>('range');
  const [pageRange, setPageRange] = useState('1-2');
  const [removePagesStr, setRemovePagesStr] = useState('2');
  const [rotateAngle, setRotateAngle] = useState(90);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [pageNumberPos, setPageNumberPos] = useState<PageNumberPosition>('bottom-center');
  const [imgFitMode, setImgFitMode] = useState<'contain' | 'original'>('contain');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    setError(null);
    setResultBlob(null);

    const mapped: UploadedFile[] = newFiles.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
    }));

    if (tool.multiple) {
      setFiles((prev) => [...prev, ...mapped]);
    } else {
      setFiles([mapped[0]]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    const [moved] = newFiles.splice(index, 1);
    newFiles.splice(targetIndex, 0, moved);
    setFiles(newFiles);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setResultBlob(null);

    try {
      let outputBlob: Blob;
      let outputName = 'processed.pdf';

      switch (tool.id) {
        case 'merge': {
          if (files.length < 2) {
            throw new Error('Please select at least 2 PDF files to merge.');
          }
          outputBlob = await mergePDFs(files.map((f) => f.file));
          outputName = 'merged_document.pdf';
          break;
        }

        case 'split': {
          const target = files[0].file;
          if (splitMode === 'range') {
            outputBlob = await splitPDFByRange(target, pageRange);
            outputName = `split_${target.name}`;
          } else {
            outputBlob = await splitAllPagesToZip(target);
            outputName = `${target.name.replace(/\.pdf$/i, '')}_pages.zip`;
          }
          break;
        }

        case 'remove-pages': {
          const target = files[0].file;
          outputBlob = await removePagesFromPDF(target, removePagesStr);
          outputName = `cleaned_${target.name}`;
          break;
        }

        case 'rotate': {
          const target = files[0].file;
          outputBlob = await rotatePDF(target, rotateAngle);
          outputName = `rotated_${target.name}`;
          break;
        }

        case 'images-to-pdf': {
          outputBlob = await convertImagesToPDF(
            files.map((f) => f.file),
            imgFitMode
          );
          outputName = 'images_combined.pdf';
          break;
        }

        case 'watermark': {
          const target = files[0].file;
          outputBlob = await addWatermark(target, watermarkText, {
            opacity: watermarkOpacity,
          });
          outputName = `watermarked_${target.name}`;
          break;
        }

        case 'page-numbers': {
          const target = files[0].file;
          outputBlob = await addPageNumbers(target, pageNumberPos);
          outputName = `numbered_${target.name}`;
          break;
        }

        default:
          throw new Error('Selected tool action not implemented yet.');
      }

      setResultBlob(outputBlob);
      setResultFilename(outputName);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while processing the document.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob && resultFilename) {
      downloadBlob(resultBlob, resultFilename);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setResultBlob(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button & tool header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tools</span>
        </button>

        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-900">{tool.name}</h2>
          <p className="text-xs text-slate-500">{tool.shortDesc}</p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      {resultBlob ? (
        /* SUCCESS / DOWNLOAD VIEW */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-xl mx-auto animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready for Download!</h3>
          <p className="text-sm text-slate-600 mb-6">
            Your document was processed directly in your browser.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 text-left flex items-center justify-between">
            <div className="truncate mr-4">
              <p className="text-xs font-bold text-slate-800 truncate">{resultFilename}</p>
              <p className="text-[11px] text-slate-500">{formatFileSize(resultBlob.size)}</p>
            </div>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-md shadow-red-500/20 hover:bg-red-700 transition-all flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={resetAll}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              Process Another File
            </button>
            <button
              onClick={onBack}
              className="text-xs font-semibold text-red-600 hover:text-red-700 px-4 py-2"
            >
              Back to Home
            </button>
          </div>
        </div>
      ) : (
        /* UPLOAD & CONFIGURE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Dropzone and File List */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-slate-300 hover:border-red-500 bg-white hover:bg-red-50/30 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={tool.accept}
                multiple={tool.multiple}
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>

              <h4 className="text-lg font-bold text-slate-900 mb-1">
                Choose {tool.multiple ? 'files' : 'a file'} or drop here
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Accepted: {tool.accept.replace(/application\//g, '').toUpperCase()}
              </p>

              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm shadow-md shadow-red-500/20 hover:bg-red-700 transition-colors pointer-events-none"
              >
                Select {tool.multiple ? 'PDFs / Images' : 'PDF'}
              </button>
            </div>

            {/* Uploaded Files Queue */}
            {files.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Selected Files ({files.length})
                  </h4>
                  {tool.multiple && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add more
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {files.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60"
                    >
                      <div className="flex items-center gap-3 min-w-0 mr-3">
                        <FileText className="w-5 h-5 text-red-600 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(item.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {tool.multiple && (
                          <>
                            <button
                              disabled={index === 0}
                              onClick={() => moveFile(index, 'up')}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              disabled={index === files.length - 1}
                              onClick={() => moveFile(index, 'down')}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeFile(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Settings & Action */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Tool Settings
              </h3>

              {/* Dynamic Settings according to tool */}
              {tool.id === 'split' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2">
                      Split Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSplitMode('range')}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                          splitMode === 'range'
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Extract Range
                      </button>
                      <button
                        onClick={() => setSplitMode('all')}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                          splitMode === 'all'
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        All Pages (ZIP)
                      </button>
                    </div>
                  </div>

                  {splitMode === 'range' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Page Range (e.g. 1-3, 5)
                      </label>
                      <input
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="1-3, 5"
                      />
                    </div>
                  )}
                </div>
              )}

              {tool.id === 'remove-pages' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Pages to Delete (e.g. 2, 4-6)
                  </label>
                  <input
                    type="text"
                    value={removePagesStr}
                    onChange={(e) => setRemovePagesStr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="2, 5"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    All other pages will be preserved in order.
                  </p>
                </div>
              )}

              {tool.id === 'rotate' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Rotation Angle
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setRotateAngle(deg)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                          rotateAngle === deg
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        +{deg}°
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tool.id === 'images-to-pdf' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Page Layout
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setImgFitMode('contain')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                        imgFitMode === 'contain'
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Fit to Standard A4
                    </button>
                    <button
                      onClick={() => setImgFitMode('original')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                        imgFitMode === 'original'
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Original Size
                    </button>
                  </div>
                </div>
              )}

              {tool.id === 'watermark' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="CONFIDENTIAL"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Opacity</span>
                      <span>{Math.round(watermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-red-600"
                    />
                  </div>
                </div>
              )}

              {tool.id === 'page-numbers' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Number Placement
                  </label>
                  <div className="space-y-2">
                    {(
                      [
                        { id: 'bottom-center', label: 'Bottom Center' },
                        { id: 'bottom-right', label: 'Bottom Right' },
                        { id: 'top-right', label: 'Top Right' },
                      ] as const
                    ).map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => setPageNumberPos(pos.id)}
                        className={`w-full p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                          pageNumberPos === pos.id
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tool.id === 'merge' && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Files will be merged in the exact order shown on the left. Use the arrows to reorder before merging.
                </p>
              )}

              {/* Error display */}
              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Process Action Button */}
              <button
                disabled={files.length === 0 || isProcessing}
                onClick={handleProcess}
                className="w-full mt-6 py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-sm shadow-md shadow-red-500/20 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing in browser...</span>
                  </>
                ) : (
                  <span>Execute {tool.name}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
