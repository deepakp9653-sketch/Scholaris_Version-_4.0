"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FeeStatusBadge } from "@/components/fee/fee-status-badge";
import { StageProgress } from "./stage-progress";
import Link from "next/link";
import { deleteAdmissionRecord } from "@/lib/actions/admission";
import { Trash2, Edit3, Lock } from "lucide-react";
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; isAdmitted: boolean } | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = (id: string, name: string, status: string) => {
    setDeleteTarget({ id, name, isAdmitted: status === "ADMITTED" });
    setAdminPasswordInput("");
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.isAdmitted && !adminPasswordInput.trim()) {
      setDeleteError("Admin password is required to delete an admitted student.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteAdmissionRecord(deleteTarget.id, adminPasswordInput.trim());
      if (res.success) {
        setDeleteTarget(null);
        router.refresh();
      } else {
        setDeleteError(res.error || "Failed to delete record.");
      }
    } catch {
      setDeleteError("Error deleting record.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (records.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No records match your criteria.
      </div>
    );
  }

  return (
    <>
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
              const father = rec.studentProfile?.fullNameFather || rec.studentProfile?.fatherName;
              const name = [rec.studentProfile?.fullNameSurname, rec.studentProfile?.fullNameFirst, father]
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

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                        onClick={() => openDeleteDialog(rec.id, name, rec.status)}
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-destructive" />
                Delete Candidate Record
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                {deleteTarget.isAdmitted ? (
                  <span className="block space-y-1">
                    <span>Candidate <strong>{deleteTarget.name}</strong> is currently <Badge className="bg-success/20 text-success border-success/30">ADMITTED</Badge>.</span>
                    <span className="block text-foreground font-medium pt-1">Admin password is required to delete an admitted student record.</span>
                  </span>
                ) : (
                  <span>
                    Are you sure you want to delete candidate <strong>{deleteTarget.name}</strong>? This action cannot be undone.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {deleteTarget.isAdmitted && (
              <div className="space-y-2 py-2">
                <Label htmlFor="admin-pass" className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Admin Password
                </Label>
                <Input
                  id="admin-pass"
                  type="password"
                  autoComplete="new-password"
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    setDeleteError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmDelete();
                  }}
                  autoFocus
                />
              </div>
            )}

            {deleteError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                {deleteError}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 mt-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
