import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import OverviewPage from './pages/OverviewPage';
import CandidateListPage from './pages/CandidateListPage';
import DepartmentMatrixPage from './pages/DepartmentMatrixPage';
import DataManagementPage from './pages/DataManagementPage';
import PdfUploaderModal from './components/PdfUploaderModal';
import initialData from './data/initialData';

export default function App() {
  // Data state (defaults to initial sample dataset for immediate demonstration)
  const [data, setData] = useState(initialData);
  const [activePage, setActivePage] = useState('overview'); // 'overview' | 'candidates' | 'departments' | 'data'
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const { metadata, departments = [], records = [] } = data || {};

  // CSV Export
  const handleExportCsv = () => {
    if (records.length === 0) return;

    const headers = [
      'Sr No', 'Merit No', 'Score Type', 'Merit Score', 'Application ID', 
      'Candidate Name', 'Gender', 'Category', 'Choice Code', 'Department', 
      'Raw Seat Type', 'Allotted Seat Type', 'Status Symbol', 'Status Label', 'Is Vacant'
    ];

    const rows = records.map(r => [
      r.sr_no,
      r.merit_no || '',
      r.score_type,
      r.merit_score || '',
      `"${r.application_id}"`,
      `"${r.candidate_name}"`,
      r.gender || '',
      r.candidate_category || '',
      `"${r.choice_code}"`,
      `"${r.department_name}"`,
      `"${r.raw_seat_type}"`,
      `"${r.allotted_seat_type}"`,
      r.status_symbol || '',
      `"${r.status_label}"`,
      r.is_vacant
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Scholaris_CAP_Allotment_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const handleExportJson = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Scholaris_Data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        metadata={metadata}
        onOpenUploader={() => setIsUploaderOpen(true)}
      />

      {/* Right Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <TopHeader
          activePage={activePage}
          metadata={metadata}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
        />

        {/* Dynamic Sub-Page Viewport */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activePage === 'overview' && (
            <OverviewPage
              metadata={metadata}
              departments={departments}
              records={records}
              onNavigateToPage={(page) => setActivePage(page)}
            />
          )}

          {activePage === 'candidates' && (
            <CandidateListPage
              records={records}
              departments={departments}
              onExportCsv={handleExportCsv}
              onExportJson={handleExportJson}
            />
          )}

          {activePage === 'departments' && (
            <DepartmentMatrixPage
              departments={departments}
              records={records}
              onNavigateToCandidates={(choiceCode) => {
                setActivePage('candidates');
              }}
            />
          )}

          {activePage === 'data' && (
            <DataManagementPage
              metadata={metadata}
              onDataLoaded={(parsedData) => {
                setData(parsedData);
                setActivePage('overview');
              }}
              onClearData={() => {
                setData(null);
              }}
              onExportJson={handleExportJson}
            />
          )}
        </main>
      </div>

      {/* PDF Upload Modal */}
      <PdfUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onDataParsed={(newParsedData) => {
          setData(newParsedData);
          setActivePage('overview');
        }}
      />
    </div>
  );
}
