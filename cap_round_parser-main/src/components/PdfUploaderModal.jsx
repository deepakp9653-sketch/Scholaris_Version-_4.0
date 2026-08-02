import React, { useState } from 'react';
import { FileUp, X, CheckCircle2, AlertCircle, Loader2, FileText, Sparkles } from 'lucide-react';
import { parseCapPdfArrayBuffer } from '../utils/pdfParser';

const PdfUploaderModal = ({ isOpen, onClose, onDataParsed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a valid PDF document.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgressText('Loading PDF file into memory...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgressText('Parsing MHT-CET allotment tables & candidate records...');

      const parsedData = await parseCapPdfArrayBuffer(arrayBuffer, file.name);

      if (!parsedData || !parsedData.records || parsedData.records.length === 0) {
        throw new Error('No valid allotment table records found in this PDF.');
      }

      setIsProcessing(false);
      onDataParsed(parsedData);
      onClose();
    } catch (err) {
      console.error("PDF Parsing Error:", err);
      setIsProcessing(false);
      setError(`Failed to parse PDF: ${err.message || 'Format unrecognized.'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-zinc-700 p-6 shadow-2xl space-y-6 relative overflow-hidden bg-black">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-white text-black border border-white shadow-lg">
            <FileUp className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-lg font-black text-white tracking-tight">Upload CAP Allotment PDF</h2>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            Upload any MHT-CET Provisional Allotment PDF document to instantly parse candidate records and seat analytics.
          </p>
        </div>

        {/* Dropzone Area */}
        <div className="relative border-2 border-dashed border-zinc-700 hover:border-white rounded-2xl p-8 text-center transition-all bg-zinc-950 hover:bg-zinc-900 group cursor-pointer shadow-inner">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />

          {isProcessing ? (
            <div className="space-y-3 py-2">
              <Loader2 className="w-9 h-9 text-white animate-spin mx-auto" />
              <p className="text-xs font-bold text-white">{progressText}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-full bg-zinc-900 text-white w-12 h-12 mx-auto flex items-center justify-center border border-zinc-700 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Drag and drop your PDF here, or <span className="text-white underline">browse</span>
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 font-medium">Supports CAP Round I & II Allotment PDFs</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-zinc-900 text-white border border-zinc-600 text-xs font-bold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-[11px] text-zinc-400 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>Client-side parsing: Data is extracted live right in your browser.</span>
        </div>
      </div>
    </div>
  );
};

export default PdfUploaderModal;

