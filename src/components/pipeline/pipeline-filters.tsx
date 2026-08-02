"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PipelineFiltersProps {
  branches: string[];
  categories: string[];
  selectedBranches: string[];
  selectedCategories: string[];
  onBranchChange: (v: string[]) => void;
  onCategoryChange: (v: string[]) => void;
  onSearchChange: (v: string) => void;
  search: string;
}

const STATUS_OPTIONS = [
  "DRAFT",
  "FORMS_COMPLETE",
  "DOCS_IN_PROGRESS",
  "DOCS_VERIFIED",
  "FEE_RECORDED",
  "READY_TO_PRINT",
  "PRINTED",
  "PENDING_FINAL_VERIFICATION",
  "ADMITTED",
];

export function PipelineFilters({
  branches,
  categories,
  selectedBranches,
  selectedCategories,
  onBranchChange,
  onCategoryChange,
  onSearchChange,
  search,
}: PipelineFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search name..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-[200px] h-8 text-sm"
      />
      <Select
        value={selectedBranches[0] ?? ""}
        onValueChange={(v: string) => onBranchChange(v ? [v] : [])}
      >
        <SelectTrigger className="h-8 text-sm max-w-[140px]">
          <SelectValue placeholder="Branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Branches</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b} value={b}>{b}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedCategories[0] ?? ""}
        onValueChange={(v: string) => onCategoryChange(v ? [v] : [])}
      >
        <SelectTrigger className="h-8 text-sm max-w-[140px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
