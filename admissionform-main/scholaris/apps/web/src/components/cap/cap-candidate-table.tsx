"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { importCandidateToAdmission } from "@/lib/actions/cap";

interface Candidate {
  id: string;
  srNo: number;
  meritNo: number | null;
  score: string | null;
  scoreType: string | null;
  applicationId: string | null;
  candidateName: string;
  gender: string | null;
  category: string | null;
  seatTypeCode: string | null;
  statusSymbol: string | null;
  statusLabel: string | null;
  isVacant: boolean;
  choiceCode: { code: string; department: { name: string } };
  seatPool: { label: string } | null;
  admissionRecords: { id: string; status: string }[];
}

interface CapCandidateTableProps {
  candidates: Candidate[];
  total: number;
  page: number;
  pageSize: number;
  batchId: string;
  onPageChange?: (page: number) => void;
}

const STATUS_SYMBOL_MAP: Record<string, string> = {
  "*": "Betterment in Choice Code",
  "@": "Betterment in Seat Type",
  "~": "No Change",
  "^": "Admitted to Institute",
  "&": "Newly Allotted",
};

export function CapCandidateTable({ candidates, total, page, pageSize, batchId, onPageChange }: CapCandidateTableProps) {
  const router = useRouter();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleImport = (candidateId: string) => {
    setImportingId(candidateId);
    startTransition(async () => {
      try {
        const result = await importCandidateToAdmission(candidateId);
        if (result.success && result.admissionRecordId) {
          router.push(`/admissions/new?capCandidateId=${candidateId}&recordId=${result.admissionRecordId}`);
        } else {
          router.push(`/admissions/new?capCandidateId=${candidateId}`);
        }
      } catch {
        router.push(`/admissions/new?capCandidateId=${candidateId}`);
      }
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Candidate Records</CardTitle>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} records</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded-lg bg-surface-muted border border-border font-mono">
            Page {page} / {totalPages}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-muted-foreground uppercase tracking-wide font-semibold text-[10.5px]">
                <th className="py-2.5 px-3 text-left">Sr</th>
                <th className="py-2.5 px-3 text-left">Name</th>
                <th className="py-2.5 px-3 text-left">App ID</th>
                <th className="py-2.5 px-3 text-left">Department</th>
                <th className="py-2.5 px-3 text-left">Category</th>
                <th className="py-2.5 px-3 text-left">Seat Type</th>
                <th className="py-2.5 px-3 text-right">Merit No</th>
                <th className="py-2.5 px-3 text-right">Score</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {candidates.map((c) => {
                const isImported = c.admissionRecords.length > 0;
                const isImporting = importingId === c.id && isPending;
                return (
                  <tr key={c.id} className={`hover:bg-accent/20 transition-colors ${c.isVacant ? "opacity-50" : ""}`}>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{c.srNo}</td>
                    <td className="py-2 px-3 font-semibold text-foreground max-w-[160px] truncate">
                      {c.isVacant ? (
                        <span className="text-muted-foreground italic">VACANT</span>
                      ) : c.candidateName}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{c.applicationId ?? "—"}</td>
                    <td className="py-2 px-3 text-muted-foreground max-w-[140px] truncate">
                      {c.choiceCode.department.name}
                    </td>
                    <td className="py-2 px-3">
                      {c.category && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-muted border border-border">
                          {c.category}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">{c.seatTypeCode ?? "—"}</td>
                    <td className="py-2 px-3 text-right font-mono">{c.meritNo ?? "—"}</td>
                    <td className="py-2 px-3 text-right font-mono">
                      {c.score ? Number(c.score).toFixed(2) : "—"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {c.statusSymbol && (
                        <span
                          title={STATUS_SYMBOL_MAP[c.statusSymbol]}
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[11px]"
                        >
                          {c.statusSymbol}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {!c.isVacant && (
                        isImported ? (
                          <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                            Imported
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] gap-1"
                            onClick={() => handleImport(c.id)}
                            disabled={isImporting}
                          >
                            {isImporting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserPlus className="w-3 h-3" />
                            )}
                            Import
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={page >= totalPages}
                onClick={() => onPageChange?.(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
