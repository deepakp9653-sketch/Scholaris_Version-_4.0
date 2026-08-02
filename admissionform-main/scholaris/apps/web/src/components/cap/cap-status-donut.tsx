"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusEntry {
  label: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  "Betterment in Choice Code": "#B5622F",
  "Betterment in Seat Type": "#C99A3D",
  "No Change": "#7A9471",
  "Admitted to Institute": "#2B6CB0",
  "Newly Allotted": "#6B46C1",
  "Standard / Direct Allotment": "#718096",
  "Vacant Seat": "#E53E3E",
};

interface CapStatusDonutProps {
  statusCounts: StatusEntry[];
  total: number;
}

export function CapStatusDonut({ statusCounts, total }: CapStatusDonutProps) {
  const data = statusCounts.map((s) => ({
    name: s.label,
    value: s.count,
    color: STATUS_COLORS[s.label] ?? "#A0AEC0",
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Allotment Status Breakdown</CardTitle>
        <p className="text-xs text-muted-foreground">{total} total records</p>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5 mt-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-surface-muted">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground truncate max-w-[160px]">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
