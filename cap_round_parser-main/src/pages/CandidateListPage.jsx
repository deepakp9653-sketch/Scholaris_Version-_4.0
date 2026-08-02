import React, { useState, useMemo } from 'react';
import FilterToolbar from '../components/FilterToolbar';
import CandidateTable from '../components/CandidateTable';
import { Users } from 'lucide-react';

const CandidateListPage = ({ records = [], departments = [], onExportCsv, onExportJson }) => {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedScoreType, setSelectedScoreType] = useState('ALL');

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (r.allotted_seat_type && !r.is_vacant) set.add(r.allotted_seat_type);
    });
    return Array.from(set).sort();
  }, [records]);

  const statusList = [
    'Betterment in Choice Code',
    'Betterment in Seat Type',
    'No Change',
    'Admitted to Institute',
    'Newly Allotted',
    'Standard / Direct Allotment',
    'Vacant'
  ];

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((row) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesAppId = row.application_id && row.application_id.toLowerCase().includes(q);
        const matchesName = row.candidate_name && row.candidate_name.toLowerCase().includes(q);
        const matchesSeat = row.raw_seat_type && row.raw_seat_type.toLowerCase().includes(q);
        if (!matchesAppId && !matchesName && !matchesSeat) return false;
      }

      if (selectedDepartment !== 'ALL' && row.choice_code !== selectedDepartment) return false;

      if (selectedStatus !== 'ALL') {
        const rowStatus = row.is_vacant ? 'Vacant' : (row.status_label || 'Standard / Direct Allotment');
        if (rowStatus !== selectedStatus) return false;
      }

      if (selectedCategory !== 'ALL' && row.allotted_seat_type !== selectedCategory) return false;
      if (selectedGender !== 'ALL' && row.gender !== selectedGender) return false;
      if (selectedScoreType !== 'ALL' && row.score_type !== selectedScoreType) return false;

      return true;
    });
  }, [records, searchQuery, selectedDepartment, selectedStatus, selectedCategory, selectedGender, selectedScoreType]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('ALL');
    setSelectedStatus('ALL');
    setSelectedCategory('ALL');
    setSelectedGender('ALL');
    setSelectedScoreType('ALL');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Streamlined Filter Toolbar */}
      <FilterToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedGender={selectedGender}
        setSelectedGender={setSelectedGender}
        selectedScoreType={selectedScoreType}
        setSelectedScoreType={setSelectedScoreType}
        departmentsList={departments}
        categoriesList={categoriesList}
        statusList={statusList}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredRecords.length}
        totalRecordsCount={records.length}
      />

      {/* Candidate Data Table */}
      <CandidateTable
        records={filteredRecords}
        searchQuery={searchQuery}
      />
    </div>
  );
};

export default CandidateListPage;
