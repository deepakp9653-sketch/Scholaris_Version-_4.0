'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardHeader from '../components/DashboardHeader';
import { 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Trash2, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

interface PreviewSummary {
  instituteCode: string;
  instituteName: string;
  roundLabel: string;
  sourceFilename: string;
  totalChoiceCodes: number;
  totalCandidates: number;
  totalFilledSeats: number;
  totalVacantSeats: number;
  warnings: string[];
  choiceCodesSummary: Array<{
    code: string;
    departmentName: string;
    variant: string;
    capSeats: number;
    filledSeats: number;
    vacantSeats: number;
    reconciled: boolean;
    reconciliationWarning?: string;
  }>;
}

function DataManagementContent() {
  const [batches, setBatches] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewSummary | null>(null);
  const [commitAction, setCommitAction] = useState<'replace' | 'append'>('append');
  const [isCommitting, setIsCommitting] = useState(false);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/uploads');
      const data = await res.json();
      if (data.batches) {
        setBatches(data.batches);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgressText('Extracting PDF text...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgressText('Parsing MHT-CET allotment tables & candidate records...');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse PDF document');
      }

      setIsProcessing(false);
      setPreviewId(data.previewId);
      setPreviewData(data.preview);
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setError(err.message || 'PDF parsing failed.');
    }
  };

  const handleCommitUpload = async () => {
    if (!previewId) return;

    setIsCommitting(true);
    try {
      const res = await fetch('/api/uploads/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewId,
          action: commitAction
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Commit failed');
      }

      setIsCommitting(false);
      setPreviewId(null);
      setPreviewData(null);
      fetchBatches();
    } catch (err: any) {
      console.error(err);
      setIsCommitting(false);
      setError(err.message || 'Commit failed.');
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch? All candidate records for this batch will be permanently removed.')) return;

    try {
      const res = await fetch(`/api/uploads/${batchId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchBatches();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#14181F] font-sans pb-12">
      <DashboardHeader activeTab="data" />

      <main className="max-w-5xl mx-auto px-6 sm:px-8 pt-8 space-y-8">
        
        {/* PDF Upload Card */}
        <div className="bg-white border border-[#E7E9EC] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#14181F]">Upload CAP Allotment PDF List</h2>
            <p className="text-xs text-[#5B6270]">
              Select an official State CET Provisional Allotment PDF to parse candidate tables into Neon Postgres database.
            </p>
          </div>

          <div className="relative border-2 border-dashed border-[#D8DBE0] hover:border-[#2F5EFF] rounded-2xl p-8 text-center transition-all bg-[#F7F8FA] group">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />

            {isProcessing ? (
              <div className="space-y-3 py-4">
                <Loader2 className="w-8 h-8 text-[#2F5EFF] animate-spin mx-auto" />
                <p className="text-xs font-semibold text-[#14181F]">{progressText}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#2F5EFF]/10 text-[#2F5EFF] flex items-center justify-center mx-auto group-hover:scale-105 transition-all">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#14181F]">
                    Drop your PDF here, or <span className="text-[#2F5EFF] underline">browse file</span>
                  </p>
                  <p className="text-[11px] text-[#8A909C] mt-1 font-medium">Supports CAP Round I & II Allotment PDFs</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-[#D64545] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Existing Upload Batches Card */}
        <div className="bg-white border border-[#E7E9EC] rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E7E9EC] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#14181F]">Uploaded Batches History</h3>
              <p className="text-xs text-[#5B6270]">List of ingested PDF rounds stored in Neon database</p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#5B6270]">
              {batches.length} Batches Total
            </span>
          </div>

          {batches.length > 0 ? (
            <div className="divide-y divide-[#E7E9EC]">
              {batches.map((b) => (
                <div key={b.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-[#1C9A6C] border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#14181F]">{b.roundLabel}</h4>
                      <p className="text-[11px] text-[#5B6270] mt-0.5">
                        Source: <span className="font-mono text-[#14181F]">{b.sourceFilename}</span> • Uploaded on {new Date(b.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-[#14181F] bg-[#F7F8FA] px-2.5 py-1 rounded border border-[#E7E9EC]">
                      {b._count?.choiceCodes || 15} Choice Codes
                    </span>

                    <button
                      onClick={() => handleDeleteBatch(b.id)}
                      className="p-1.5 text-[#8A909C] hover:text-[#D64545] bg-white hover:bg-rose-50 rounded-lg border border-[#D8DBE0] transition-all"
                      title="Delete batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#8A909C] space-y-1">
              <FolderOpen className="w-6 h-6 mx-auto text-[#8A909C]" />
              <p className="font-semibold text-[#14181F]">No committed batches found</p>
              <p>Upload a PDF above to create your first committed dataset.</p>
            </div>
          )}
        </div>

      </main>

      {/* Pre-Import Summary Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-[#D8DBE0] p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#E7E9EC] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#2F5EFF]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14181F]">Pre-Import Parse Preview</h3>
                  <p className="text-xs text-[#5B6270]">Review extracted figures before saving to Neon Postgres database</p>
                </div>
              </div>
            </div>

            {previewData.warnings && previewData.warnings.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold text-[#E0A72E]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#E0A72E]" />
                  <span>Reconciliation Mismatch Warnings ({previewData.warnings.length})</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-amber-800">
                  Some choice code row counts differ from their stated header CAP seats. Please review below before committing.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E7E9EC]">
                <p className="text-[10px] font-semibold text-[#5B6270] uppercase">Choice Codes</p>
                <p className="text-xl font-bold font-mono text-[#14181F] mt-0.5">{previewData.totalChoiceCodes}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E7E9EC]">
                <p className="text-[10px] font-semibold text-[#5B6270] uppercase">Candidate Rows</p>
                <p className="text-xl font-bold font-mono text-[#14181F] mt-0.5">{previewData.totalCandidates}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-[10px] font-semibold text-emerald-800 uppercase">Filled Seats</p>
                <p className="text-xl font-bold font-mono text-[#1C9A6C] mt-0.5">{previewData.totalFilledSeats}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-[10px] font-semibold text-amber-800 uppercase">Vacant Seats</p>
                <p className="text-xl font-bold font-mono text-[#E0A72E] mt-0.5">{previewData.totalVacantSeats}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#14181F]">Extracted Choice Code Summaries</h4>
              <div className="border border-[#E7E9EC] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F8FA] text-[#5B6270] font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Department</th>
                      <th className="py-2 px-2 text-right">Stated CAP</th>
                      <th className="py-2 px-2 text-right">Filled</th>
                      <th className="py-2 px-2 text-right">Vacant</th>
                      <th className="py-2 px-3">Reconciliation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E9EC] font-mono text-[11px]">
                    {previewData.choiceCodesSummary.map((cc) => (
                      <tr key={cc.code}>
                        <td className="py-2 px-3 font-bold text-[#2F5EFF]">{cc.code}</td>
                        <td className="py-2 px-3 font-sans text-[#14181F] font-semibold">{cc.departmentName}</td>
                        <td className="py-2 px-2 text-right">{cc.capSeats}</td>
                        <td className="py-2 px-2 text-right text-[#1C9A6C] font-bold">{cc.filledSeats}</td>
                        <td className="py-2 px-2 text-right text-[#E0A72E] font-bold">{cc.vacantSeats}</td>
                        <td className="py-2 px-3 font-sans">
                          {cc.reconciled ? (
                            <span className="text-[#1C9A6C] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Reconciled
                            </span>
                          ) : (
                            <span className="text-[#E0A72E] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Mismatch
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E7E9EC] space-y-3">
              <p className="text-xs font-bold text-[#14181F]">Choose Ingestion Action:</p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="commitAction"
                    value="append"
                    checked={commitAction === 'append'}
                    onChange={() => setCommitAction('append')}
                    className="text-[#2F5EFF]"
                  />
                  <span>Append as New Round / Batch</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="commitAction"
                    value="replace"
                    checked={commitAction === 'replace'}
                    onChange={() => setCommitAction('replace')}
                    className="text-[#2F5EFF]"
                  />
                  <span>Replace Existing Round Data</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setPreviewId(null); setPreviewData(null); }}
                className="px-4 py-2 text-xs font-semibold text-[#5B6270] hover:text-[#14181F] bg-[#F7F8FA] border border-[#D8DBE0] rounded-xl transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleCommitUpload}
                disabled={isCommitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#2F5EFF] hover:bg-[#2449D6] rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Committing to Neon DB...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Commit Batch</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function DataManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-semibold text-[#5B6270]">Loading...</div>}>
      <DataManagementContent />
    </Suspense>
  );
}
