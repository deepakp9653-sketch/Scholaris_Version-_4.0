'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardHeader from './components/DashboardHeader';
import { 
  Building2, 
  Users, 
  UserCheck, 
  UserX, 
  Layers, 
  ArrowRight, 
  FileUp, 
  RefreshCw, 
  FolderOpen
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface OverviewData {
  hasData: boolean;
  batch?: {
    id: string;
    roundLabel: string;
    publishedOn: string;
    sourceFilename: string;
    instituteCode: string;
    instituteName: string;
  };
  headlineStats?: {
    totalSanctionIntake: number;
    totalCapSeats: number;
    totalFilledSeats: number;
    totalVacantSeats: number;
    fillRate: number;
    totalChoiceCodes: number;
    totalDepartments: number;
  };
  statusCounts?: Record<string, number>;
  departmentSummaries?: Array<{
    id: string;
    name: string;
    intake: number;
    capSeats: number;
    filled: number;
    vacant: number;
    fillRate: number;
    choiceCodesCount: number;
  }>;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  'Admitted to Institute': '#2F5EFF',
  'Newly Allotted': '#1C9A6C',
  'No Change': '#8A909C',
  'Betterment in Choice Code': '#16A394',
  'Betterment in Seat Type': '#6C63FF',
  'Vacant Seat': '#E0A72E',
  'Standard Allotment': '#6366F1'
};

function OverviewContent() {
  const searchParams = useSearchParams();
  const batchIdParam = searchParams?.get('batchId') || null;

  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = async (bId?: string) => {
    setIsLoading(true);
    try {
      const activeId = bId || batchIdParam || (typeof window !== 'undefined' ? localStorage.getItem('scholaris_active_batch_id') : '') || '';
      const url = activeId ? `/api/dashboard/overview?batchId=${activeId}` : '/api/dashboard/overview';
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to load overview data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(batchIdParam || undefined);
  }, [batchIdParam]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <DashboardHeader activeTab="overview" />
        <div className="flex items-center justify-center p-16 text-sm font-semibold text-[#5B6270]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#2F5EFF] mr-2" />
          <span>Loading Overview Data...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-[#14181F]">
        <DashboardHeader activeTab="overview" />
        <div className="max-w-md mx-auto mt-16 bg-white border border-[#D8DBE0] rounded-2xl p-8 text-center space-y-6 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#2F5EFF]/10 text-[#2F5EFF] flex items-center justify-center mx-auto">
            <FileUp className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#14181F]">No Allotment Data Uploaded</h2>
            <p className="text-xs text-[#5B6270] leading-relaxed">
              Upload an official MHT-CET Provisional Allotment PDF to parse candidate records and populate the executive seat dashboard.
            </p>
          </div>

          <Link
            href="/dashboard/data"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-5 text-xs font-semibold text-white bg-[#2F5EFF] hover:bg-[#2449D6] rounded-lg transition-all shadow-xs w-full"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Go to Upload & Data Management</span>
          </Link>
        </div>
      </div>
    );
  }

  const { headlineStats, batch, statusCounts = {}, departmentSummaries = [] } = data;

  const donutData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    color: STATUS_CHART_COLORS[name] || '#8A909C'
  }));

  const barChartData = departmentSummaries.map(d => ({
    name: d.name.length > 18 ? d.name.substring(0, 16) + '...' : d.name,
    fullName: d.name,
    Filled: d.filled,
    Vacant: d.vacant,
    capSeats: d.capSeats
  }));

  const activeBatchId = batch?.id || batchIdParam || '';

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#14181F] font-sans pb-12">
      <DashboardHeader
        activeTab="overview"
        onBatchChange={(newId) => fetchOverview(newId)}
        instituteCode={batch?.instituteCode}
        instituteName={batch?.instituteName}
      />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-8 space-y-6">
        
        {/* Row 1: 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-[#E7E9EC] rounded-2xl p-5 shadow-2xs space-y-2">
            <p className="text-xs font-semibold text-[#5B6270] uppercase tracking-wider">Sanctioned Intake</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-[#14181F] font-mono tracking-tight">
                {headlineStats?.totalSanctionIntake}
              </span>
              <div className="p-2 rounded-lg bg-[#F7F8FA] text-[#5B6270] border border-[#E7E9EC]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-[#5B6270]">Across {headlineStats?.totalChoiceCodes} choice codes</p>
          </div>

          <div className="bg-white border border-[#E7E9EC] rounded-2xl p-5 shadow-2xs space-y-2">
            <p className="text-xs font-semibold text-[#5B6270] uppercase tracking-wider">Total Filled Seats</p>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-[#1C9A6C] font-mono tracking-tight">
                  {headlineStats?.totalFilledSeats}
                </span>
                <span className="text-xs font-semibold text-[#1C9A6C] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {headlineStats?.fillRate}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-[#1C9A6C] border border-emerald-200">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-[#5B6270]">Allotted candidates</p>
          </div>

          <div className="bg-white border border-[#E7E9EC] rounded-2xl p-5 shadow-2xs space-y-2">
            <p className="text-xs font-semibold text-[#5B6270] uppercase tracking-wider">Total Vacant Seats</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-[#E0A72E] font-mono tracking-tight">
                {headlineStats?.totalVacantSeats}
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-[#E0A72E] border border-amber-200">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-[#E0A72E] font-medium">Unfilled seat rows</p>
          </div>

          <div className="bg-white border border-[#E7E9EC] rounded-2xl p-5 shadow-2xs space-y-2">
            <p className="text-xs font-semibold text-[#5B6270] uppercase tracking-wider">Departments</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-[#2F5EFF] font-mono tracking-tight">
                {headlineStats?.totalDepartments}
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-[#2F5EFF] border border-blue-200">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-[#5B6270]">Parent academic disciplines</p>
          </div>
        </div>

        {/* Row 2: 2 Charts Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-[#E7E9EC] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E9EC] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#14181F]">Status Breakdown</h3>
                <p className="text-xs text-[#5B6270]">Distribution across legend symbols (* @ ~ ^ &)</p>
              </div>
            </div>

            <div className="h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#D8DBE0', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono text-[#14181F]">{headlineStats?.totalFilledSeats}</span>
                <span className="text-[10px] text-[#5B6270] font-semibold uppercase">Candidates</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7E9EC]">
              {donutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[#5B6270] truncate text-[11.5px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-[#14181F] ml-1">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E7E9EC] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E9EC] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#14181F]">Seats by Department</h3>
                <p className="text-xs text-[#5B6270]">Filled vs. Vacant seats rolled up per parent department</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E9EC" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5B6270' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#5B6270' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#D8DBE0', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Filled" fill="#1C9A6C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Vacant" fill="#E0A72E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Department Summary Table */}
        <div className="bg-white border border-[#E7E9EC] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E9EC] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#14181F]">Department Seat Matrix Summary</h3>
              <p className="text-xs text-[#5B6270]">Overview of seat capacity, occupancy, and fill rates</p>
            </div>

            <Link
              href={`/dashboard/departments?batchId=${activeBatchId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F5EFF] hover:text-[#2449D6]"
            >
              <span>View full choice code matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] text-[#5B6270] font-semibold border-b border-[#E7E9EC] text-[11px] uppercase">
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-3 text-right">Sanction Intake</th>
                  <th className="py-3 px-3 text-right">CAP Seats</th>
                  <th className="py-3 px-3 text-right">Filled</th>
                  <th className="py-3 px-3 text-right">Vacant</th>
                  <th className="py-3 px-4">Fill Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9EC] text-[#14181F]">
                {departmentSummaries.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#14181F]">
                      <div className="flex items-center gap-2">
                        <span>{d.name}</span>
                        <span className="text-[10px] font-mono text-[#5B6270] bg-[#F7F8FA] border border-[#E7E9EC] px-1.5 py-0.2 rounded">
                          {d.choiceCodesCount} codes
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold">{d.intake}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-[#5B6270]">{d.capSeats}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-[#1C9A6C]">{d.filled}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        d.vacant === 0 ? 'text-[#8A909C] bg-[#F7F8FA]' : 'text-[#E0A72E] bg-amber-50 font-bold'
                      }`}>
                        {d.vacant}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#14181F] w-12">{d.fillRate}%</span>
                        <div className="flex-1 h-2 bg-[#E7E9EC] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              d.fillRate >= 100 ? 'bg-[#1C9A6C]' : d.fillRate > 75 ? 'bg-[#2F5EFF]' : 'bg-[#E0A72E]'
                            }`}
                            style={{ width: `${Math.min(100, d.fillRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function DashboardOverviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-semibold text-[#5B6270]">Loading...</div>}>
      <OverviewContent />
    </Suspense>
  );
}
