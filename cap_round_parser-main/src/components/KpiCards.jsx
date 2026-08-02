import React from 'react';
import { Building, Users, UserCheck, UserX, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { STATUS_CONFIG } from './StatusBadge';

const KpiCards = ({ summary, departmentsCount, statusCounts, activeStatusFilter, onStatusFilterClick, institutionName }) => {
  const { total_sanction_intake = 0, total_filled_seats = 0, total_vacant_seats = 0 } = summary || {};
  const fillRate = total_sanction_intake > 0 ? ((total_filled_seats / total_sanction_intake) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      {/* Institutional Audit Banner */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden border border-zinc-800">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 rounded-xl bg-white text-black shrink-0 shadow-lg">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-black bg-white px-2 py-0.5 rounded-md">
                Institutional Audit
              </span>
              <span className="text-xs text-zinc-400">• Official CAP Allotment Data</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug" title={institutionName}>
              {institutionName || "06649 - TSSM's Bhivarabai Sawant College of Engineering and Research, Narhe, Pune"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white flex items-center gap-2 shadow-lg">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>CAP Round Allotment Verified</span>
          </div>
        </div>
      </div>

      {/* 4 Monochrome Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sanctioned Intake */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between group border border-zinc-800">
          <div>
            <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">Sanctioned Intake</p>
            <p className="text-3xl font-black text-white mt-1.5 font-mono tracking-tight">{total_sanction_intake}</p>
            <p className="text-xs text-zinc-400 font-medium mt-1">Across {departmentsCount} choice codes</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 text-white border border-zinc-700 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Filled Seats */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between group border border-zinc-800">
          <div>
            <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">Filled Seats</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-3xl font-black text-white font-mono tracking-tight">{total_filled_seats}</span>
              <span className="text-xs font-bold text-black bg-white px-2 py-0.5 rounded-md font-mono">
                {fillRate}%
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">Candidates allotted</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white text-black group-hover:scale-110 transition-transform shadow-md">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Vacant Seats */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between group border border-zinc-800">
          <div>
            <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">Vacant Seats</p>
            <p className="text-3xl font-black text-zinc-300 mt-1.5 font-mono tracking-tight">{total_vacant_seats}</p>
            <p className="text-xs text-zinc-400 font-semibold mt-1">Unfilled seat rows</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-700 group-hover:scale-110 transition-transform">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        {/* Choice Codes Count */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between group border border-zinc-800">
          <div>
            <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">Choice Codes</p>
            <p className="text-3xl font-black text-white mt-1.5 font-mono tracking-tight">{departmentsCount}</p>
            <p className="text-xs text-zinc-400 font-medium mt-1">Active departments</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900 text-white border border-zinc-700 group-hover:scale-110 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Symbol Filter Strip */}
      <div className="glass-panel rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap text-xs shadow-lg border border-zinc-800">
        <span className="text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-white" /> Filter by Status Symbol:
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = statusCounts[config.label] || statusCounts[key] || 0;
            const isActive = activeStatusFilter === config.label || activeStatusFilter === key;

            return (
              <button
                key={key}
                onClick={() => onStatusFilterClick(config.label)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-white text-black border-white shadow-md shadow-white/20' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {config.symbol && <span className="font-mono font-black">{config.symbol}</span>}
                <span>{config.shortLabel}</span>
                <span className={`ml-1 text-[10.5px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                  isActive ? 'bg-black text-white border-black' : 'bg-black text-zinc-200 border-zinc-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KpiCards;

