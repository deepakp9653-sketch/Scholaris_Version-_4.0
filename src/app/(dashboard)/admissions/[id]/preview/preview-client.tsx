"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, ArrowRight, CheckCircle2 } from "lucide-react";
import { markPrinted } from "@/lib/actions/print";

interface PreviewClientProps {
  recordId: string;
  currentStatus: string;
}

export function PreviewClient({ recordId, currentStatus }: PreviewClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = async () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
      try {
        await markPrinted(recordId);
        setStatus("PRINTED");
      } catch {}
    } else {
      window.open(`/api/print/${recordId}/html`, "_blank");
    }
  };

  const handleProceedNext = () => {
    router.push(`/admissions/${recordId}/documents`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            Official 5-Form Admission Dossier Preview
          </h1>
          <p className="text-sm text-muted-foreground">
            All candidate information has been cleanly injected into the official college &amp; university templates. Status: <span className="font-mono font-semibold text-foreground">{status}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" className="gap-2 font-semibold">
            <Printer className="w-4 h-4" />
            Print Dossier
          </Button>
          <a
            href={`/api/print/${recordId}/pdf`}
            download={`admission-forms-${recordId}.pdf`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:opacity-90"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
          <Button onClick={handleProceedNext} variant="outline" className="gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold">
            Proceed to Document Verification
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border border-border/80 shadow-sm">
        <CardContent className="p-0">
          <iframe
            ref={iframeRef}
            src={`/api/print/${recordId}/html`}
            className="h-[calc(100vh-220px)] w-full border-0 bg-white"
            title="Official Admission Forms Preview"
          />
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Review the 5 printed forms above. Click <strong>Download PDF</strong> or <strong>Print Dossier</strong> to generate physical paper copies, then click <strong>Proceed to Document Verification</strong> to continue.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={handleProceedNext} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm text-xs">
            Next Process: Physical Document Verification
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
