import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  User,
  SearchX
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const CandidateTable = ({ records, searchQuery }) => {
  const [sortField, setSortField] = useState('sr_no');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [records, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + pageSize);

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const parts = text.toString().split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-white text-black font-black px-1 py-0.5 rounded border border-white">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="glass-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl space-y-0">
      {/* Table Header Bar */}
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-black text-white uppercase tracking-widest font-mono">
            Candidate Allotment Master List
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-bold text-black bg-white rounded-full">
            {records.length} Total Records
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-zinc-400 font-bold">Rows per page:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="glass-input text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none bg-zinc-900 border-zinc-700 text-white"
          >
            <option value={15} className="bg-black text-white">15</option>
            <option value={25} className="bg-black text-white">25</option>
            <option value={50} className="bg-black text-white">50</option>
            <option value={100} className="bg-black text-white">100</option>
          </select>
        </div>
      </div>

      {/* Main Table Viewport */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-300 font-extrabold border-b border-white/10 uppercase tracking-wider text-[10.5px] select-none">
              <th className="py-3.5 px-4 cursor-pointer hover:text-white hover:bg-slate-800/60 transition-colors" onClick={() => handleSort('sr_no')}>
                <div className="flex items-center gap-1.5">
                  <span>Sr.</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th className="py-3.5 px-4 cursor-pointer hover:text-white hover:bg-slate-800/60 transition-colors" onClick={() => handleSort('merit_no')}>
                <div className="flex items-center gap-1.5">
                  <span>Merit No</span>
                  {sortField === 'merit_no' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-500" />}
                </div>
              </th>

              <th className="py-3.5 px-4 cursor-pointer hover:text-white hover:bg-slate-800/60 transition-colors" onClick={() => handleSort('merit_score')}>
                <div className="flex items-center gap-1.5">
                  <span>Score</span>
                  {sortField === 'merit_score' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                  ) : <ArrowUpDown className="w-3 h-3 text-slate-500" />}
                </div>
              </th>

              <th className="py-3.5 px-4 cursor-pointer hover:text-white hover:bg-slate-800/60 transition-colors" onClick={() => handleSort('application_id')}>
                <div className="flex items-center gap-1.5">
                  <span>App ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th className="py-3.5 px-4 cursor-pointer hover:text-white hover:bg-slate-800/60 transition-colors" onClick={() => handleSort('candidate_name')}>
                <div className="flex items-center gap-1.5">
                  <span>Candidate Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th className="py-3.5 px-4">Gender</th>

              <th className="py-3.5 px-4 cursor-pointer hover:text-white hover:bg-slate-800/60 transition-colors" onClick={() => handleSort('candidate_category')}>
                Category
              </th>

              <th className="py-3.5 px-4 cursor-pointer hover:text-white hover:bg-slate-800/60 transition-colors" onClick={() => handleSort('choice_code')}>
                Choice Code
              </th>

              <th className="py-3.5 px-4 cursor-pointer hover:text-white hover:bg-slate-800/60 transition-colors" onClick={() => handleSort('allotted_seat_type')}>
                Seat Type
              </th>

              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5 text-slate-200 font-sans">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((row, idx) => (
                <tr 
                  key={`${row.choice_code}-${row.sr_no}-${idx}`} 
                  className={`hover:bg-indigo-950/20 transition-colors ${
                    row.is_vacant ? 'bg-slate-900/40 text-slate-400 italic' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono text-slate-400 font-bold">{row.sr_no}</td>

                  <td className="py-3 px-4 font-mono font-extrabold text-white">
                    {row.merit_no ? row.merit_no.toLocaleString() : '—'}
                  </td>

                  <td className="py-3 px-4 font-mono">
                    {row.merit_score !== null ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white">{row.merit_score.toFixed(4)}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded uppercase bg-slate-800 text-indigo-300 border border-indigo-500/30">
                          {row.score_type}
                        </span>
                      </div>
                    ) : '—'}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                    {highlightText(row.application_id, searchQuery)}
                  </td>

                  <td className="py-3 px-4 font-bold text-white max-w-[220px] truncate">
                    {row.is_vacant ? (
                      <span className="text-slate-500 font-normal italic flex items-center gap-1">
                        <SearchX className="w-3.5 h-3.5" /> VACANT SEAT
                      </span>
                    ) : (
                      highlightText(row.candidate_name, searchQuery)
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {row.gender ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800/80 text-slate-300 border border-white/10">
                        {row.gender}
                      </span>
                    ) : '—'}
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-200">
                    {row.candidate_category ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-200 border border-white/10 font-mono text-[11px]">
                        {row.candidate_category}
                      </span>
                    ) : '—'}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                    <span className="block font-bold text-white">{row.choice_code}</span>
                    <span className="text-[10px] text-slate-400 truncate block max-w-[130px]" title={row.department_name}>
                      {row.department_name}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-100 font-extrabold">
                    {row.raw_seat_type}
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge 
                      symbol={row.status_symbol} 
                      label={row.status_label} 
                      isVacant={row.is_vacant} 
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-14 text-center text-slate-400 space-y-3">
                  <User className="w-10 h-10 mx-auto text-slate-500" />
                  <p className="text-base font-bold text-white">No matching candidate records found</p>
                  <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Bar */}
      <div className="px-5 py-3.5 border-t border-white/10 bg-slate-900/90 flex items-center justify-between gap-4 flex-wrap text-xs text-slate-400 font-medium">
        <div>
          Showing <strong className="text-white">{paginatedRecords.length > 0 ? startIndex + 1 : 0}</strong> to{' '}
          <strong className="text-white">{Math.min(startIndex + pageSize, sortedRecords.length)}</strong> of{' '}
          <strong className="text-white">{sortedRecords.length}</strong> candidates
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-all"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-all"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3.5 py-1 font-mono font-bold text-white bg-slate-950 border border-white/10 rounded-lg">
            Page {safeCurrentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-all"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-all"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateTable;

