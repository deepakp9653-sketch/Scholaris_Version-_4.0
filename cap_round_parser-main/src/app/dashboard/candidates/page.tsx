'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardHeader from '../components/DashboardHeader';
import { 
  Search, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Download,
  FileJson,
  User,
  RefreshCw
} from 'lucide-react';

interface CandidateItem {
  id: string;
  srNo: number;
  meritNo: number | null;
  score: number | null;
  scoreType: string | null;
  applicationId: string | null;
  candidateName: string;
  gender: string | null;
  category: string | null;
  seatTypeCode: string;
  statusSymbol: string | null;
  statusLabel: string | null;
  isVacant: boolean;
  choiceCode: string;
  departmentName: string;
}

function CandidatesContent() {
  const searchParams = useSearchParams();
  const batchIdParam = searchParams?.get('batchId') || null;

  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [choiceCode, setChoiceCode] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [gender, setGender] = useState('ALL');
  const [scoreType, setScoreType] = useState('ALL');

  const activeBatchId = batchIdParam || (typeof window !== 'undefined' ? localStorage.getItem('scholaris_active_batch_id') : '') || '';

  const fetchCandidates = async (bId?: string) => {
    setIsLoading(true);
    try {
      const activeId = bId || activeBatchId;
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        choiceCode,
        status,
        gender,
        scoreType
      });

      if (activeId) {
        params.set('batchId', activeId);
      }

      const res = await fetch(`/api/candidates?${params.toString()}`);
      const data = await res.json();
      if (data.candidates) {
        setCandidates(data.candidates);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(batchIdParam || undefined);
  }, [batchIdParam, page, pageSize, choiceCode, status, gender, scoreType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCandidates();
  };

  const handleReset = () => {
    setSearch('');
    setChoiceCode('ALL');
    setStatus('ALL');
    setGender('ALL');
    setScoreType('ALL');
    setPage(1);
  };

  const csvExportUrl = activeBatchId
    ? `/api/export/candidates?format=csv&batchId=${activeBatchId}`
    : `/api/export/candidates?format=csv`;

  const jsonExportUrl = activeBatchId
    ? `/api/export/candidates?format=json&batchId=${activeBatchId}`
    : `/api/export/candidates?format=json`;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#14181F] font-sans pb-12">
      <DashboardHeader
        activeTab="candidates"
        onBatchChange={(newId) => fetchCandidates(newId)}
      />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-8 space-y-6">
        
        {/* Streamlined Filter Toolbar */}
        <div className="bg-white border border-[#E7E9EC] rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#14181F]">Candidate Search & Filter Audit</h2>
              <p className="text-xs text-[#5B6270]">Search by candidate name or Application ID across current round</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={csvExportUrl}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#14181F] bg-white border border-[#D8DBE0] hover:bg-[#F7F8FA] rounded-lg transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#1C9A6C]" />
                <span>CSV</span>
              </a>

              <a
                href={jsonExportUrl}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#14181F] bg-white border border-[#D8DBE0] hover:bg-[#F7F8FA] rounded-lg transition-all"
              >
                <FileJson className="w-3.5 h-3.5 text-[#E0A72E]" />
                <span>JSON</span>
              </a>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-[#8A909C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate name or Application ID (e.g. EN25379973)..."
                className="w-full pl-10 pr-4 py-2 bg-[#F7F8FA] text-[#14181F] text-xs font-semibold rounded-xl border border-[#D8DBE0] focus:outline-none focus:border-[#2F5EFF] transition-all"
              />
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2F5EFF] hover:bg-[#2449D6] rounded-xl transition-all shadow-2xs"
              >
                Search
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#5B6270] hover:text-[#14181F] bg-[#F7F8FA] border border-[#E7E9EC] rounded-xl transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </form>

          {/* Filter Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E7E9EC]">
            <div>
              <label className="text-[11px] font-semibold text-[#5B6270] block mb-1">Status Filter</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full bg-[#F7F8FA] border border-[#D8DBE0] text-xs font-semibold text-[#14181F] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2F5EFF]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Admitted to Institute">Admitted to Institute (^)</option>
                <option value="Newly Allotted">Newly Allotted (&)</option>
                <option value="No Change">No Change (~)</option>
                <option value="Betterment in Choice Code">Betterment in Choice Code (*)</option>
                <option value="Betterment in Seat Type">Betterment in Seat Type (@)</option>
                <option value="Vacant">Vacant Seats</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#5B6270] block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => { setGender(e.target.value); setPage(1); }}
                className="w-full bg-[#F7F8FA] border border-[#D8DBE0] text-xs font-semibold text-[#14181F] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2F5EFF]"
              >
                <option value="ALL">All Genders</option>
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#5B6270] block mb-1">Entrance Exam</label>
              <select
                value={scoreType}
                onChange={(e) => { setScoreType(e.target.value); setPage(1); }}
                className="w-full bg-[#F7F8FA] border border-[#D8DBE0] text-xs font-semibold text-[#14181F] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2F5EFF]"
              >
                <option value="ALL">All Exams</option>
                <option value="MHT_CET">MHT-CET</option>
                <option value="JEE_MAIN">JEE(Main)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#5B6270] block mb-1">Rows Per Page</label>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="w-full bg-[#F7F8FA] border border-[#D8DBE0] text-xs font-semibold text-[#14181F] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2F5EFF]"
              >
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidate Table */}
        <div className="bg-white border border-[#E7E9EC] rounded-2xl overflow-hidden shadow-2xs space-y-0">
          {isLoading ? (
            <div className="p-16 text-center text-xs font-semibold text-[#5B6270] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2F5EFF]" />
              <span>Loading Candidate Records...</span>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[420px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] text-[#5B6270] font-semibold border-b border-[#E7E9EC] text-[11px] uppercase">
                    <th className="py-3 px-3.5">Sr.</th>
                    <th className="py-3 px-3.5">Merit No</th>
                    <th className="py-3 px-3.5">Score</th>
                    <th className="py-3 px-3.5">App ID</th>
                    <th className="py-3 px-3.5">Candidate Name</th>
                    <th className="py-3 px-3.5">Gender</th>
                    <th className="py-3 px-3.5">Category</th>
                    <th className="py-3 px-3.5">Choice Code</th>
                    <th className="py-3 px-3.5">Seat Type</th>
                    <th className="py-3 px-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E9EC] text-[#14181F]">
                  {candidates.length > 0 ? (
                    candidates.map((c) => (
                      <tr key={c.id} className={`hover:bg-[#F7F8FA] transition-colors ${c.isVacant ? 'bg-[#F7F8FA]/60 text-[#8A909C] italic' : ''}`}>
                        <td className="py-3 px-3.5 font-mono text-[#5B6270] font-semibold">{c.srNo}</td>
                        <td className="py-3 px-3.5 font-mono font-bold">{c.meritNo ? c.meritNo.toLocaleString() : '—'}</td>
                        <td className="py-3 px-3.5 font-mono">
                          {c.score !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">{c.score.toFixed(4)}</span>
                              <span className="text-[9.5px] font-bold text-[#5B6270] bg-[#F7F8FA] border border-[#E7E9EC] px-1 py-0.2 rounded">
                                {c.scoreType}
                              </span>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-[#2F5EFF]">{c.applicationId || '—'}</td>
                        <td className="py-3 px-3.5 font-semibold max-w-[200px] truncate">
                          {c.isVacant ? <span className="text-[#8A909C] italic font-normal">VACANT SEAT</span> : c.candidateName}
                        </td>
                        <td className="py-3 px-3.5">{c.gender || '—'}</td>
                        <td className="py-3 px-3.5 font-semibold text-[#5B6270]">{c.category || '—'}</td>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-[#2F5EFF] font-bold">{c.choiceCode}</td>
                        <td className="py-3 px-3.5 font-mono font-semibold">{c.seatTypeCode}</td>
                        <td className="py-3 px-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            c.isVacant
                              ? 'bg-[#F7F8FA] text-[#8A909C] border-[#E7E9EC]'
                              : c.statusSymbol === '*'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : c.statusSymbol === '@'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : c.statusSymbol === '~'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : c.statusSymbol === '&'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            {c.statusSymbol && <span className="font-mono font-bold">{c.statusSymbol}</span>}
                            <span>{c.statusLabel || 'Standard'}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#5B6270] space-y-2">
                        <User className="w-8 h-8 mx-auto text-[#8A909C]" />
                        <p className="text-sm font-bold text-[#14181F]">No matching candidate records found for selected PDF round</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="px-5 py-3 border-t border-[#E7E9EC] bg-[#F7F8FA] flex items-center justify-between gap-4 text-xs text-[#5B6270] font-semibold">
            <div>
              Showing <strong className="text-[#14181F]">{candidates.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to{' '}
              <strong className="text-[#14181F]">{Math.min(page * pageSize, total)}</strong> of{' '}
              <strong className="text-[#14181F]">{total}</strong> records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1 rounded-md bg-white border border-[#D8DBE0] text-[#14181F] hover:bg-[#F7F8FA] disabled:opacity-40"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-1 rounded-md bg-white border border-[#D8DBE0] text-[#14181F] hover:bg-[#F7F8FA] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2.5 py-1 font-mono text-[#14181F] bg-white border border-[#D8DBE0] rounded-md">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="p-1 rounded-md bg-white border border-[#D8DBE0] text-[#14181F] hover:bg-[#F7F8FA] disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1 rounded-md bg-white border border-[#D8DBE0] text-[#14181F] hover:bg-[#F7F8FA] disabled:opacity-40"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-semibold text-[#5B6270]">Loading...</div>}>
      <CandidatesContent />
    </Suspense>
  );
}
