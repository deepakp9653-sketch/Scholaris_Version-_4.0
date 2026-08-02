import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Layers } from 'lucide-react';

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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950 border border-zinc-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsCharts = ({ departments, records }) => {
  const [activeTab, setActiveTab] = useState('dept-intake');

  // Format department data for bar chart
  const deptChartData = departments.map((d) => ({
    name: d.choice_code.replace('06649', ''),
    fullCode: d.choice_code,
    deptName: d.department_name,
    intake: d.sanction_intake,
    filled: d.total_filled_seats,
    vacant: d.total_vacant_seats,
  }));

  // Status breakdown data for Pie Chart
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

  // Score type breakdown
  const scoreTypeCounts = { 'MHT-CET': 0, 'JEE(Main)': 0 };
  records.forEach(r => {
    if (!r.is_vacant && r.score_type) {
      scoreTypeCounts[r.score_type] = (scoreTypeCounts[r.score_type] || 0) + 1;
    }
  });
  const scoreTypeData = Object.entries(scoreTypeCounts).map(([name, value]) => ({
    name,
    value,
    color: name === 'JEE(Main)' ? '#ffffff' : '#71717a'
  }));

  return (
    <div className="glass-panel rounded-2xl p-5 border border-zinc-800 space-y-4 shadow-2xl">
      {/* Chart Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white text-black border border-white">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Department Seat Analytics & Status Breakdown</h2>
            <p className="text-xs text-zinc-400">Visual intake metrics and status distribution</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('dept-intake')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'dept-intake'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Choice Code Intake</span>
          </button>

          <button
            onClick={() => setActiveTab('status-pie')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'status-pie'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Status Distribution</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Department Intake vs Filled Bar Chart */}
      {activeTab === 'dept-intake' && (
        <div className="space-y-2">
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#a1a1aa" 
                  fontSize={11} 
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#fff' }} />
                <Bar dataKey="intake" name="Sanction Intake" fill="#ffffff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="filled" name="Filled Seats" fill="#a1a1aa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vacant" name="Vacant Seats" fill="#3f3f46" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-zinc-500 text-center italic">
            Note: Choice code labels display abbreviated suffixes (e.g. 19110 = Civil, 24510 = Computer, [EWS] / 11T = TFWS).
          </p>
        </div>
      )}

      {/* Tab 2: Allotment Status Donut / Pie Chart & Exam Distribution */}
      {activeTab === 'status-pie' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-2">
          {/* Donut Chart: Status Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 text-center">Seat Allotment Status Distribution</h3>
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-[10.5px]">
              {pieChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium">{item.name}:</span>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart: Exam Score Type Breakdown */}
          <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <h3 className="text-xs font-semibold text-slate-300 text-center">Exam Entrance Type (MHT-CET vs JEE Main)</h3>
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {scoreTypeData.map((entry, index) => (
                      <Cell key={`cell-score-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-[11px]">
              {scoreTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1 rounded border border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium">{item.name}:</span>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
