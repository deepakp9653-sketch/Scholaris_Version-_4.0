"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeeStatusBadge } from "@/components/fee/fee-status-badge";
import { formatClientDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Calendar, Filter, FileSpreadsheet } from "lucide-react";

interface AdmittedRecord {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  studentProfile: {
    fullNameSurname: string | null;
    fullNameFirst: string | null;
    fullNameFather?: string | null;
    fatherName?: string | null;
    branchCourse: string | null;
    category: string | null;
    mobileNo: string | null;
    email: string | null;
    admissionYearStart: number | null;
  } | null;
  feeRecord: {
    feeStatus: string;
    totalFeeAmount: number | null;
    amountPaid: number | null;
  } | null;
  admittedStudent: {
    admittedAt: Date;
  } | null;
}

interface RegistryClientProps {
  records: AdmittedRecord[];
}

function getLocalYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function matchesBranch(branchCourse: string | null | undefined, target: string): boolean {
  if (target === "ALL") return true;
  const b = (branchCourse || "").toUpperCase();

  if (target === "COMPUTER") {
    return b.includes("COMP") || b.includes("COMPUTER");
  }
  if (target === "ENTC" || target === "E&TC") {
    return b.includes("ELECTRONIC") || b.includes("ENTC") || b.includes("E&TC") || b.includes("ETC") || b.includes("TELECOM");
  }
  if (target === "ELECTRICAL") {
    return b.includes("ELECTRICAL") || b.includes("ELECT") || b.includes("ELECTRIC");
  }
  if (target === "MECHANICAL") {
    return b.includes("MECHANIC") || b.includes("MECH");
  }
  if (target === "CIVIL") {
    return b.includes("CIVIL");
  }
  return b.includes(target);
}

export function RegistryClient({ records: initialRecords }: RegistryClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "custom">("all");
  const [customDate, setCustomDate] = useState("");
  const [selectedExportBranch, setSelectedExportBranch] = useState("ALL");

  const todayStr = getLocalYYYYMMDD(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalYYYYMMDD(yesterdayDate);

  const filtered = initialRecords.filter((r) => {
    // 1. Text Search Filter
    if (search) {
      const father = r.studentProfile?.fullNameFather || r.studentProfile?.fatherName;
      const name = [r.studentProfile?.fullNameSurname, r.studentProfile?.fullNameFirst, father]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const branch = (r.studentProfile?.branchCourse ?? "").toLowerCase();
      const q = search.toLowerCase();
      if (!name.includes(q) && !branch.includes(q)) return false;
    }

    // 2. Date Filter
    if (dateFilter !== "all") {
      const rawDate = r.admittedStudent?.admittedAt || r.updatedAt || r.createdAt;
      if (!rawDate) return false;
      const recDateStr = getLocalYYYYMMDD(new Date(rawDate));

      if (dateFilter === "today" && recDateStr !== todayStr) return false;
      if (dateFilter === "yesterday" && recDateStr !== yesterdayStr) return false;
      if (dateFilter === "custom" && customDate && recDateStr !== customDate) return false;
    }

    // 3. Branch Filter
    if (selectedExportBranch !== "ALL") {
      if (!matchesBranch(r.studentProfile?.branchCourse, selectedExportBranch)) return false;
    }

    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Admitted Students Registry
            </h1>
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded-lg border border-emerald-600/30">
              <select
                value={selectedExportBranch}
                onChange={(e) => setSelectedExportBranch(e.target.value)}
                className="h-7 rounded border border-emerald-600/30 bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">All Branches</option>
                <option value="COMPUTER">Computer Engineering</option>
                <option value="ENTC">Electronics & Telecomm (E&TC)</option>
                <option value="ELECTRICAL">Electrical Engineering</option>
                <option value="MECHANICAL">Mechanical Engineering</option>
                <option value="CIVIL">Civil Engineering</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`/api/registry/export-excel?branch=${selectedExportBranch}`, "_blank")}
                className="h-7 text-xs gap-1.5 border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-semibold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export Excel (.xlsx)
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} admitted student{filtered.length !== 1 ? "s" : ""}
            {dateFilter !== "all" || search ? ` (filtered from ${initialRecords.length})` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Selection */}
          <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-border text-xs">
            <Filter className="w-3.5 h-3.5 ml-1.5 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setDateFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateFilter === "all" ? "bg-background text-foreground font-medium shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Dates
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("today")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateFilter === "today" ? "bg-background text-foreground font-medium shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("yesterday")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateFilter === "yesterday" ? "bg-background text-foreground font-medium shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("custom")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateFilter === "custom" ? "bg-background text-foreground font-medium shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Specific Date
            </button>
          </div>

          {/* Custom Date Picker Input */}
          {dateFilter === "custom" && (
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-8 text-xs max-w-[150px]"
              />
            </div>
          )}

          {/* Search Box */}
          <Input
            placeholder="Search by name or branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-60 h-8 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {search || dateFilter !== "all"
              ? "No student records match your search and date filter criteria."
              : "No admitted students recorded in registry yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-background shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/70 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="text-left py-3 px-3">Name</th>
                <th className="text-left py-3 px-3">Branch</th>
                <th className="text-left py-3 px-3">Category</th>
                <th className="text-left py-3 px-3">Year</th>
                <th className="text-left py-3 px-3">Fee Status</th>
                <th className="text-left py-3 px-3">Admitted On</th>
                <th className="text-left py-3 px-3">Contact</th>
                <th className="text-right py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((record) => {
                const father = record.studentProfile?.fullNameFather || record.studentProfile?.fatherName;
                const name = [record.studentProfile?.fullNameSurname, record.studentProfile?.fullNameFirst, father]
                  .filter(Boolean)
                  .join(" ") || "Unnamed Student";

                const admissionDateVal = record.admittedStudent?.admittedAt || record.updatedAt || record.createdAt;

                return (
                  <tr key={record.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-foreground">{name}</td>
                    <td className="py-3 px-3 text-muted-foreground">{record.studentProfile?.branchCourse ?? "-"}</td>
                    <td className="py-3 px-3 text-muted-foreground">{record.studentProfile?.category ?? "-"}</td>
                    <td className="py-3 px-3 text-muted-foreground">{record.studentProfile?.admissionYearStart ?? "2026"}</td>
                    <td className="py-3 px-3">
                      <FeeStatusBadge
                        feeStatus={record.feeRecord?.feeStatus ?? null}
                        totalFee={record.feeRecord?.totalFeeAmount ?? null}
                        amountPaid={record.feeRecord?.amountPaid ?? null}
                      />
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground" suppressHydrationWarning>
                      {formatClientDate(admissionDateVal)}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-xs">
                      <div className="font-medium text-foreground">{record.studentProfile?.mobileNo ?? "-"}</div>
                      <div className="truncate max-w-[160px] text-muted-foreground">{record.studentProfile?.email ?? "-"}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 font-medium border-primary/40 text-primary hover:bg-primary/5 shadow-2xs"
                          onClick={() => window.open(`/admissions/${record.id}/preview`, "_blank")}
                        >
                          Preview &amp; Download Form Dossier
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
