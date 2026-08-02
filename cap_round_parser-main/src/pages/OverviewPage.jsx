import React from 'react';
import { Building, Users, UserCheck, UserX, Layers, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge, { STATUS_CONFIG } from '../components/StatusBadge';

const STATUS_COLORS = {
  'Betterment in Choice Code': '#ffffff',
  'Betterment in Seat Type': '#d4d4d8',
  'No Change': '#a1a1aa',
  'Admitted to Institute': '#71717a',
  'Newly Allotted': '#52525b',
  'Standard / Direct Allotment': '#3f3f46',
  'Vacant Seat': '#27272a',
  'Vacant': '#27272a'
};

const OverviewPage = ({ metadata, departments = [], records = [], onNavigateToPage }) => {
  const { total_sanction_intake = 0, total_filled_seats = 0, total_vacant_seats = 0 } = metadata?.summary || {};
  const fillRate = total_sanction_intake > 0 ? ((total_filled_seats / total_sanction_intake) * 100).toFixed(1) : 0;

  // Status breakdown map for pie chart
  const statusCountsMap = {};
  records.forEach((r) => {
    let lbl = r.is_vacant ? 'Vacant Seat' : (r.status_label || 'Standard / Direct Allotment');
    statusCountsMap[lbl] = (statusCountsMap[lbl] || 0) + 1;
  });

  const pieChartData = Object.entries(statusCountsMap).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] || '#a1a1aa'
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Institute Banner Card */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="p-3.5 rounded-xl bg-white text-black border border-white shrink-0 shadow-lg">
            <Building className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-black bg-white px-2 py-0.5 rounded-md">
                CAP Round II Provisional Allotment
              </span>
              <span className="text-xs text-zinc-400">• Published August 2025</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
              {metadata?.institution_code_name || "06649 - TSSM's Bhivarabai Sawant College of Engineering and Research, Narhe, Pune"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Audit Verified</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Monochrome KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between group border border-zinc-800">
          <div>
            <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Sanctioned Intake</p>
            <p className="text-3xl font-black text-white mt-1.5 font-mono">{total_sanction_intake}</p>
            <p className="text-xs text-zinc-400 mt-1">Across {departments.length} choice codes</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 text-white border border-zinc-700 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between group border border-zinc-800">
          <div>
            <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Total Filled Seats</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-black text-white font-mono">{total_filled_seats}</span>
              <span className="text-xs font-bold text-black bg-white px-2 py-0.5 rounded border border-white font-mono">
                {fillRate}%
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Allotted candidates</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white text-black group-hover:scale-110 transition-transform shadow-md">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between group border border-zinc-800">
          <div>
            <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Total Vacant Seats</p>
            <p className="text-3xl font-black text-zinc-300 mt-1.5 font-mono">{total_vacant_seats}</p>
            <p className="text-xs text-zinc-400 font-semibold mt-1">Action required</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-700 group-hover:scale-110 transition-transform">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between group border border-zinc-800">
          <div>
            <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Choice Codes</p>
            <p className="text-3xl font-black text-white mt-1.5 font-mono">{departments.length}</p>
            <p className="text-xs text-zinc-400 mt-1">Active department blocks</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 text-white border border-zinc-700 group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Status Distribution Widget & Quick Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compact Status Distribution Widget */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-xl border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-white" /> Status Breakdown (*, @, ~, ^, &)
            </h3>
            <span className="text-xs text-zinc-300 font-mono font-bold">{records.length} Total</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Compact Legend Pills */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-800">
            {pieChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-zinc-300 font-medium">{item.name}</span>
                </div>
                <span className="font-mono font-extrabold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Department Seat Stats Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 space-y-4 shadow-xl border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Choice Code Intake vs. Filled Overview</h3>
              <p className="text-xs text-zinc-400">Brief summary of seats filled per department</p>
            </div>
            <button
              onClick={() => onNavigateToPage('departments')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 border border-white transition-all"
            >
              <span>View Full Matrix</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-zinc-400 font-semibold uppercase text-[10.5px] border-b border-zinc-800">
                  <th className="py-2.5 px-3">Choice Code</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-right">Intake</th>
                  <th className="py-2.5 px-3 text-right">Filled</th>
                  <th className="py-2.5 px-3 text-right">Vacant</th>
                  <th className="py-2.5 px-3">Fill Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                {departments.slice(0, 7).map((d) => {
                  const fillRate = d.sanction_intake > 0 ? ((d.total_filled_seats / d.sanction_intake) * 100).toFixed(0) : 0;
                  return (
                    <tr key={d.choice_code} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white">{d.choice_code}</td>
                      <td className="py-3 px-3 font-semibold text-zinc-100">{d.department_name}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{d.sanction_intake}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">{d.total_filled_seats}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-400">{d.total_vacant_seats}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-white">{fillRate}%</span>
                          <div className="w-16 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                            <div className="h-full bg-gradient-to-r from-white to-zinc-400 rounded-full" style={{ width: `${Math.min(100, fillRate)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;

