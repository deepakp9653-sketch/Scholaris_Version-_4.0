import React, { useState } from 'react';
import ErpChoiceCodeTable from '../components/ErpChoiceCodeTable';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { Building2, Layers, Filter } from 'lucide-react';

const DepartmentMatrixPage = ({ departments = [], records = [], onNavigateToCandidates }) => {
  const [selectedChoiceCode, setSelectedChoiceCode] = useState('ALL');

  const filteredDepts = selectedChoiceCode === 'ALL' 
    ? departments 
    : departments.filter(d => d.choice_code === selectedChoiceCode);

  const filteredRecords = selectedChoiceCode === 'ALL'
    ? records
    : records.filter(r => r.choice_code === selectedChoiceCode);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls: Department Filter Dropdown */}
      <div className="erp-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Select Choice Code / Department</h2>
            <p className="text-xs text-slate-400">Filter deep-dive analytics by specific choice code</p>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-[240px]">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedChoiceCode}
            onChange={(e) => setSelectedChoiceCode(e.target.value)}
            className="w-full bg-slate-900 text-slate-100 text-xs font-semibold rounded-xl border border-slate-700/80 px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Choice Codes ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.choice_code} value={d.choice_code}>
                {d.choice_code} — {d.department_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Choice Code Master Matrix Table */}
      <ErpChoiceCodeTable
        departments={filteredDepts}
        selectedChoiceCode={selectedChoiceCode}
        onSelectChoiceCode={(code) => {
          setSelectedChoiceCode(code);
          if (onNavigateToCandidates) onNavigateToCandidates(code);
        }}
      />

      {/* Visual Charts */}
      <AnalyticsCharts
        departments={filteredDepts}
        records={filteredRecords}
      />
    </div>
  );
};

export default DepartmentMatrixPage;
