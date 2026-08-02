"use client";

import { useState, useEffect, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CapCandidateTable } from "@/components/cap/cap-candidate-table";
import { getCapCandidates } from "@/lib/actions/cap";

interface Props {
  batchId: string;
  initialData: Awaited<ReturnType<typeof getCapCandidates>>;
}

export function CandidatePageClient({ batchId, initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isVacantFilter, setIsVacantFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const loadData = (newSearch: string, newPage: number, newIsVacant?: boolean) => {
    startTransition(async () => {
      const result = await getCapCandidates(batchId, {
        search: newSearch || undefined,
        isVacant: newIsVacant,
        page: newPage,
        pageSize: 50,
      });
      setData(result);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData(search, 1, isVacantFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, isVacantFilter]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or application ID…"
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={isVacantFilter === false ? "default" : "outline"}
          size="sm"
          className="h-9 text-xs"
          onClick={() => setIsVacantFilter(isVacantFilter === false ? undefined : false)}
        >
          Filled Only
        </Button>
        <Button
          variant={isVacantFilter === true ? "default" : "outline"}
          size="sm"
          className="h-9 text-xs"
          onClick={() => setIsVacantFilter(isVacantFilter === true ? undefined : true)}
        >
          Vacant Only
        </Button>
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
        )}
      </div>

      <CapCandidateTable
        candidates={data.candidates as Parameters<typeof CapCandidateTable>[0]["candidates"]}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        batchId={batchId}
        onPageChange={(p) => {
          setPage(p);
          loadData(search, p, isVacantFilter);
        }}
      />
    </div>
  );
}
