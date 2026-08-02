"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DocumentSlotCard } from "@/components/documents/document-slot-card";
import {
  getDocumentSlots,
  uploadDocument,
  setReceivedStatus,
  verifyDocument,
  rejectDocument,
} from "@/lib/actions/documents";

import { updateAdmissionStatus } from "@/lib/actions/admission";
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

interface UploadData {
  id: string;
  fileRef: string | null;
  fileType: string | null;
  status: "NOT_UPLOADED" | "UPLOADED_PENDING_REVIEW" | "VERIFIED" | "REJECTED_REUPLOAD";
  systemCheckPassed: boolean | null;
  systemCheckNotes: string | null;
  receivedYn: boolean | null;
}

interface SlotData {
  checklistItemId: string;
  srNo: number;
  documentName: string;
  upload: UploadData | null;
}

interface DocumentsClientProps {
  recordId: string;
  currentStatus: string;
}

export function DocumentsClient({ recordId, currentStatus }: DocumentsClientProps) {
  const router = useRouter();
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadSlots();
  }, [recordId]);

  async function loadSlots() {
    setLoading(true);
    const data = await getDocumentSlots(recordId);
    setSlots(data);
    setLoading(false);
  }

  const handleUpload = useCallback(async (checklistItemId: string, file: File, method: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadMethod", method);
    await uploadDocument(recordId, checklistItemId, formData);
    await loadSlots();
    router.refresh();
  }, [recordId, router]);

  const handleSetReceived = useCallback(async (uploadId: string, received: boolean) => {
    await setReceivedStatus(uploadId, received);
    await loadSlots();
  }, []);

  const handleVerify = useCallback(async (uploadId: string) => {
    await verifyDocument(uploadId);
    await loadSlots();
    router.refresh();
  }, [router]);

  const handleReject = useCallback(async (uploadId: string, reason: string) => {
    await rejectDocument(uploadId, reason);
    await loadSlots();
  }, []);

  async function handleApproveAndProceed() {
    setApproving(true);
    try {
      await updateAdmissionStatus(recordId, "DOCS_VERIFIED");
      router.push(`/admissions/${recordId}/fee`);
      router.refresh();
    } catch (err) {
      console.error("Error updating document verification status:", err);
    } finally {
      setApproving(false);
    }
  }

  const verifiedCount = slots.filter((s) => s.upload?.status === "VERIFIED").length;
  const totalRequired = slots.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Physical Document Verification
          </h1>
          <p className="text-sm text-muted-foreground">
            Audit and verify physical document certificates. Status: <span className="font-mono font-medium text-foreground">{currentStatus}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {verifiedCount} / {totalRequired} Verified
          </div>
          <Button
            size="sm"
            onClick={handleApproveAndProceed}
            disabled={approving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            {approving ? "Approving..." : "Approve & Proceed"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Loading document slots...
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-muted p-8 text-center text-sm text-muted-foreground">
          No required documents. Complete the Document Checklist (Form 2) first.
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <DocumentSlotCard
              key={slot.checklistItemId}
              srNo={slot.srNo}
              documentName={slot.documentName}
              checklistItemId={slot.checklistItemId}
              recordId={recordId}
              upload={slot.upload}
              onUpload={handleUpload}
              onSetReceived={handleSetReceived}
              onVerify={handleVerify}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Bottom Approval Action Bar */}
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Physical Document Verification Approval
          </p>
          <p className="text-xs text-emerald-800/80">
            Approve this candidate's verified physical dossier to unlock the Fee Payment step.
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleApproveAndProceed}
          disabled={approving}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md whitespace-nowrap"
        >
          <ShieldCheck className="w-5 h-5" />
          {approving ? "Approving..." : "Approve & Proceed to Fee Payment"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
