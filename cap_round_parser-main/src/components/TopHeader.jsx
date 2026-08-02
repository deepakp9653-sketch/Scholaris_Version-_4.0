import React from 'react';
import { Download, FileJson, Building2 } from 'lucide-react';

const PAGE_TITLES = {
  overview: { title: 'Institutional Overview', subtitle: 'Executive seat allotment performance snapshot & analytics' },
  candidates: { title: 'Candidate Allotment List', subtitle: 'Search, filter, and audit student allotment records' },
  departments: { title: 'Choice Code Master Matrix', subtitle: 'Detailed seat intake & vacancy breakdown per choice code' },
  data: { title: 'Data & PDF Management', subtitle: 'Manage PDF documents, schema, and reporting schedules' }
};

const TopHeader = ({ activePage, metadata, onExportCsv, onExportJson }) => {
  const pageInfo = PAGE_TITLES[activePage] || PAGE_TITLES.overview;

  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-zinc-800 px-6 sm:px-8 py-4 flex items-center justify-between gap-4 shadow-xl">
      {/* Left Title Area */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black tracking-tight text-white font-sans">
            {pageInfo.title}
          </h1>
        </div>
        <p className="text-xs text-zinc-400 font-medium mt-0.5">
          {pageInfo.subtitle}
        </p>
      </div>

      {/* Right Institution Context & Quick Export Actions */}
      <div className="flex items-center gap-3">
        {metadata && (
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 max-w-xs truncate shadow-inner">
            <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-xs font-bold text-white" title={metadata.institution_code_name}>
              {metadata.institution_code_name}
            </span>
          </div>
        )}

        {metadata && (
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-xl transition-all border border-white active:scale-95 shadow-md"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all border border-zinc-700 active:scale-95 shadow-md"
              title="Export full JSON payload"
            >
              <FileJson className="w-3.5 h-3.5 text-white" />
              <span>Export JSON</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopHeader;

