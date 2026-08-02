"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PipelineTable } from "@/components/pipeline/pipeline-table";
import { PipelineKanban } from "@/components/pipeline/pipeline-kanban";
import { PipelineFilters } from "@/components/pipeline/pipeline-filters";
import type { PipelineRecord } from "@/lib/actions/pipeline";

interface FilterOptions {
  branches: string[];
  categories: string[];
}

interface PipelineClientProps {
  records: PipelineRecord[];
  filterOptions: FilterOptions;
}

export function PipelineClient({ records, filterOptions }: PipelineClientProps) {
  const [search, setSearch] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (search) {
        const name = [r.studentProfile?.fullNameSurname, r.studentProfile?.fullNameFirst]
          .filter(Boolean).join(" ").toLowerCase();
        if (!name.includes(search.toLowerCase())) return false;
      }
      if (selectedBranches.length > 0 && r.studentProfile?.branchCourse) {
        if (!selectedBranches.includes(r.studentProfile.branchCourse)) return false;
      }
      if (selectedCategories.length > 0 && r.studentProfile?.category) {
        if (!selectedCategories.includes(r.studentProfile.category)) return false;
      }
      return true;
    });
  }, [records, search, selectedBranches, selectedCategories]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground">{records.length} total records</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PipelineFilters
          branches={filterOptions.branches}
          categories={filterOptions.categories}
          selectedBranches={selectedBranches}
          selectedCategories={selectedCategories}
          onBranchChange={setSelectedBranches}
          onCategoryChange={setSelectedCategories}
          onSearchChange={setSearch}
          search={search}
        />
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <PipelineTable records={filtered} />
        </TabsContent>
        <TabsContent value="kanban">
          <PipelineKanban records={filtered} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
