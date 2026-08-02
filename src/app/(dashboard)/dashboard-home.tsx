"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShieldCheck, DollarSign, BarChart3, ArrowRight, Upload, Sparkles } from "lucide-react";
import Link from "next/link";
import type { DashboardStats } from "@/lib/actions/pipeline";

interface DashboardUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

export function DashboardHome({ user, stats }: { user: DashboardUser; stats: DashboardStats }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Top Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Welcome back, {user.name || "Admin"} • System operational</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cap-analytics/data">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Upload className="w-3.5 h-3.5" />
              Upload CAP PDF
            </Button>
          </Link>
          <Link href="/admissions/new">
            <Button size="sm" className="gap-2 text-xs shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              New Admission
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Banner — CAP Phase 1 + Admission Phase 2 Pipeline Quick Access */}
      <div className="rounded-2xl bg-[#FFF7ED] p-6 text-amber-950 border border-amber-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-300/70 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Phase 1 CAP → Phase 2 Admission Automated Pipeline</span>
          </div>
          <h2 className="text-xl font-bold text-[#431407] tracking-tight">
            Integrated CAP Seat Analytics & Admission Intake
          </h2>
          <p className="text-xs text-[#7C2D12] leading-relaxed font-normal">
            Upload CET provisional allotment lists, explore live seat matrices, and auto-fetch candidate data into student admission profiles with a single click.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 z-10">
          <Link href="/cap-analytics">
            <Button className="bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold px-4 py-2.5 rounded-xl gap-2 shadow-xs transition-all border border-orange-600">
              <BarChart3 className="w-4 h-4 text-white" />
              <span>CAP Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today&apos;s Admissions
            </CardTitle>
            <div className="p-2 rounded-xl bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono text-foreground">{stats.todayNewAdmissions}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Direct intake & CAP imported</p>
          </CardContent>
        </Card>

        <Link href="/final-verification" className="block">
          <Card className="cursor-pointer hover:shadow-sm transition-shadow hover:border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending Verifications
              </CardTitle>
              <div className="p-2 rounded-xl bg-pending/10">
                <ShieldCheck className="h-4 w-4 text-pending" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-mono text-foreground">{stats.pendingVerifications}</p>
              <p className="text-[11px] text-pending font-medium mt-1">Awaiting admin password gate</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/pipeline" className="block">
          <Card className="cursor-pointer hover:shadow-sm transition-shadow hover:border-primary/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending Fee Balances
              </CardTitle>
              <div className="p-2 rounded-xl bg-blocked/10">
                <DollarSign className="h-4 w-4 text-blocked" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-mono text-foreground">{stats.pendingFeeBalances}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Unpaid or installment records</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5 flex items-center justify-between border-border hover:border-primary/40 transition-colors">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">CAP Round Allotment Analytics</h3>
            <p className="text-xs text-muted-foreground">Parse CET PDFs, inspect filled/vacant seats, and view choice code breakdown.</p>
          </div>
          <Link href="/cap-analytics">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
              Open <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="p-5 flex items-center justify-between border-border hover:border-primary/40 transition-colors">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">Admission Intake Pipeline</h3>
            <p className="text-xs text-muted-foreground">Track 5-form wizard progress, document verification, and printing.</p>
          </div>
          <Link href="/pipeline">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
              Open <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
