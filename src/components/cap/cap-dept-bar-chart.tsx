"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DeptEntry {
  id: string;
  code: string;
  department: { name: string };
  sanctionIntake: number;
  filledSeats: number;
  vacantSeats: number;
}

interface CapDeptBarChartProps {
  choiceCodes: DeptEntry[];
}

export function CapDeptBarChart({ choiceCodes }: CapDeptBarChartProps) {
  const data = choiceCodes.map((cc) => {
    const rawDept = cc.department.name
      .replace(" Engineering", "")
      .replace("Electronics and Telecommunication", "E&TC")
      .replace("Computer", "Comp.")
      .replace("Electrical", "Elect.")
      .replace("Mechanical", "Mech.");

    const seatType = cc.code.endsWith("T") || cc.code.includes("TFWS")
      ? "TFWS"
      : cc.code.endsWith("E") || cc.code.includes("EWS")
      ? "EWS"
      : "General";

    return {
      name: `${rawDept} (${seatType})`,
      Filled: cc.filledSeats,
      Vacant: cc.vacantSeats,
      Intake: cc.sanctionIntake,
    };
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Department Seat Fill Overview</CardTitle>
        <p className="text-xs text-muted-foreground">Filled vs. Vacant per choice code (General, TFWS, EWS)</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 65 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              />
              <Bar dataKey="Filled" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Vacant" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
