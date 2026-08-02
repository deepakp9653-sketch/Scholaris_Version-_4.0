"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChoiceCodeEntry {
  id: string;
  code: string;
  variant: string;
  statusLabel: string | null;
  sanctionIntake: number;
  capSeats: number;
  msSeats: number;
  minoritySeats: number;
  aiSeats: number;
  instituteSeats: number;
  filledSeats: number;
  vacantSeats: number;
  department: { name: string };
}

interface CapChoiceCodeMatrixProps {
  choiceCodes: ChoiceCodeEntry[];
}

export function CapChoiceCodeMatrix({ choiceCodes }: CapChoiceCodeMatrixProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Choice Code Full Matrix</CardTitle>
        <p className="text-xs text-muted-foreground">Complete seat breakdown per department block</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-muted-foreground uppercase tracking-wide font-semibold text-[10.5px]">
                <th className="py-2.5 px-3 text-left">Code</th>
                <th className="py-2.5 px-3 text-left">Department</th>
                <th className="py-2.5 px-3 text-center">Variant</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Sanction</th>
                <th className="py-2.5 px-3 text-right">CAP Seats</th>
                <th className="py-2.5 px-3 text-right">MS Seats</th>
                <th className="py-2.5 px-3 text-right">AI Seats</th>
                <th className="py-2.5 px-3 text-right">Filled</th>
                <th className="py-2.5 px-3 text-right">Vacant</th>
                <th className="py-2.5 px-3 text-center">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {choiceCodes.map((cc) => {
                const occ = cc.sanctionIntake > 0 ? Math.round((cc.filledSeats / cc.sanctionIntake) * 100) : 0;
                return (
                  <tr key={cc.id} className="hover:bg-accent/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">{cc.code}</td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{cc.department.name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${cc.variant === "EWS" ? "bg-pending/20 text-pending" :
                          cc.variant === "TFWS" ? "bg-success/20 text-success" :
                          "bg-surface-muted text-muted-foreground border border-border"}`}>
                        {cc.variant}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{cc.statusLabel ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{cc.sanctionIntake}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{cc.capSeats}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{cc.msSeats}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{cc.aiSeats}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-success">{cc.filledSeats}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-pending">{cc.vacantSeats}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold w-8">{occ}%</span>
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${occ >= 90 ? "bg-success" : occ >= 70 ? "bg-pending" : "bg-blocked"}`}
                            style={{ width: `${Math.min(100, occ)}%` }}
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
