"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getCapDashboardData, getCapCandidates } from "@/lib/actions/cap";
import { CandidatePageClient } from "./candidates-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

export default function CapCandidatesPage() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId") ?? undefined;

  const [dashData, setDashData] = useState<Awaited<ReturnType<typeof getCapDashboardData>> | null>(null);
  const [initialData, setInitialData] = useState<Awaited<ReturnType<typeof getCapCandidates>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getCapDashboardData(batchId).then(async (dData) => {
      if (!isMounted) return;
      setDashData(dData);
      if (dData) {
        const cData = await getCapCandidates(dData.batch.id, { page: 1, pageSize: 50 });
        if (isMounted) setInitialData(cData);
      }
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-muted-foreground gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading Candidates…</span>
      </div>
    );
  }

  if (!dashData || !initialData) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
        <h2 className="text-xl font-semibold">No CAP data available</h2>
        <Link href="/cap-analytics/data">
          <Button className="gap-2"><Upload className="w-4 h-4" />Upload CAP PDF</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Candidate List</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dashData.batch.roundLabel} — {initialData.total.toLocaleString()} records
          </p>
        </div>
      </div>

      <CandidatePageClient
        batchId={dashData.batch.id}
        initialData={initialData}
      />
    </div>
  );
}
