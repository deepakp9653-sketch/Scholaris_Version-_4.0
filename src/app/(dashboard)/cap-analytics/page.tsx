"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getCapDashboardData } from "@/lib/actions/cap";
import { CapKpiCards } from "@/components/cap/cap-kpi-cards";
import { CapStatusDonut } from "@/components/cap/cap-status-donut";
import { CapDeptBarChart } from "@/components/cap/cap-dept-bar-chart";
import { CapDeptSummaryTable } from "@/components/cap/cap-dept-summary-table";
import { CapBatchSelector } from "@/components/cap/cap-batch-selector";
import { Building2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function CapAnalyticsOverviewContent() {
  const searchParams = useSearchParams();
  const batchId = searchParams?.get("batchId") ?? undefined;

  const [data, setData] = useState<Awaited<ReturnType<typeof getCapDashboardData>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getCapDashboardData(batchId).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-muted-foreground gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading CAP Analytics…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">No CAP data yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Upload a Maharashtra State CET CAP Round PDF to populate the analytics dashboard.
          </p>
        </div>
        <Link href="/cap-analytics/data">
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload CAP PDF
          </Button>
        </Link>
      </div>
    );
  }

  const { batch, choiceCodes, summary, statusCounts, allBatches } = data;
  const totalCandidates = choiceCodes.reduce((s, cc) => s + cc.filledSeats + cc.vacantSeats, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">CAP Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {batch.roundLabel} • {batch.institute.name.split(",")[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Batch selector */}
          {allBatches.length > 1 && (
            <CapBatchSelector batches={allBatches} currentBatchId={batch.id} />
          )}
          <Link href="/cap-analytics/data">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Upload className="w-3.5 h-3.5" />
              New Upload
            </Button>
          </Link>
        </div>
      </div>

      {/* Institute Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-5 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{batch.roundLabel}</div>
            <h2 className="text-base font-bold">{batch.institute.name}</h2>
          </div>
        </div>
        <div className="text-right text-sm opacity-90">
          <div className="font-mono font-bold text-xl">{summary.fillRate}%</div>
          <div className="text-xs opacity-75">fill rate</div>
        </div>
      </div>

      {/* KPI Cards */}
      <CapKpiCards summary={{
        totalSanctionIntake: summary.totalSanctionIntake,
        totalFilled: summary.totalFilled,
        totalVacant: summary.totalVacant,
        totalChoiceCodes: summary.totalChoiceCodes,
        fillRate: summary.fillRate,
      }} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CapStatusDonut statusCounts={statusCounts} total={totalCandidates} />
        <div className="lg:col-span-2">
          <CapDeptBarChart choiceCodes={choiceCodes as Parameters<typeof CapDeptBarChart>[0]["choiceCodes"]} />
        </div>
      </div>

      {/* Department Summary Table */}
      <CapDeptSummaryTable
        choiceCodes={choiceCodes as Parameters<typeof CapDeptSummaryTable>[0]["choiceCodes"]}
        batchId={batch.id}
      />
    </div>
  );
}

export default function CapAnalyticsOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-12 text-muted-foreground gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading CAP Analytics…</span>
        </div>
      }
    >
      <CapAnalyticsOverviewContent />
    </Suspense>
  );
}
