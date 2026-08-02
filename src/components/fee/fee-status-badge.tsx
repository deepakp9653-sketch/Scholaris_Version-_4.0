"use client";

import { Badge } from "@/components/ui/badge";

interface FeeStatusBadgeProps {
  feeStatus: string | null;
  totalFee: number | null;
  amountPaid: number | null;
}

export function FeeStatusBadge({ feeStatus, totalFee, amountPaid }: FeeStatusBadgeProps) {
  if (!totalFee || totalFee === 0) {
    return <Badge variant="outline">No Fee</Badge>;
  }

  const status = feeStatus ?? "Unpaid";

  const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    Unpaid: { label: "Unpaid", variant: "outline" },
    Partially_Paid: { label: "Partially Paid", variant: "secondary" },
    Fully_Paid: { label: "Fully Paid", variant: "default" },
  };

  const c = config[status] ?? { label: status, variant: "outline" as const };

  return <Badge variant={c.variant}>{c.label}</Badge>;
}
