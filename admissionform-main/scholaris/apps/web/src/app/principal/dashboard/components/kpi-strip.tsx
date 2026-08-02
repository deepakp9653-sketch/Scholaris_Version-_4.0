import { Users, CheckCircle2, IndianRupee, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiStripProps {
  data: {
    totalSeats: number;
    totalAdmitted: number;
    feesCollected: number;
    pendingVerification: number;
  };
}

export function KpiStrip({ data }: KpiStripProps) {
  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const metrics = [
    {
      title: "Total Sanctioned Seats",
      value: data.totalSeats.toLocaleString("en-IN"),
      description: "Institute total intake capacity",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40",
    },
    {
      title: "Total Admitted",
      value: data.totalAdmitted.toLocaleString("en-IN"),
      description: "Confirmed student admissions",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40",
    },
    {
      title: "Fees Collected",
      value: formatRupees(data.feesCollected),
      description: "Total revenue received",
      icon: IndianRupee,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40",
    },
    {
      title: "Pending Verification",
      value: data.pendingVerification.toLocaleString("en-IN"),
      description: "Awaiting final verification",
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/40",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <Card key={i} className="rounded-xl border border-border/60 bg-card/95 shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{m.title}</p>
                <div className={`p-2 rounded-lg border ${m.bg} ${m.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold font-mono text-foreground tracking-tight">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
