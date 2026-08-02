"use client";

import { useState, useTransition } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadAndParseCapPdf, commitCapBatch } from "@/lib/actions/cap";
import type { ParsedBatch } from "@/lib/cap-parser/parserTypes";

interface CapPdfUploadProps {
  onSuccess?: () => void;
}

export function CapPdfUpload({ onSuccess }: CapPdfUploadProps) {
  const [isParsing, startParsing] = useTransition();
  const [isCommitting, startCommitting] = useTransition();
  const [preview, setPreview] = useState<ParsedBatch | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [committed, setCommitted] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    setPreview(null);
    setPreviewId(null);
    setCommitted(false);
    const fd = new FormData();
    fd.append("file", file);
    startParsing(async () => {
      const result = await uploadAndParseCapPdf(fd);
      if (result.success && result.preview && result.previewId) {
        setPreview(result.preview);
        setPreviewId(result.previewId);
      } else {
        setError(result.error ?? "Parse failed");
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCommit = () => {
    if (!previewId) return;
    startCommitting(async () => {
      const result = await commitCapBatch(previewId);
      if (result.success) {
        setCommitted(true);
        setPreview(null);
        setPreviewId(null);
        onSuccess?.();
      } else {
        setError(result.error ?? "Commit failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!preview && !committed && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all p-10 text-center cursor-pointer
            ${isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/40 hover:bg-accent/20"
            }`}
        >
          <input
            type="file"
            accept=".pdf"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-3">
            {isParsing ? (
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="font-semibold text-foreground">Parsing PDF…</p>
                <p className="text-sm text-muted-foreground">Extracting candidate records using line-based state machine</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Drop your CAP Round PDF here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse — max 20MB</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Maharashtra State CET Cell allotment PDF format</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Pre-import Summary */}
      {preview && !committed && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Parse Preview — {preview.round_label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{preview.institution_code_name}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Choice Codes", value: preview.total_departments },
                { label: "Candidate Records", value: preview.total_candidate_records },
                { label: "Filled Seats", value: preview.summary.total_filled_seats },
                { label: "Vacant Seats", value: preview.summary.total_vacant_seats },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-background p-3 text-center border border-border">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {preview.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-pending/10 border border-pending/20 text-sm text-pending space-y-1">
                {preview.warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button onClick={handleCommit} disabled={isCommitting} className="flex-1">
                {isCommitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isCommitting ? "Saving to Database…" : "Confirm & Save to Database"}
              </Button>
              <Button variant="outline" onClick={() => { setPreview(null); setPreviewId(null); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {committed && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20 text-success font-semibold text-sm">
          <CheckCircle className="w-5 h-5" />
          CAP data saved successfully! Redirecting to dashboard…
        </div>
      )}
    </div>
  );
}
