"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DeptEntry {
  id: string;
  code: string;
  department: { name: string };
  variant: string;
  sanctionIntake: number;
  filledSeats: number;
  vacantSeats: number;
}

interface CapDeptSummaryTableProps {
  choiceCodes: DeptEntry[];
  batchId: string;
}

export function CapDeptSummaryTable({ choiceCodes, batchId }: CapDeptSummaryTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">Choice Code Summary</CardTitle>
          <p className="text-xs text-muted-foreground">Seat fill status per department block</p>
        </div>
        <Link href={`/cap-analytics/departments?batchId=${batchId}`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            Full Matrix <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wide font-semibold text-[10.5px]">
                <th className="py-2 px-3 text-left">Code</th>
                <th className="py-2 px-3 text-left">Department</th>
                <th className="py-2 px-3 text-left">Variant</th>
                <th className="py-2 px-3 text-right">Intake</th>
                <th className="py-2 px-3 text-right">Filled</th>
                <th className="py-2 px-3 text-right">Vacant</th>
                <th className="py-2 px-3">Fill Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {choiceCodes.slice(0, 10).map((cc) => {
                const fillRate = cc.sanctionIntake > 0 ? Math.round((cc.filledSeats / cc.sanctionIntake) * 100) : 0;
                return (
                  <tr key={cc.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">{cc.code}</td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{cc.department.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold
                        ${cc.variant === "EWS" ? "bg-pending/20 text-pending" :
                          cc.variant === "TFWS" ? "bg-success/20 text-success" :
                          "bg-surface-muted text-muted-foreground"}`}>
                        {cc.variant}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{cc.sanctionIntake}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-success">{cc.filledSeats}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-pending">{cc.vacantSeats}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold w-8">{fillRate}%</span>
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${fillRate >= 90 ? "bg-success" : fillRate >= 70 ? "bg-pending" : "bg-blocked"}`}
                            style={{ width: `${Math.min(100, fillRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
