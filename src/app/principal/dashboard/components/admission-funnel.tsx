"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface AdmissionFunnelProps {
  data: {
    funnelStages: { key: string; label: string; count: number }[];
    exceptionCounts: { onHold: number; rejected: number };
  };
}

export function AdmissionFunnel({ data }: AdmissionFunnelProps) {
  const chartData = data.funnelStages.map((stage) => ({
    name: stage.label,
    count: stage.count,
  }));

  const colors = [
    "#94a3b8", // DRAFT - slate
    "#60a5fa", // FORMS_COMPLETE - blue
    "#38bdf8", // DOCS_IN_PROGRESS - sky
    "#818cf8", // DOCS_VERIFIED - indigo
    "#a78bfa", // FEE_RECORDED - violet
    "#f59e0b", // PENDING_FINAL_VERIFICATION - amber
    "#10b981", // ADMITTED - emerald
  ];

  return (
    <Card className="rounded-xl border border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Admission Funnel Overview</CardTitle>
          <CardDescription className="text-xs">
            Distribution of applicants across complete lifecycle stages
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
            On Hold: <span className="font-mono font-bold ml-1">{data.exceptionCounts.onHold}</span>
          </Badge>
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30">
            Rejected: <span className="font-mono font-bold ml-1">{data.exceptionCounts.rejected}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <XAxis type="number" allowDecimals={false} stroke="#888888" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={160}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  borderColor: "rgba(51, 65, 85, 0.5)",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [`${value} Students`, "Count"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
