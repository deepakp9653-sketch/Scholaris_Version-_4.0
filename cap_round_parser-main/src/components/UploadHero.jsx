import React, { useState } from 'react';
import { FileUp, Sparkles, CheckCircle2, Loader2, Play } from 'lucide-react';
import { parseCapPdfArrayBuffer } from '../utils/pdfParser';
import sampleData from '../data/initialData';

const UploadHero = ({ onDataLoaded }) => {
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
      setProgressText('Extracting candidate records & seat analytics...');

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
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-xl text-center space-y-8 animate-in fade-in duration-300">
        
        {/* Brand Badge & Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs font-extrabold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>MHT-CET Academic Seat Parser</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-black font-sans">
            Scholaris
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 font-medium max-w-md mx-auto leading-relaxed">
            Upload your provisional allotment PDF list to cleanly extract student records, choice codes, and seat analytics.
          </p>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div className="relative bg-white border-2 border-dashed border-zinc-300 hover:border-black rounded-2xl p-8 sm:p-10 transition-all duration-200 group shadow-lg">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />

          {isProcessing ? (
            <div className="space-y-4 py-4">
              <Loader2 className="w-10 h-10 text-black animate-spin mx-auto" />
              <p className="text-sm font-bold text-black">{progressText}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-black border border-black flex items-center justify-center mx-auto text-white group-hover:scale-105 transition-all shadow-md">
                <FileUp className="w-8 h-8" />
              </div>

              <div>
                <p className="text-sm font-bold text-black">
                  Drop your PDF here, or <span className="underline">browse file</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Supports CAP Round Allotment List PDF documents</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-bold text-white bg-black border border-black py-2.5 px-4 rounded-xl">
            {error}
          </p>
        )}

        {/* Quick Sample Loader Option */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span className="text-xs text-zinc-500 font-medium">Or test with sample dataset:</span>
          <button
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-lg transition-all shadow-sm border border-black"
          >
            <Play className="w-3.5 h-3.5 text-white" />
            <span>Load CAP Round II Demo PDF</span>
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-[11.5px] text-zinc-500 font-semibold flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-black" />
          <span>Client-side parsing: Your PDF is processed locally in your browser.</span>
        </p>

      </div>
    </div>
  );
};

export default UploadHero;
