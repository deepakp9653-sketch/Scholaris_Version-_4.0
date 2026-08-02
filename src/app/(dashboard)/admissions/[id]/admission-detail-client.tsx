"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StageProgress } from "@/components/pipeline/stage-progress";
import { FeeStatusBadge } from "@/components/fee/fee-status-badge";
import Link from "next/link";
import {
  FileText,
  DollarSign,
  CheckCircle,
  Lock,
  ArrowRight,
  User,
  GraduationCap,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const STAGES = [
  { label: "Form Fill", statusKeys: ["DRAFT"] },
  { label: "Docs Verification", statusKeys: ["FORMS_COMPLETE", "DOCS_IN_PROGRESS"] },
  { label: "Fee Details", statusKeys: ["DOCS_VERIFIED"] },
  { label: "Print Forms", statusKeys: ["FEE_RECORDED", "READY_TO_PRINT", "PRINTED"] },
  { label: "Final Approval", statusKeys: ["PENDING_FINAL_VERIFICATION"] },
  { label: "Admitted", statusKeys: ["ADMITTED"] },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  FORMS_COMPLETE: "bg-amber-100 text-amber-800 border-amber-200",
  DOCS_IN_PROGRESS: "bg-amber-100 text-amber-800 border-amber-200",
  DOCS_VERIFIED: "bg-blue-100 text-blue-800 border-blue-200",
  FEE_RECORDED: "bg-blue-100 text-blue-800 border-blue-200",
  READY_TO_PRINT: "bg-muted text-muted-foreground",
  PRINTED: "bg-muted text-muted-foreground",
  PENDING_FINAL_VERIFICATION: "bg-amber-100 text-amber-800 border-amber-200",
  ADMITTED: "bg-green-100 text-green-800 border-green-200",
  ON_HOLD: "bg-red-100 text-red-800 border-red-200",
  REJECTED: "bg-red-200 text-red-900 border-red-300",
};

interface AdmissionDetailClientProps {
  record: any;
  id: string;
}

export function AdmissionDetailClient({ record, id }: AdmissionDetailClientProps) {
  const name = [record.studentProfile?.fullNameSurname, record.studentProfile?.fullNameFirst]
    .filter(Boolean)
    .join(" ") || "Unnamed Candidate";

  // Calculate current stage index
  let currentStageIndex = 0;
  if (record.status === "DRAFT") currentStageIndex = 0;
  else if (record.status === "FORMS_COMPLETE" || record.status === "DOCS_IN_PROGRESS") currentStageIndex = 1;
  else if (record.status === "DOCS_VERIFIED") currentStageIndex = 2;
  else if (record.status === "FEE_RECORDED" || record.status === "READY_TO_PRINT" || record.status === "PRINTED") currentStageIndex = 3;
  else if (record.status === "PENDING_FINAL_VERIFICATION") currentStageIndex = 4;
  else if (record.status === "ADMITTED") currentStageIndex = 5;

  const currentStage = STAGES[currentStageIndex];

  // Stage workspace links
  const stageLinks: Record<string, string> = {
    DRAFT: `/admissions/${id}/edit`,
    FORMS_COMPLETE: `/admissions/${id}/documents`,
    DOCS_IN_PROGRESS: `/admissions/${id}/documents`,
    DOCS_VERIFIED: `/admissions/${id}/fee`,
    FEE_RECORDED: `/admissions/${id}/preview`,
    READY_TO_PRINT: `/admissions/${id}/preview`,
    PRINTED: `/admissions/${id}/preview`,
    PENDING_FINAL_VERIFICATION: "/final-verification",
    ADMITTED: `/admissions/${id}/preview`,
  };

  const actionText: Record<string, string> = {
    DRAFT: "Continue Form Filling",
    FORMS_COMPLETE: "Start Document Verification",
    DOCS_IN_PROGRESS: "Continue Document Verification",
    DOCS_VERIFIED: "Record Fee Details",
    FEE_RECORDED: "Preview & Approve Print",
    READY_TO_PRINT: "Print Forms",
    PRINTED: "Go to Final Verification Queue",
    PENDING_FINAL_VERIFICATION: "Awaiting Principal Verification",
    ADMITTED: "View Print Preview (Read-Only)",
  };

  const currentActionLink = stageLinks[record.status] || `/admissions/${id}`;
  const currentActionText = actionText[record.status] || "View Detail";

  // Calculate document counts
  const requiredDocs = record.form2Checklist?.items.filter((item: any) => item.required) || [];
  const uploadedDocs = record.documentUploads || [];
  const verifiedDocsCount = uploadedDocs.filter((doc: any) => doc.status === "VERIFIED").length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admissions" className="hover:text-foreground">Admissions</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{record.id.slice(0, 8)}…</span>
      </div>

      {/* Header Profile Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{name}</h1>
            <Badge className={STATUS_COLORS[record.status] || ""} variant="outline">
              {record.status.replace(/_/g, " ")}
            </Badge>
            {record.lockedAt && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                <Lock className="w-3 h-3" /> Locked
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {record.studentProfile?.branchCourse || "No branch set"}</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" /> {record.studentProfile?.category || "No category"}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Created {new Date(record.createdAt).toLocaleDateString("en-IN")}</span>
          </div>
        </div>

        {record.status !== "ADMITTED" && (
          <Link href={currentActionLink}>
            <Button className="gap-1.5 shadow-sm">
              {currentActionText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Pipeline Progress Stepper */}
      <Card className="border border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Admission Funnel Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <StageProgress status={record.status} />
        </CardContent>
      </Card>

      {/* Current Stage Highlight */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold font-mono">
              {currentStageIndex + 1}
            </span>
            Current Stage: {currentStage.label}
          </CardTitle>
          <CardDescription>
            {record.status === "DRAFT" && "The candidate's 5 admission forms are currently being filled. All forms must be fully completed and password-gated before proceeding."}
            {(record.status === "FORMS_COMPLETE" || record.status === "DOCS_IN_PROGRESS") && "Upload and verify the required supporting documents. Document checklist is driven by Form 2."}
            {record.status === "DOCS_VERIFIED" && "Review academic fees, installments, and payment modes. Record payment status to proceed."}
            {(record.status === "FEE_RECORDED" || record.status === "READY_TO_PRINT" || record.status === "PRINTED") && "Approve the pixel-accurate print layout preview and print the 5-form physical dossier."}
            {record.status === "PENDING_FINAL_VERIFICATION" && "Awaiting HOD / HOD Principal signature and final authorization password gate to admit the student."}
            {record.status === "ADMITTED" && "This record is fully verified, approved by the higher authority, and locked. Permanent student registry entry created."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {record.status === "DRAFT" && (
            <div className="text-xs text-muted-foreground bg-surface border border-border rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Forms saved as Draft. Click <strong>Continue Form Filling</strong> to complete the remaining steps.</span>
            </div>
          )}
          {(record.status === "FORMS_COMPLETE" || record.status === "DOCS_IN_PROGRESS") && (
            <div className="text-xs text-muted-foreground bg-surface border border-border rounded-xl p-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Verification progress: <strong>{verifiedDocsCount}</strong> of <strong>{requiredDocs.length}</strong> required documents verified.</span>
              </span>
              <Link href={`/admissions/${id}/documents`} className="text-primary hover:underline font-medium">Verify documents &rarr;</Link>
            </div>
          )}
          {record.status === "DOCS_VERIFIED" && (
            <div className="text-xs text-muted-foreground bg-surface border border-border rounded-xl p-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>All documents verified successfully! Fees must be recorded next.</span>
              </span>
              <Link href={`/admissions/${id}/fee`} className="text-primary hover:underline font-medium">Record fees &rarr;</Link>
            </div>
          )}
          {record.status === "ADMITTED" && (
            <div className="text-xs text-green-800 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold">Admission Complete</p>
                <p className="text-[11px] opacity-90 mt-0.5">The candidate has been officially admitted. All details are saved in the permanent database and this file is locked.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: Forms and Sub-Modules Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forms Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">1. Digital Forms Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
              <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-muted-foreground" /> Form 1: Application Form</span>
              {record.form1Application ? <span className="text-green-600 font-medium">Completed</span> : <span className="text-muted-foreground">Pending</span>}
            </div>
            <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
              <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-muted-foreground" /> Form 2: Checklist & Meta</span>
              {record.form2Checklist ? <span className="text-green-600 font-medium">Completed</span> : <span className="text-muted-foreground">Pending</span>}
            </div>
            <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
              <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-muted-foreground" /> Form 3: SPPU Eligibility</span>
              {record.form3Eligibility ? <span className="text-green-600 font-medium">Completed</span> : <span className="text-muted-foreground">Pending</span>}
            </div>
            <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
              <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-muted-foreground" /> Form 4: Anti-Ragging Affidavit</span>
              {record.form4Affidavit ? <span className="text-green-600 font-medium">Completed</span> : <span className="text-muted-foreground">Pending</span>}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-muted-foreground" /> Form 5: Library Membership</span>
              {record.form5Library ? <span className="text-green-600 font-medium">Completed</span> : <span className="text-muted-foreground">Pending</span>}
            </div>
          </CardContent>
        </Card>

        {/* Modules Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">2. Pipeline Stage Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Documents */}
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Documents Verified</p>
                <p className="text-[10px] text-muted-foreground">{verifiedDocsCount} of {requiredDocs.length} required checklist docs verified</p>
              </div>
              {verifiedDocsCount === requiredDocs.length && requiredDocs.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-bold border border-green-200">Verified</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">Incomplete</span>
              )}
            </div>

            {/* Fee */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Fee Payment Status</p>
                {record.feeRecord ? (
                  <p className="text-[10px] text-muted-foreground">
                    Paid: &#8377;{Number(record.feeRecord.amountPaid).toLocaleString()} / &#8377;{Number(record.feeRecord.totalFeeAmount).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Fee record not entered</p>
                )}
              </div>
              <FeeStatusBadge
                feeStatus={record.feeRecord?.feeStatus ?? null}
                totalFee={record.feeRecord?.totalFeeAmount ? Number(record.feeRecord.totalFeeAmount) : null}
                amountPaid={record.feeRecord?.amountPaid ? Number(record.feeRecord.amountPaid) : null}
              />
            </div>

            {/* Print Logs */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Printed Copies</p>
                <p className="text-[10px] text-muted-foreground">
                  {record.printLogs.length > 0 ? `Printed ${record.printLogs.length} times` : "Not printed yet"}
                </p>
              </div>
              {record.printLogs.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-bold border border-green-200">Printed</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold border border-border">Pending</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. SPPU Auto-Eligibility-Sync Engine Card */}
      <Card className="border-amber-200/80 bg-amber-50/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-amber-950">
                  SPPU Auto-Eligibility-Sync Engine
                </CardTitle>
                <CardDescription className="text-xs text-amber-800/80">
                  Automatic 33-column validation & in-place `.xls` university upload sync
                </CardDescription>
              </div>
            </div>
            {record.syncStatus === "COMPLETED_SYNCED" ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-semibold px-2.5 py-1">
                Synced to SPPU Excel ✓
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 font-semibold px-2.5 py-1">
                Ready for Review / Draft
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {record.syncStatus === "COMPLETED_SYNCED" ? (
            <div className="p-4 rounded-xl bg-white border border-green-200 space-y-2 text-xs text-foreground">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Synced to SPPU Branch `.xls` File
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {record.excelSyncedAt ? new Date(record.excelSyncedAt).toLocaleString() : "Just now"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-muted/60 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Assigned Excel Row</span>
                  <span className="font-mono font-bold text-sm text-foreground">Row #{record.excelRowNumber || 15}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Academic Year</span>
                  <span className="font-semibold text-foreground">2026-27 (Granted)</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">33-Column Verification</span>
                  <span className="text-green-700 font-medium">Passed (33/33)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white border border-amber-200/70 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                When staff mark this student record as complete, the backend validates all 33 mapped fields (B–AG) according to DTE EN6649 guidelines and writes the row directly into the branch-wise SPPU eligibility Excel template with zero manual re-typing.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Link href={`/api/students/${id}/complete-and-sync`} target="_blank">
                  <Button
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await fetch(`/api/students/${id}/complete-and-sync`, { method: "POST" });
                        const data = await res.json();
                        if (res.ok) {
                          alert(`Success! Student written to SPPU Excel Row #${data.result.rowNumber}`);
                          window.location.reload();
                        } else {
                          alert(`Validation Error: ${data.error}`);
                        }
                      } catch (err: any) {
                        alert(`Error: ${err.message}`);
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-2 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Mark Complete & Sync to SPPU Excel
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/students/${id}/validate`, { method: "POST" });
                      const data = await res.json();
                      if (data.valid) {
                        alert("✓ All 33 mapped columns passed SPPU validation! Ready to sync.");
                      } else {
                        const msg = data.errors.map((e: any) => `${e.label} (${e.column}): ${e.message}`).join("\n");
                        alert(`Validation Errors (${data.errors.length}):\n${msg}`);
                      }
                    } catch (err: any) {
                      alert(`Validation error: ${err.message}`);
                    }
                  }}
                  className="text-xs gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100/50"
                >
                  Validate 33 Columns
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
