"use client";

import { Badge } from "@/components/ui/badge";

interface FeeStatusBadgeProps {
  feeStatus: string | null;
  totalFee: number | null;
  amountPaid: number | null;
}

export function FeeStatusBadge({ feeStatus, totalFee, amountPaid }: FeeStatusBadgeProps) {
  if (totalFee === 0 || feeStatus === "NO_FEE" || feeStatus === "No Fee") {
    return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">No Fee</Badge>;
  }

  const status = feeStatus ?? "Unpaid";

  const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    Unpaid: { label: "Unpaid", variant: "outline" },
    Partially_Paid: { label: "Partially Paid", variant: "secondary" },
    Fully_Paid: { label: "Fully Paid", variant: "default" },
    NO_FEE: { label: "No Fee", variant: "outline" },
  };

  const c = config[status] ?? { label: status, variant: "outline" as const };

  return <Badge variant={c.variant}>{c.label}</Badge>;
}
