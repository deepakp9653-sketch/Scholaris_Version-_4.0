import React from 'react';
import { Building2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const ErpChoiceCodeTable = ({ departments, selectedChoiceCode, onSelectChoiceCode }) => {
  const totalIntake = departments.reduce((acc, d) => acc + d.sanction_intake, 0);
  const totalFilled = departments.reduce((acc, d) => acc + d.total_filled_seats, 0);
  const totalVacant = departments.reduce((acc, d) => acc + d.total_vacant_seats, 0);

  return (
    <div className="bg-white border border-zinc-300 rounded-xl overflow-hidden shadow-xs space-y-0">
      {/* ERP Header Bar */}
      <div className="px-5 py-3.5 bg-zinc-100 border-b border-zinc-300 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-black text-white">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-black tracking-wide font-mono">DEPARTMENT CHOICE CODE MASTER MATRIX</h2>
            <p className="text-[11.5px] text-zinc-600 font-bold">Sanctioned Intake, Filled Seats, Vacant Seats & Status Breakdown per Choice Code</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 rounded bg-white border border-zinc-300 font-mono text-zinc-900 font-bold shadow-xs">
            Total Intake: <strong className="text-black">{totalIntake}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-black text-white font-mono font-bold">
            Filled: {totalFilled}
          </span>
          <span className="px-2.5 py-1 rounded bg-zinc-200 text-black border border-zinc-300 font-mono font-bold">
            Vacant: {totalVacant}
          </span>
        </div>
      </div>

      {/* Choice Code Master Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="bg-zinc-100 text-black font-black border-b border-zinc-300 uppercase tracking-wider text-[10.5px]">
              <th className="py-3 px-4">Choice Code</th>
              <th className="py-3 px-4">Department Name</th>
              <th className="py-3 px-3 text-right">Sanction Intake</th>
              <th className="py-3 px-3 text-right">CAP Seats</th>
              <th className="py-3 px-3 text-right">MS Seats</th>
              <th className="py-3 px-3 text-right">AI Seats</th>
              <th className="py-3 px-3 text-right">Filled Seats</th>
              <th className="py-3 px-3 text-right">Vacant Seats</th>
              <th className="py-3 px-4">Occupancy Rate</th>
              <th className="py-3 px-4">Status Symbol Breakdown</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200 text-zinc-900">
            {departments.map((d) => {
              const isSelected = selectedChoiceCode === d.choice_code;
              const fillRate = d.sanction_intake > 0 ? ((d.total_filled_seats / d.sanction_intake) * 100).toFixed(1) : 0;
              const isEwsOrTfws = d.choice_code.includes('[EWS]') || d.choice_code.endsWith('T');

              return (
                <tr
                  key={d.choice_code}
                  className={`hover:bg-zinc-50 transition-colors ${
                    isSelected ? 'bg-zinc-100 border-l-4 border-l-black font-bold' : ''
                  }`}
                >
                  {/* Choice Code */}
                  <td className="py-3 px-4 font-mono font-black text-black">
                    <div className="flex items-center gap-1.5">
                      <span>{d.choice_code}</span>
                      {isEwsOrTfws && (
                        <span className="px-1.5 py-0.2 text-[9.5px] font-extrabold rounded bg-black text-white uppercase">
                          {d.choice_code.includes('[EWS]') ? 'EWS' : 'TFWS'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Department Name */}
                  <td className="py-3 px-4 font-black text-black">
                    {d.department_name}
                  </td>

                  {/* Sanction Intake */}
                  <td className="py-3 px-3 text-right font-mono font-black text-black">
                    {d.sanction_intake}
                  </td>

                  {/* CAP Seats */}
                  <td className="py-3 px-3 text-right font-mono text-zinc-700 font-bold">
                    {d.cap_seats}
                  </td>

                  {/* MS Seats */}
                  <td className="py-3 px-3 text-right font-mono text-zinc-700 font-bold">
                    {d.ms_seats}
                  </td>

                  {/* AI Seats */}
                  <td className="py-3 px-3 text-right font-mono text-zinc-700 font-bold">
                    {d.ai_seats}
                  </td>

                  {/* Filled Seats */}
                  <td className="py-3 px-3 text-right font-mono font-black text-black">
                    {d.total_filled_seats}
                  </td>

                  {/* Vacant Seats */}
                  <td className="py-3 px-3 text-right font-mono font-black">
                    <span className={`px-2 py-0.5 rounded ${
                      d.total_vacant_seats === 0
                        ? 'text-zinc-500 bg-zinc-100'
                        : 'text-black bg-zinc-200 font-extrabold border border-zinc-300'
                    }`}>
                      {d.total_vacant_seats}
                    </span>
                  </td>

                  {/* Occupancy Rate Bar */}
                  <td className="py-3 px-4 min-w-[130px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10.5px] font-mono font-bold">
                        <span className="text-black">{fillRate}%</span>
                        {d.total_vacant_seats === 0 ? (
                          <span className="text-black font-black flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Full
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Open
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden border border-zinc-300">
                        <div
                          className="h-full bg-black rounded-full"
                          style={{ width: `${Math.min(100, fillRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status Breakdown Pills */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] font-mono font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-black border border-zinc-300" title="Betterment in Choice Code">
                        * {d.status_breakdown["Betterment in Choice Code"] || 0}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-black border border-zinc-300" title="Betterment in Seat Type">
                        @ {d.status_breakdown["Betterment in Seat Type"] || 0}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-black border border-zinc-300" title="No Change">
                        ~ {d.status_breakdown["No Change"] || 0}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white" title="Admitted">
                        ^ {d.status_breakdown["Admitted to Institute"] || 0}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-black text-amber-300 font-black" title="Newly Allotted">
                        & {d.status_breakdown["Newly Allotted"] || 0}
                      </span>
                    </div>
                  </td>

                  {/* Filter Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onSelectChoiceCode(isSelected ? 'ALL' : d.choice_code)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                        isSelected
                          ? 'bg-black text-white shadow-xs'
                          : 'bg-white text-black hover:bg-zinc-100 border border-zinc-300 shadow-xs'
                      }`}
                    >
                      <span>{isSelected ? 'Active' : 'Filter'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ErpChoiceCodeTable;
