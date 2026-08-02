"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeeStatusBadge } from "@/components/fee/fee-status-badge";
import { StageProgress } from "./stage-progress";
import Link from "next/link";
import { deleteAdmissionRecord } from "@/lib/actions/admission";
import { Trash2, Edit3 } from "lucide-react";
import type { PipelineRecord } from "@/lib/actions/pipeline";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  FORMS_COMPLETE: "bg-pending/20 text-pending",
  DOCS_IN_PROGRESS: "bg-pending/20 text-pending",
  DOCS_VERIFIED: "bg-info/20 text-info",
  FEE_RECORDED: "bg-info/20 text-info",
  READY_TO_PRINT: "bg-muted text-muted-foreground",
  PRINTED: "bg-muted text-muted-foreground",
  PENDING_FINAL_VERIFICATION: "bg-pending/20 text-pending",
  ADMITTED: "bg-success/20 text-success",
  ON_HOLD: "bg-destructive/10 text-destructive",
  REJECTED: "bg-destructive/20 text-destructive",
};

interface PipelineTableProps {
  records: PipelineRecord[];
}

export function PipelineTable({ records }: PipelineTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete form record for ${name}?`)) return;
    setDeletingId(id);
    try {
      const res = await deleteAdmissionRecord(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to delete record");
      }
    } catch {
      alert("Error deleting record");
    } finally {
      setDeletingId(null);
    }
  }

  if (records.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No records match your criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border" role="region" aria-label="Pipeline table">
      <table className="w-full text-sm">
        <caption className="sr-only">Admission pipeline records</caption>
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            <th className="text-left py-3 px-3 font-medium" scope="col">Name</th>
            <th className="text-left py-3 px-3 font-medium" scope="col">Branch</th>
            <th className="text-left py-3 px-3 font-medium" scope="col">Category</th>
            <th className="text-left py-3 px-3 font-medium" scope="col">Status</th>
            <th className="text-left py-3 px-3 font-medium" scope="col">Fee</th>
            <th className="text-left py-3 px-3 font-medium" scope="col">Progress</th>
            <th className="text-left py-3 px-3 font-medium" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => {
            const name = [rec.studentProfile?.fullNameSurname, rec.studentProfile?.fullNameFirst]
              .filter(Boolean)
              .join(" ") || "Unnamed";
            const isIncomplete = rec.status !== "ADMITTED";

            return (
              <tr key={rec.id} className="border-b border-border/50 hover:bg-surface-muted/30">
                <td className="py-2.5 px-3 font-medium">{name}</td>
                <td className="py-2.5 px-3 text-muted-foreground">{rec.studentProfile?.branchCourse ?? "-"}</td>
                <td className="py-2.5 px-3 text-muted-foreground">{rec.studentProfile?.category ?? "-"}</td>
                <td className="py-2.5 px-3">
                  <Badge className={STATUS_COLORS[rec.status] ?? ""} variant="outline">
                    {rec.status.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="py-2.5 px-3">
                  <FeeStatusBadge
                    feeStatus={rec.feeRecord?.feeStatus ?? null}
                    totalFee={rec.feeRecord?.totalFeeAmount ?? null}
                    amountPaid={rec.feeRecord?.amountPaid ?? null}
                  />
                </td>
                <td className="py-2.5 px-3">
                  <StageProgress status={rec.status} compact />
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    {isIncomplete ? (
                      <Link href={`/admissions/new?recordId=${rec.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-primary gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 opacity-50 cursor-not-allowed" disabled title="Completed forms cannot be edited">
                        Edit
                      </Button>
                    )}

                    <Link href={`/admissions/${rec.id}/fee`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2">Fee</Button>
                    </Link>
                    <Link href={`/admissions/${rec.id}/documents`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2">Docs</Button>
                    </Link>
                    <Link href={`/admissions/${rec.id}/preview`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2">Preview</Button>
                    </Link>

                    {isIncomplete ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                        disabled={deletingId === rec.id}
                        onClick={() => handleDelete(rec.id, name)}
                      >
                        <Trash2 className="w-3 h-3" /> {deletingId === rec.id ? "Deleting..." : "Delete"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 opacity-50 cursor-not-allowed" disabled title="Completed forms cannot be deleted">
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
