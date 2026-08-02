"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeeStatusBadge } from "@/components/fee/fee-status-badge";
import { StageProgress } from "./stage-progress";
import Link from "next/link";
import type { PipelineRecord } from "@/lib/actions/pipeline";

const KANBAN_COLUMNS = [
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

const COLUMN_LABELS: Record<string, string> = {
  DRAFT: "Form Fill",
  FORMS_COMPLETE: "Forms Done",
  DOCS_IN_PROGRESS: "Docs In Progress",
  DOCS_VERIFIED: "Docs Verified",
  FEE_RECORDED: "Fee Recorded",
  READY_TO_PRINT: "Ready to Print",
  PRINTED: "Printed",
  PENDING_FINAL_VERIFICATION: "Pending Verify",
  ADMITTED: "Admitted",
};

const COLUMN_COLORS: Record<string, string> = {
  DRAFT: "border-l-muted",
  FORMS_COMPLETE: "border-l-pending",
  DOCS_IN_PROGRESS: "border-l-pending",
  DOCS_VERIFIED: "border-l-blue-400",
  FEE_RECORDED: "border-l-blue-400",
  READY_TO_PRINT: "border-l-muted",
  PRINTED: "border-l-muted",
  PENDING_FINAL_VERIFICATION: "border-l-pending",
  ADMITTED: "border-l-success",
};

interface PipelineKanbanProps {
  records: PipelineRecord[];
}

export function PipelineKanban({ records }: PipelineKanbanProps) {
  if (records.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No records match your criteria.
      </div>
    );
  }

  const grouped: Record<string, PipelineRecord[]> = {};
  for (const col of KANBAN_COLUMNS) grouped[col] = [];
  for (const rec of records) {
    if (grouped[rec.status]) grouped[rec.status].push(rec);
  }

  return (
    <div className="overflow-x-auto pb-4" role="region" aria-label="Pipeline kanban board">
      <div className="flex gap-3 min-w-max">
        {KANBAN_COLUMNS.map((col) => {
          const items = grouped[col] ?? [];
          return (
            <div key={col} className="w-56 shrink-0" role="region" aria-label={`${COLUMN_LABELS[col]} column`}>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-medium text-muted-foreground">{COLUMN_LABELS[col]}</span>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((rec) => {
                  const name = [rec.studentProfile?.fullNameSurname, rec.studentProfile?.fullNameFirst]
                    .filter(Boolean)
                    .join(" ") || "Unnamed";

                  return (
                    <Card key={rec.id} className={`border-l-2 ${COLUMN_COLORS[col] ?? "border-l-border"}`}>
                      <CardContent className="p-2.5 space-y-1.5">
                        <p className="text-xs font-medium truncate">{name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {rec.studentProfile?.branchCourse ?? "-"} • {rec.studentProfile?.category ?? "-"}
                        </p>
                        <FeeStatusBadge
                          feeStatus={rec.feeRecord?.feeStatus ?? null}
                          totalFee={rec.feeRecord?.totalFeeAmount ?? null}
                          amountPaid={rec.feeRecord?.amountPaid ?? null}
                        />
                        <div className="flex gap-1 pt-1">
                          <Link href={`/admissions/${rec.id}/documents`}>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5">Docs</Button>
                          </Link>
                          <Link href={`/admissions/${rec.id}/preview`}>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5">Preview</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
