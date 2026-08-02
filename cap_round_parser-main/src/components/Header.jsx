import React from 'react';
import { GraduationCap, FileUp, Download, FileJson, Building2, Trash2 } from 'lucide-react';

const Header = ({ metadata, onOpenUploader, onExportCsv, onExportJson, onClearData }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 border-b border-zinc-200 px-4 sm:px-8 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Logo */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-black flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-black font-sans">Scholaris</h1>
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">CAP Seat Allotment Portal</p>
          </div>
        </div>

        {/* Center Document Context */}
        {metadata && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 max-w-sm truncate">
            <Building2 className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
            <span className="truncate text-xs font-bold text-zinc-900" title={metadata.institution_code_name}>
              {metadata.institution_code_name}
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {metadata && (
            <>
              <button
                onClick={onOpenUploader}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-lg shadow-sm transition-all active:scale-95 border border-black"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload PDF</span>
              </button>

              <button
                onClick={onExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-800 hover:text-black bg-white hover:bg-zinc-100 rounded-lg transition-all border border-zinc-300 shadow-xs active:scale-95"
                title="Export filtered records to CSV"
              >
                <Download className="w-3.5 h-3.5 text-zinc-900" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button
                onClick={onExportJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-800 hover:text-black bg-white hover:bg-zinc-100 rounded-lg transition-all border border-zinc-300 shadow-xs active:scale-95"
                title="Export full JSON payload"
              >
                <FileJson className="w-3.5 h-3.5 text-zinc-900" />
                <span className="hidden sm:inline">JSON</span>
              </button>

              <button
                onClick={onClearData}
                className="p-1.5 text-zinc-500 hover:text-black bg-white hover:bg-zinc-100 rounded-lg border border-zinc-300 transition-all shadow-xs"
                title="Clear current data"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
