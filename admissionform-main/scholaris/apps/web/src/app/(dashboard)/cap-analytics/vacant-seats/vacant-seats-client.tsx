"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Search,
  PieChart,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
  Info,
  Sparkles,
  Layers,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SubcategoryItem {
  label: string;
  total: number;
  filled: number;
  vacant: number;
}

interface CategoryAnalysisItem {
  category: string;
  sanctioned: number;
  filled: number;
  vacant: number;
  vacancyRate: number;
  subcategories: SubcategoryItem[];
}

interface SpecialSeatItem {
  label: string;
  total: number;
  filled: number;
  vacant: number;
}

interface DepartmentAnalysisItem {
  choiceCode: string;
  departmentName: string;
  shortCode: string;
  sanctionIntake: number;
  msSeats: number;
  minoritySeats: number;
  allIndiaSeats: number;
  instituteSeats: number;
  orphanI: number;
  orphanN: number;
  ewsSeats: number;
  tfwsCode: string;
  tfwsSeats: number;
  totalSanctioned: number;
  grandTotalFilled: number;
  grandTotalVacant: number;
  overallVacancyRate: number;
  managementSection?: {
    total: number;
    filled: number;
    vacant: number;
    vacancyRate: number;
  };
  specialSeats: SpecialSeatItem[];
  categories: CategoryAnalysisItem[];
}

interface Props {
  data: {
    instituteSummary: {
      totalIntake: number;
      totalFilled: number;
      totalVacant: number;
      overallVacancyRate: number;
    };
    departments: DepartmentAnalysisItem[];
  };
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  OPEN: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", bar: "bg-slate-700" },
  SC: { bg: "bg-purple-100", text: "text-purple-900", border: "border-purple-300", bar: "bg-purple-600" },
  ST: { bg: "bg-indigo-100", text: "text-indigo-900", border: "border-indigo-300", bar: "bg-indigo-600" },
  "VJ/DT": { bg: "bg-blue-100", text: "text-blue-900", border: "border-blue-300", bar: "bg-blue-600" },
  NTB: { bg: "bg-cyan-100", text: "text-cyan-900", border: "border-cyan-300", bar: "bg-cyan-600" },
  NTC: { bg: "bg-teal-100", text: "text-teal-900", border: "border-teal-300", bar: "bg-teal-600" },
  NTD: { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-300", bar: "bg-emerald-600" },
  OBC: { bg: "bg-amber-100", text: "text-amber-900", border: "border-amber-300", bar: "bg-amber-600" },
  SEBC: { bg: "bg-rose-100", text: "text-rose-900", border: "border-rose-300", bar: "bg-rose-600" },
  EWS: { bg: "bg-green-100", text: "text-green-900", border: "border-green-300", bar: "bg-green-600" },
  TFWS: { bg: "bg-orange-100", text: "text-orange-900", border: "border-orange-300", bar: "bg-orange-600" },
  AI: { bg: "bg-sky-100", text: "text-sky-900", border: "border-sky-300", bar: "bg-sky-600" },
  IL: { bg: "bg-violet-100", text: "text-violet-900", border: "border-violet-300", bar: "bg-violet-600" },
};

export function VacantSeatsClient({ data }: Props) {
  const [selectedDeptCode, setSelectedDeptCode] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPoolTab, setSelectedPoolTab] = useState<"ALL" | "CATEGORIES" | "SPECIAL">("ALL");

  const { instituteSummary, departments } = data;

  // Selected department or aggregated
  const activeDept = departments.find((d) => d.choiceCode === selectedDeptCode);

  // Compute active totals
  const activeTotalSanctioned = activeDept
    ? activeDept.totalSanctioned
    : instituteSummary.totalIntake;

  const activeTotalFilled = activeDept
    ? activeDept.grandTotalFilled
    : instituteSummary.totalFilled;

  const activeTotalVacant = activeDept
    ? activeDept.grandTotalVacant
    : instituteSummary.totalVacant;

