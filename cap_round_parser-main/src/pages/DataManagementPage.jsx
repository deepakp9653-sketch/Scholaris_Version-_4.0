import React, { useState } from 'react';
import { FileUp, FileText, Calendar, CheckCircle2, AlertCircle, Loader2, Play, Trash2, FileJson } from 'lucide-react';
import { parseCapPdfArrayBuffer } from '../utils/pdfParser';
import sampleData from '../data/initialData';

const DataManagementPage = ({ metadata, onDataLoaded, onClearData, onExportJson }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgressText('Reading PDF document...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgressText('Parsing MHT-CET allotment tables & candidate records...');

      const parsedData = await parseCapPdfArrayBuffer(arrayBuffer, file.name);

      if (!parsedData || !parsedData.records || parsedData.records.length === 0) {
        throw new Error('No valid allotment table records found in this PDF.');
      }

      setIsProcessing(false);
      onDataLoaded(parsedData);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setError(err.message || 'Failed to parse PDF document.');
    }
  };

  const handleLoadSample = () => {
    onDataLoaded(sampleData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Reporting Dates Banner */}
      {metadata && (
        <div className="erp-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Institute Admission Reporting Window</h3>
              <p className="text-sm font-bold text-white mt-0.5">
                Reporting Dates to Institute: August 12, 2025 to August 14, 2025 (upto 05:00 PM)
              </p>
            </div>
          </div>

          <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800/60 rounded-xl">
            Published: 11 August 2025
          </span>
        </div>
      )}

      {/* PDF Upload Dropzone Card */}
      <div className="erp-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">Upload New CAP Allotment PDF Document</h2>
          <p className="text-xs text-slate-400">
            Upload any MHT-CET Provisional Allotment PDF list to extract candidate records and seat analytics.
          </p>
        </div>

        <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center transition-all bg-slate-900/50 group">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />

          {isProcessing ? (
            <div className="space-y-3 py-2">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-200">{progressText}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <FileText className="w-10 h-10 text-slate-400 group-hover:text-blue-400 transition-colors mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Drag and drop your PDF here, or <span className="text-blue-400 underline">browse file</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Supports CAP Round I & II Allotment PDFs</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Data & Controls Toolbar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <button
            onClick={handleLoadSample}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
          >
            <Play className="w-4 h-4 text-blue-400" />
            <span>Load CAP Round II Demo PDF</span>
          </button>

          {metadata && (
            <div className="w-full sm:w-auto flex items-center gap-2">
              <button
                onClick={onExportJson}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
              >
                <FileJson className="w-4 h-4 text-amber-400" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={onClearData}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Current Data</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataManagementPage;
