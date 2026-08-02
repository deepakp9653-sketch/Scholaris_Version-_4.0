"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeeStatusBadge } from "@/components/fee/fee-status-badge";
import { formatClientDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface AdmittedRecord {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  studentProfile: {
    fullNameSurname: string | null;
    fullNameFirst: string | null;
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

export function RegistryClient({ records: initialRecords }: RegistryClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = search
    ? initialRecords.filter((r) => {
        const name = [r.studentProfile?.fullNameSurname, r.studentProfile?.fullNameFirst].filter(Boolean).join(" ").toLowerCase();
        const branch = (r.studentProfile?.branchCourse ?? "").toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || branch.includes(q);
      })
    : initialRecords;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Admitted Students Registry
          </h1>
          <p className="text-sm text-muted-foreground">
            {initialRecords.length} admitted student{initialRecords.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Input
          placeholder="Search by name or branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {search ? "No records match your search." : "No admitted students yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="text-left py-3 px-3 font-medium">Name</th>
                <th className="text-left py-3 px-3 font-medium">Branch</th>
                <th className="text-left py-3 px-3 font-medium">Category</th>
                <th className="text-left py-3 px-3 font-medium">Year</th>
                <th className="text-left py-3 px-3 font-medium">Fee Status</th>
                <th className="text-left py-3 px-3 font-medium">Admitted On</th>
                <th className="text-left py-3 px-3 font-medium">Contact</th>
                <th className="text-right py-3 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const name = [record.studentProfile?.fullNameSurname, record.studentProfile?.fullNameFirst]
                  .filter(Boolean)
                  .join(" ") || "Unnamed";

                return (
                  <tr key={record.id} className="border-b border-border/50 hover:bg-surface-muted/50">
                    <td className="py-2.5 px-3 font-medium">{name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{record.studentProfile?.branchCourse ?? "-"}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{record.studentProfile?.category ?? "-"}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{record.studentProfile?.admissionYearStart ?? "-"}</td>
                    <td className="py-2.5 px-3">
                      <FeeStatusBadge
                        feeStatus={record.feeRecord?.feeStatus ?? null}
                        totalFee={record.feeRecord?.totalFeeAmount ?? null}
                        amountPaid={record.feeRecord?.amountPaid ?? null}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground" suppressHydrationWarning>
                      {formatClientDate(record.admittedStudent?.admittedAt)}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">
                      <div>{record.studentProfile?.mobileNo ?? ""}</div>
                      <div className="truncate max-w-[150px]">{record.studentProfile?.email ?? ""}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 font-medium border-primary/40 text-primary hover:bg-primary/5"
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