  const activeVacancyRate = activeTotalSanctioned > 0
    ? Math.round((activeTotalVacant / activeTotalSanctioned) * 100)
    : 0;

  // Aggregated Categories across departments if ALL is selected
  const activeCategories: CategoryAnalysisItem[] = activeDept
    ? activeDept.categories
    : departments[0].categories.map((c, i) => {
        const catName = c.category;
        const totalSanctioned = departments.reduce((acc, d) => acc + (d.categories[i]?.sanctioned || 0), 0);
        const totalFilled = departments.reduce((acc, d) => acc + (d.categories[i]?.filled || 0), 0);
        const totalVacant = Math.max(0, totalSanctioned - totalFilled);
        
        const subcategories = c.subcategories.map((sc, scIdx) => {
          const subTotal = departments.reduce((acc, d) => acc + (d.categories[i]?.subcategories[scIdx]?.total || 0), 0);
          const subFilled = departments.reduce((acc, d) => acc + (d.categories[i]?.subcategories[scIdx]?.filled || 0), 0);
          return {
            label: sc.label,
            total: subTotal,
            filled: subFilled,
            vacant: Math.max(0, subTotal - subFilled),
          };
        });

        return {
          category: catName,
          sanctioned: totalSanctioned,
          filled: totalFilled,
          vacant: totalVacant,
          vacancyRate: totalSanctioned > 0 ? Math.round((totalVacant / totalSanctioned) * 100) : 0,
          subcategories,
        };
      });

