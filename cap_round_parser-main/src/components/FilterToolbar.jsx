import React from 'react';
import { Search, Filter, RotateCcw, Building, Tag, UserCheck, SlidersHorizontal, X } from 'lucide-react';

const FilterToolbar = ({
  searchQuery,
  setSearchQuery,
  selectedDepartment,
  setSelectedDepartment,
  selectedStatus,
  setSelectedStatus,
  selectedCategory,
  setSelectedCategory,
  selectedGender,
  setSelectedGender,
  selectedScoreType,
  setSelectedScoreType,
  departmentsList,
  categoriesList,
  statusList,
  onResetFilters,
  totalResultsCount,
  totalRecordsCount
}) => {
  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedDepartment !== 'ALL' || 
    selectedStatus !== 'ALL' || 
    selectedCategory !== 'ALL' || 
    selectedGender !== 'ALL' ||
    selectedScoreType !== 'ALL';

  return (
    <div className="bg-white rounded-xl p-4 border border-zinc-300 space-y-3.5 shadow-xs">
      {/* Top Row: Search & Active Filter Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or Application ID (e.g. EN25379973)..."
            className="w-full pl-10 pr-9 py-2 bg-white text-zinc-900 placeholder:text-zinc-400 text-xs font-semibold rounded-lg border border-zinc-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Counter & Reset */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <span className="text-xs text-zinc-600 font-semibold">
            Showing <strong className="text-black">{totalResultsCount}</strong> of{' '}
            <strong className="text-zinc-600">{totalRecordsCount}</strong> records
          </span>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-lg transition-all active:scale-95 border border-black"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-zinc-200">
        {/* Department Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-black flex items-center gap-1">
            <Building className="w-3 h-3 text-black" /> Department / Code
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full bg-white text-zinc-900 text-xs font-semibold rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:border-black"
          >
            <option value="ALL">All Choice Codes ({departmentsList.length})</option>
            {departmentsList.map((d) => (
              <option key={d.choice_code} value={d.choice_code}>
                {d.choice_code} — {d.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-black flex items-center gap-1">
            <Filter className="w-3 h-3 text-black" /> Allotment Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-white text-zinc-900 text-xs font-semibold rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:border-black"
          >
            <option value="ALL">All Allotment Statuses</option>
            {statusList.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Seat Category Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-black flex items-center gap-1">
            <Tag className="w-3 h-3 text-black" /> Seat Type Code
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white text-zinc-900 text-xs font-semibold rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:border-black"
          >
            <option value="ALL">All Seat Types ({categoriesList.length})</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-black flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-black" /> Gender
          </label>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full bg-white text-zinc-900 text-xs font-semibold rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:border-black"
          >
            <option value="ALL">All Genders</option>
            <option value="M">Male (M)</option>
            <option value="F">Female (F)</option>
          </select>
        </div>

        {/* Score Type Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-black flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-black" /> Exam / Score Type
          </label>
          <select
            value={selectedScoreType}
            onChange={(e) => setSelectedScoreType(e.target.value)}
            className="w-full bg-white text-zinc-900 text-xs font-semibold rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:border-black"
          >
            <option value="ALL">All Exams</option>
            <option value="MHT-CET">MHT-CET</option>
            <option value="JEE(Main)">JEE(Main)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;
