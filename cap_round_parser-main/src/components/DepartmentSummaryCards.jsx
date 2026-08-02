import React, { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const DepartmentSummaryCards = ({ departments, selectedChoiceCode, onSelectChoiceCode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter or show all
  const displayedDepts = isExpanded ? departments : departments.slice(0, 6);

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Department Choice Code Breakdown</h2>
            <p className="text-xs text-slate-400">Intake, filled, vacant, and status breakdown per choice code</p>
          </div>
        </div>

        {departments.length > 6 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-950 rounded-lg border border-blue-800/60 transition-all"
          >
            <span>{isExpanded ? 'Show Fewer' : `View All (${departments.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedDepts.map((d) => {
          const isSelected = selectedChoiceCode === d.choice_code;
          const fillRate = d.sanction_intake > 0 ? ((d.total_filled_seats / d.sanction_intake) * 100).toFixed(0) : 0;
          
          return (
            <div
              key={d.choice_code}
              onClick={() => onSelectChoiceCode(isSelected ? 'ALL' : d.choice_code)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 border-white ring-2 ring-white/30 shadow-2xl'
                  : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-white block">{d.choice_code}</span>
                  <h3 className="text-xs font-bold text-zinc-100 mt-0.5 line-clamp-1" title={d.department_name}>
                    {d.department_name}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  d.total_vacant_seats === 0
                    ? 'bg-white text-black border border-white'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }`}>
                  {d.total_vacant_seats === 0 ? 'Fully Allotted' : `${d.total_vacant_seats} Vacant`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-zinc-300">
                  <span>Intake: {d.sanction_intake}</span>
                  <span>Filled: {d.total_filled_seats} ({fillRate}%)</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full bg-gradient-to-r from-white to-zinc-400 rounded-full"
                    style={{ width: `${Math.min(100, fillRate)}%` }}
                  />
                </div>
              </div>

              {/* Status Breakdown Pills */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-1 text-[10.5px] text-zinc-400 flex-wrap">
                <span className="text-white font-bold" title="Betterment in Choice Code">
                  * {d.status_breakdown["Betterment in Choice Code"] || 0}
                </span>
                <span className="text-zinc-300 font-bold" title="Betterment in Seat Type">
                  @ {d.status_breakdown["Betterment in Seat Type"] || 0}
                </span>
                <span className="text-zinc-400 font-bold" title="No Change">
                  ~ {d.status_breakdown["No Change"] || 0}
                </span>
                <span className="text-zinc-200 font-bold" title="Admitted">
                  ^ {d.status_breakdown["Admitted to Institute"] || 0}
                </span>
                <span className="text-white font-bold" title="Newly Allotted">
                  & {d.status_breakdown["Newly Allotted"] || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentSummaryCards;