  // Filter categories by search
  const filteredCategories = activeCategories.filter((c) =>
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subcategories.some((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-6">
      {/* ── Top Header Banner (Cream/Amber Theme) ── */}
      <div className="rounded-2xl border border-amber-200/80 bg-[#FFF7ED] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-xs font-semibold text-amber-900 border border-amber-300/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Institute Code: 06649
              </span>
              <span className="text-xs font-medium text-amber-700">CAP Round Allotment Analysis</span>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900">
              Vacant Seats Matrix Analysis
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Real-time graphical breakdown of sanctioned intake, filled allotments, and vacant seats left across categories and subcategories.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-amber-300/80 bg-white text-xs text-amber-900 hover:bg-amber-50 shadow-xs"
              onClick={() => window.print()}
            >
              <Download className="w-3.5 h-3.5" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-amber-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sanctioned Seats</span>
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold font-mono text-slate-900">{activeTotalSanctioned}</p>
            <p className="mt-1 text-[11px] text-slate-500">Total Sanctioned Intake</p>
          </div>

          <div className="rounded-xl border border-blue-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Filled Seats</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold font-mono text-blue-700">{activeTotalFilled}</p>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Allotted Seats</span>
              <span className="font-semibold text-blue-600 font-mono">
                {activeTotalSanctioned > 0 ? Math.round((activeTotalFilled / activeTotalSanctioned) * 100) : 0}% Filled
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Vacant Seats Left</span>
              <AlertCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold font-mono text-emerald-700">{activeTotalVacant}</p>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Available For Admissions</span>
              <span className="font-semibold text-emerald-600 font-mono">{activeVacancyRate}% Vacant</span>
            </div>
          </div>

          <div className="rounded-xl border border-purple-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">Vacancy Rate</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold font-mono text-purple-700">{activeVacancyRate}%</p>
            <p className="mt-1 text-[11px] text-slate-500">Vacant Ratio across Pool</p>
          </div>
        </div>
      </div>

      {/* ── Separate Management Seats (Institute Level / MGMT) Section ── */}
      <Card className="border border-violet-200 bg-gradient-to-r from-violet-50/60 via-purple-50/40 to-white shadow-xs">
        <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-violet-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600 text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                Management Seats Quota (Institute Level / MGMT)
                <Badge variant="outline" className="bg-violet-100 text-violet-900 border-violet-300 font-mono text-[11px]">
                  IL Quota
                </Badge>
              </CardTitle>
              <p className="text-xs text-slate-600 mt-0.5">
                Seats reserved under Institute Level Management Quota. Seats remain vacant until student admission form submission.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-black font-mono text-violet-700">
              {departments.reduce((acc, d) => acc + (d.managementSection?.vacant ?? d.instituteSeats), 0)} / {departments.reduce((acc, d) => acc + d.instituteSeats, 0)}
            </div>
            <span className="text-xs font-semibold text-emerald-700">Vacant Management Seats</span>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {departments.map((d) => {
              const total = d.instituteSeats;
              const filled = d.managementSection?.filled ?? 0;
              const vacant = d.managementSection?.vacant ?? d.instituteSeats;
              const vacantRate = d.managementSection?.vacancyRate ?? 100;

              return (
                <div
                  key={d.choiceCode}
                  className={`p-3.5 rounded-xl border transition-all ${
                    total > 0
                      ? "border-violet-200/90 bg-white shadow-2xs hover:border-violet-400"
                      : "border-slate-200 bg-slate-50/50 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{d.shortCode}</span>
                    <Badge variant="outline" className="text-[10px] font-mono border-violet-300 bg-violet-50 text-violet-800">
                      {total} Seats
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{d.departmentName}</p>

                  <div className="mt-3 flex items-baseline justify-between font-mono">
                    <div>
                      <span className="text-xl font-black text-slate-900">{vacant}</span>
                      <span className="text-xs text-slate-500 font-normal"> / {total} Vacant</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{vacantRate}%</span>
                  </div>

                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                    <div className="h-full bg-violet-600" style={{ width: `${total > 0 ? (filled / total) * 100 : 0}%` }} />
                    <div className="h-full bg-emerald-400" style={{ width: `${total > 0 ? (vacant / total) * 100 : 100}%` }} />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-500 font-mono">Filled: {filled}</span>
                    <span className="text-emerald-700 font-semibold font-mono">{vacant} Vacant Left</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Department Selector Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedDeptCode === "ALL" ? "default" : "outline"}
            className="h-8 text-xs font-medium gap-1.5"
            onClick={() => setSelectedDeptCode("ALL")}
          >
            <Layers className="w-3.5 h-3.5" />
            All Departments ({instituteSummary.totalIntake} Seats)
          </Button>

          {departments.map((dept) => (
            <Button
              key={dept.choiceCode}
              size="sm"
              variant={selectedDeptCode === dept.choiceCode ? "default" : "outline"}
              className="h-8 text-xs font-medium gap-1.5"
              onClick={() => setSelectedDeptCode(dept.choiceCode)}
            >
              <Building2 className="w-3.5 h-3.5" />
              {dept.shortCode} ({dept.sanctionIntake})
            </Button>
          ))}
        </div>

        {/* Search & Pool Filter */}
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter by category / quota…"
              className="pl-8 h-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Graphical Category Matrix Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Category & Subcategory Vacancy Distribution
            </h2>
            <p className="text-xs text-muted-foreground">
              Graphical progress comparison of Sanctioned vs Filled vs Vacant Seats for each category
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat) => {
            const style = CATEGORY_COLORS[cat.category] || {
              bg: "bg-slate-100",
              text: "text-slate-800",
              border: "border-slate-300",
              bar: "bg-slate-700",
            };
            const filledPct = cat.sanctioned > 0 ? Math.round((cat.filled / cat.sanctioned) * 100) : 0;
            const vacantPct = cat.sanctioned > 0 ? Math.round((cat.vacant / cat.sanctioned) * 100) : 0;

            return (
              <Card key={cat.category} className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
                <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${style.bg} ${style.text} ${style.border} border`}>
                      {cat.category}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {cat.filled} / {cat.sanctioned} Filled
                    </span>
                  </div>
                  <Badge
                    variant={cat.vacant === 0 ? "secondary" : "outline"}
                    className={cat.vacant > 0 ? "bg-emerald-50 text-emerald-800 border-emerald-300 text-[11px] font-mono" : "text-[11px] font-mono"}
                  >
                    {cat.vacant} Vacant Left
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600">
                      <span>Filled ({filledPct}%)</span>
                      <span className="text-emerald-700 font-semibold">Vacant ({vacantPct}%)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-emerald-100 overflow-hidden flex">
                      <div
                        className={`h-full ${style.bar} transition-all duration-500`}
                        style={{ width: `${filledPct}%` }}
                        title={`Filled: ${cat.filled}`}
                      />
                      <div
                        className="h-full bg-emerald-400/80 transition-all duration-500"
                        style={{ width: `${vacantPct}%` }}
                        title={`Vacant: ${cat.vacant}`}
                      />
                    </div>
                  </div>

                  {/* Subcategory breakdown list */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Subcategory Breakdown
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {cat.subcategories.map((sub) => (
                        <div
                          key={sub.label}
                          className="p-2 rounded-lg bg-surface-muted/60 border border-border/50 flex flex-col justify-between"
                        >
                          <span className="text-[10.5px] font-medium text-slate-600 truncate" title={sub.label}>
                            {sub.label}
                          </span>
                          <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
                            <span className="text-slate-500">{sub.filled}/{sub.total}</span>
                            <span
                              className={`font-bold ${
                                sub.vacant > 0 ? "text-emerald-700" : "text-slate-400"
                              }`}
                            >
                              {sub.vacant} left
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Special Quotas Breakdown (EWS, TFWS, AI, IL, Orphan) ── */}
      {activeDept && activeDept.specialSeats.length > 0 && (
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="p-4 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Special Seats & Quota Analysis ({activeDept.departmentName})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {activeDept.specialSeats.map((sp) => {
                const filledPct = sp.total > 0 ? Math.round((sp.filled / sp.total) * 100) : 0;
                return (
                  <div key={sp.label} className="p-3.5 rounded-xl border border-border/80 bg-surface shadow-2xs space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block truncate" title={sp.label}>
                      {sp.label}
                    </span>
                    <div className="flex items-baseline justify-between font-mono">
                      <span className="text-xl font-bold text-slate-900">{sp.vacant}</span>
                      <span className="text-xs text-slate-500">/ {sp.total} Total</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${filledPct}%` }} />
                    </div>
                    <span className="text-[10.5px] text-emerald-700 font-medium font-mono block text-right">
                      {sp.vacant} Seats Vacant
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Comprehensive Seat Matrix Master Table ── */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="p-4 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Seat Matrix Master Table</CardTitle>
            <p className="text-xs text-muted-foreground">Detailed category and quota breakdown as per official DTE Matrix</p>
          </div>
          <span className="text-xs font-mono bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg">
            Institute Code: 06649
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-muted/80 text-slate-600 font-semibold text-[11px]">
                <th className="py-3 px-3 text-left">Choice Code</th>
                <th className="py-3 px-3 text-left">Department</th>
                <th className="py-3 px-3 text-right">Sanction Intake (SI)</th>
                <th className="py-3 px-3 text-right">MS Seats</th>
                <th className="py-3 px-3 text-right">All India (AI)</th>
                <th className="py-3 px-3 text-right">Institute (IL)</th>
                <th className="py-3 px-3 text-right">EWS Seats</th>
                <th className="py-3 px-3 text-right">TFWS Seats</th>
                <th className="py-3 px-3 text-right">Filled</th>
                <th className="py-3 px-3 text-right">Vacant Left</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {departments.map((d) => (
                <tr key={d.choiceCode} className="hover:bg-accent/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{d.choiceCode}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{d.departmentName}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">{d.sanctionIntake}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{d.msSeats}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{d.allIndiaSeats}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{d.instituteSeats}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{d.ewsSeats}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{d.tfwsSeats}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-bold">{d.grandTotalFilled}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-extrabold">{d.grandTotalVacant}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {d.overallVacancyRate}% Vacant
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
