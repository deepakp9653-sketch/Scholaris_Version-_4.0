"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CapPdfUpload } from "@/components/cap/cap-pdf-upload";
import { deleteCapBatch } from "@/lib/actions/cap";

interface Batch {
  id: string;
  roundLabel: string;
  sourceFilename: string;
  status: string;
  createdAt: Date;
  institute: { name: string; code: string };
  _count: { choiceCodes: number };
}

interface DataPageClientProps {
  batches: Batch[];
}

export function DataPageClient({ batches: initialBatches }: DataPageClientProps) {
  const router = useRouter();
  const [batches, setBatches] = useState(initialBatches);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("Delete this upload batch? This will remove all associated candidate data.")) return;
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteCapBatch(id);
      if (result.success) {
        setBatches((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert(result.error ?? "Delete failed");
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload New CAP Round PDF</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload the State CET Cell provisional allotment PDF for this institute
          </p>
        </CardHeader>
        <CardContent>
          <CapPdfUpload onSuccess={() => router.push("/cap-analytics")} />
        </CardContent>
      </Card>

      {/* Existing Batches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload History</CardTitle>
          <p className="text-sm text-muted-foreground">{batches.length} upload{batches.length !== 1 ? "s" : ""}</p>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No CAP PDFs uploaded yet
            </div>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent/20 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">{batch.roundLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.institute.name.split(",")[0]} • {batch._count.choiceCodes} choice codes •{" "}
                      {new Date(batch.createdAt).toLocaleDateString("en-IN")}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{batch.sourceFilename}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${batch.status === "success" ? "bg-success/10 text-success" :
                          batch.status === "failed" ? "bg-blocked/10 text-blocked" :
                          "bg-pending/10 text-pending"}`}
                    >
                      {batch.status}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(batch.id)}
                      disabled={deletingId === batch.id && isPending}
                    >
                      {deletingId === batch.id && isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
