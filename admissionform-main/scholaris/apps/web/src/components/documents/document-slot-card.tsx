"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { UploadZone } from "./upload-zone";
import { DocumentPreview } from "./document-preview";
import { CameraCapture } from "./camera-capture";

type SlotStatus = "NOT_UPLOADED" | "UPLOADED_PENDING_REVIEW" | "VERIFIED" | "REJECTED_REUPLOAD";

interface UploadData {
  id: string;
  fileRef: string | null;
  fileType: string | null;
  status: SlotStatus;
  systemCheckPassed: boolean | null;
  systemCheckNotes: string | null;
  receivedYn: boolean | null;
}

interface DocumentSlotCardProps {
  srNo: number;
  documentName: string;
  checklistItemId: string;
  recordId: string;
  upload: UploadData | null;
  onUpload: (checklistItemId: string, file: File, method: string) => Promise<void>;
  onSetReceived: (uploadId: string, received: boolean) => Promise<void>;
  onVerify: (uploadId: string) => Promise<void>;
  onReject: (uploadId: string, reason: string) => Promise<void>;
}

export function DocumentSlotCard({
  srNo,
  documentName,
  checklistItemId,
  recordId,
  upload,
  onUpload,
  onSetReceived,
  onVerify,
  onReject,
}: DocumentSlotCardProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pending, setPending] = useState(false);

  const status = upload?.status ?? "NOT_UPLOADED";
  const fileRef = upload?.fileRef;

  const statusConfig: Record<SlotStatus, { label: string; color: "outline" | "secondary" | "default" | "destructive" }> = {
    NOT_UPLOADED: { label: "Not Uploaded", color: "outline" },
    UPLOADED_PENDING_REVIEW: { label: "Pending Review", color: "secondary" },
    VERIFIED: { label: "Verified", color: "default" },
    REJECTED_REUPLOAD: { label: "Rejected — Reupload Required", color: "destructive" },
  };

  async function handleFileUpload(file: File, method: string) {
    setPending(true);
    await onUpload(checklistItemId, file, method);
    setShowUpload(false);
    setPending(false);
  }

  async function handleCameraCapture(file: File) {
    await handleFileUpload(file, "scan");
    setShowCamera(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{srNo}.</span>
          <CardTitle className="text-sm font-medium">{documentName}</CardTitle>
        </div>
        <Badge variant={statusConfig[status].color}>
          {statusConfig[status].label}
        </Badge>
      </CardHeader>
      <CardContent className="py-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Physical Verification Required</span>
          <Badge variant="outline" className="text-[10px]">Document Check</Badge>
        </div>

        {(status === "UPLOADED_PENDING_REVIEW" || status === "VERIFIED") && fileRef && (
          <div className="space-y-3">
            <DocumentPreview fileRef={fileRef} fileType={upload.fileType ?? "image"} />

            {upload.systemCheckNotes && (
              <div className={`rounded-md border p-2 text-xs ${upload.systemCheckPassed ? "border-success/30 bg-success/5 text-success" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
                {upload.systemCheckPassed ? "System check passed" : `System check: ${upload.systemCheckNotes}`}
              </div>
            )}

            <Separator />

            {status === "UPLOADED_PENDING_REVIEW" && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`received-${upload.id}`}
                    checked={upload.receivedYn === true}
                    onCheckedChange={(c: any) => onSetReceived(upload.id, c === true)}
                  />
                  <label htmlFor={`received-${upload.id}`} className="text-sm cursor-pointer">
                    Received: Yes
                  </label>
                </div>

                {upload.receivedYn === true && (
                  <Button size="sm" onClick={() => onVerify(upload.id)}>
                    Verified
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => onReject(upload.id, "Document needs reupload")}
                >
                  Reject
                </Button>
              </div>
            )}

            {status === "VERIFIED" && (
              <div className="flex items-center gap-2 text-sm text-success">
                <span>✓ Verified</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
