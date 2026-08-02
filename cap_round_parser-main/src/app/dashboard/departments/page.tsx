'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardHeader from '../components/DashboardHeader';
import { Building2, Filter, RefreshCw } from 'lucide-react';

interface ChoiceCodeItem {
  id: string;
  code: string;
  departmentName: string;
  variant: string;
  statusLabel: string;
  sanctionIntake: number;
  capSeats: number;
  msSeats: number;
  minoritySeats: number;
  aiSeats: number;
  instituteSeats: number;
  filledSeats: number;
  vacantSeats: number;
  fillRate: number;
}

function DepartmentsContent() {
  const searchParams = useSearchParams();
  const batchIdParam = searchParams?.get('batchId') || null;

  const [choiceCodes, setChoiceCodes] = useState<ChoiceCodeItem[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchChoiceCodes = async (bId?: string) => {
    setIsLoading(true);
    try {
      const activeId = bId || batchIdParam || (typeof window !== 'undefined' ? localStorage.getItem('scholaris_active_batch_id') : '') || '';
      const url = activeId ? `/api/departments?batchId=${activeId}` : '/api/departments';
      const res = await fetch(url);
      const data = await res.json();
      if (data.choiceCodes) {
        setChoiceCodes(data.choiceCodes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChoiceCodes(batchIdParam || undefined);
  }, [batchIdParam]);

  const departmentsList = Array.from(new Set(choiceCodes.map(c => c.departmentName))).sort();

  const filteredChoiceCodes = selectedDept === 'ALL'
    ? choiceCodes
    : choiceCodes.filter(c => c.departmentName === selectedDept);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#14181F] font-sans pb-12">
      <DashboardHeader
        activeTab="departments"
        onBatchChange={(newId) => fetchChoiceCodes(newId)}
      />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-8 space-y-6">
        
        {/* Filter Card */}
        <div className="bg-white border border-[#E7E9EC] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#2F5EFF]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#14181F]">Filter by Department</h2>
              <p className="text-xs text-[#5B6270]">Showing {filteredChoiceCodes.length} choice code variants</p>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-[260px]">
            <Filter className="w-4 h-4 text-[#5B6270]" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-[#F7F8FA] border border-[#D8DBE0] text-xs font-semibold text-[#14181F] px-3 py-2 rounded-lg focus:outline-none focus:border-[#2F5EFF]"
            >
              <option value="ALL">All Departments ({departmentsList.length})</option>
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Master Table */}
        <div className="bg-white border border-[#E7E9EC] rounded-2xl overflow-hidden shadow-2xs">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-semibold text-[#5B6270] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2F5EFF]" />
              <span>Loading Choice Codes...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] text-[#5B6270] font-semibold border-b border-[#E7E9EC] text-[11px] uppercase">
                    <th className="py-3.5 px-4">Choice Code</th>
                    <th className="py-3.5 px-4">Department Name</th>
                    <th className="py-3.5 px-3 text-right">Sanction Intake</th>
                    <th className="py-3.5 px-3 text-right">CAP Seats</th>
                    <th className="py-3.5 px-3 text-right">MS Seats</th>
                    <th className="py-3.5 px-3 text-right">AI Seats</th>
                    <th className="py-3.5 px-3 text-right">Filled</th>
                    <th className="py-3.5 px-3 text-right">Vacant</th>
                    <th className="py-3.5 px-4">Fill Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E9EC] text-[#14181F]">
                  {filteredChoiceCodes.map((cc) => (
                    <tr key={cc.id} className="hover:bg-[#F7F8FA] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#2F5EFF]">
                        <div className="flex items-center gap-1.5">
                          <span>{cc.code}</span>
                          {cc.variant !== 'GENERAL' && (
                            <span className="px-1.5 py-0.2 text-[9.5px] font-bold rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                              {cc.variant}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#14181F]">{cc.departmentName}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold">{cc.sanctionIntake}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-[#5B6270]">{cc.capSeats}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-[#5B6270]">{cc.msSeats}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-[#5B6270]">{cc.aiSeats}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#1C9A6C]">{cc.filledSeats}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          cc.vacantSeats === 0 ? 'text-[#8A909C] bg-[#F7F8FA]' : 'text-[#E0A72E] bg-amber-50'
                        }`}>
                          {cc.vacantSeats}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#14181F] w-12">{cc.fillRate}%</span>
                          <div className="flex-1 h-2 bg-[#E7E9EC] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cc.fillRate >= 100 ? 'bg-[#1C9A6C]' : cc.fillRate > 75 ? 'bg-[#2F5EFF]' : 'bg-[#E0A72E]'
                              }`}
                              style={{ width: `${Math.min(100, cc.fillRate)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-semibold text-[#5B6270]">Loading...</div>}>
      <DepartmentsContent />
    </Suspense>
  );
}
