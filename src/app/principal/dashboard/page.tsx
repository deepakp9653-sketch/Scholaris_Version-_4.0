import {
  getKpiMetrics,
  getAdmissionFunnelData,
  getBranchCategoryRiskData,
  getFinancialSummaryData,
  getExceptionsData,
} from "@/lib/actions/principal-dashboard";
import { KpiStrip } from "./components/kpi-strip";
import { AdmissionFunnel } from "./components/admission-funnel";
import { BranchRiskTable } from "./components/branch-risk-table";
import { FinancialSummary } from "./components/financial-summary";
import { ExceptionsPanel } from "./components/exceptions-panel";
import { RefreshButton } from "./components/refresh-button";

export const metadata = {
  title: "Principal Dashboard | Scholaris",
  description: "Executive read-only admission funnel, seat risk, financial, and exception metrics.",
};

export default async function PrincipalDashboardPage() {
  const [kpis, funnel, branchRisks, financials, exceptions] = await Promise.all([
    getKpiMetrics(),
    getAdmissionFunnelData(),
    getBranchCategoryRiskData(),
    getFinancialSummaryData(),
    getExceptionsData(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Admission Executive Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time read-only oversight across admission funnels, seat allocations, fees, and exceptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton />
        </div>
      </div>

      {/* Zone 1 — KPI Strip */}
      <KpiStrip data={kpis} />

      {/* Zone 2 — Admission Funnel Overview */}
      <AdmissionFunnel data={funnel} />

      {/* Zone 3 — Branch x Category Risk Table */}
      <BranchRiskTable data={branchRisks} />

      {/* Zone 4 — Two-Column Footer Row (Financial Summary Left, Exceptions Right) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FinancialSummary data={financials} />
        <ExceptionsPanel data={exceptions} />
      </div>
    </div>
  );
}
