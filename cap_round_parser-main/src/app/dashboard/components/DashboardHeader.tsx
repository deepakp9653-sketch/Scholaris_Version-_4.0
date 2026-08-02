'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, FileUp } from 'lucide-react';

interface DashboardHeaderProps {
  activeTab: 'overview' | 'departments' | 'candidates' | 'data';
  onBatchChange?: (batchId: string) => void;
  instituteCode?: string;
  instituteName?: string;
}

export default function DashboardHeader({
  activeTab,
  onBatchChange,
  instituteCode = "06649",
  instituteName = "TSSM's Bhivarabai Sawant College of Engineering and Research, Narhe, Pune"
}: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBatchIdParam = searchParams?.get('batchId') || null;

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(currentBatchIdParam || '');

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/uploads');
      const json = await res.json();
      if (json.batches && json.batches.length > 0) {
        setBatches(json.batches);

        let activeId: string = currentBatchIdParam || '';
        if (!activeId) {
          activeId = (typeof window !== 'undefined' ? localStorage.getItem('scholaris_active_batch_id') : '') || '';
        }
        if (!activeId || !json.batches.some((b: any) => b.id === activeId)) {
          activeId = json.batches[0].id;
        }

        setSelectedBatchId(activeId);
        if (typeof window !== 'undefined') {
          localStorage.setItem('scholaris_active_batch_id', activeId);
        }

        if (!currentBatchIdParam && activeId) {
          router.replace(`?batchId=${activeId}`);
        }
      }
    } catch (e) {
      console.error("Failed to fetch batches:", e);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (currentBatchIdParam && currentBatchIdParam !== selectedBatchId) {
      setSelectedBatchId(currentBatchIdParam);
      if (typeof window !== 'undefined') {
        localStorage.setItem('scholaris_active_batch_id', currentBatchIdParam);
      }
    }
  }, [currentBatchIdParam]);

  const handleSelectBatch = (bId: string) => {
    setSelectedBatchId(bId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('scholaris_active_batch_id', bId);
    }

    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('batchId', bId);
    router.push(`?${params.toString()}`);

    if (onBatchChange) {
      onBatchChange(bId);
    }
  };

  const getTabHref = (path: string) => {
    if (selectedBatchId) {
      return `${path}?batchId=${selectedBatchId}`;
    }
    return path;
  };

  const activeBatchObj = batches.find(b => b.id === selectedBatchId);
  const displayInstName = activeBatchObj?.institute?.name || instituteName;
  const displayInstCode = activeBatchObj?.institute?.code || instituteCode;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E7E9EC] px-6 sm:px-8 py-3.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#2F5EFF] flex items-center justify-center text-white font-bold shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#14181F] leading-tight">
              {displayInstName}
            </h1>
            <p className="text-[11px] text-[#5B6270]">
              Institute Code: <strong className="font-mono text-[#14181F]">{displayInstCode}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {batches.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedBatchId}
                onChange={(e) => handleSelectBatch(e.target.value)}
                className="bg-[#F7F8FA] border border-[#D8DBE0] text-xs font-semibold text-[#14181F] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#2F5EFF] shadow-2xs max-w-[320px] truncate"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.roundLabel} ({new Date(b.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            href={getTabHref('/dashboard/data')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2F5EFF] bg-[#2F5EFF]/10 hover:bg-[#2F5EFF]/20 border border-[#2F5EFF]/20 rounded-lg transition-all"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </Link>

          <nav className="flex items-center gap-1 bg-[#F7F8FA] p-1 rounded-lg border border-[#E7E9EC] text-xs font-semibold">
            <Link
              href={getTabHref('/dashboard')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-[#2F5EFF] shadow-2xs'
                  : 'text-[#5B6270] hover:text-[#14181F]'
              }`}
            >
              Overview
            </Link>

            <Link
              href={getTabHref('/dashboard/departments')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'departments'
                  ? 'bg-white text-[#2F5EFF] shadow-2xs'
                  : 'text-[#5B6270] hover:text-[#14181F]'
              }`}
            >
              Departments
            </Link>

            <Link
              href={getTabHref('/dashboard/candidates')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'candidates'
                  ? 'bg-white text-[#2F5EFF] shadow-2xs'
                  : 'text-[#5B6270] hover:text-[#14181F]'
              }`}
            >
              Candidates
            </Link>

            <Link
              href={getTabHref('/dashboard/data')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'data'
                  ? 'bg-white text-[#2F5EFF] shadow-2xs'
                  : 'text-[#5B6270] hover:text-[#14181F]'
              }`}
            >
              Data & Upload
            </Link>
          </nav>
        </div>

      </div>
    </header>
  );
}
