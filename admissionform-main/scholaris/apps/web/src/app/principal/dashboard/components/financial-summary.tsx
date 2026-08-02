import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee, CreditCard, Banknote, Landmark } from "lucide-react";

interface FinancialSummaryProps {
  data: {
    totalFeeAmount: number;
    totalAmountPaid: number;
    totalRemainingBalance: number;
    modeBreakdown: { mode: string; count: number; amount: number }[];
  };
}

export function FinancialSummary({ data }: FinancialSummaryProps) {
  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getModeIcon = (mode: string) => {
    switch (mode.toUpperCase()) {
      case "CASH":
        return Banknote;
      case "UPI":
      case "RTGS":
      case "BANK_TO_BANK":
        return Landmark;
      default:
        return CreditCard;
    }
  };

  return (
    <Card className="rounded-xl border border-border/60 bg-card/95 shadow-sm h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-emerald-500" />
            Financial Collection Summary
          </CardTitle>
          <CardDescription className="text-xs">
            Overall revenue aggregates and payment method distribution
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/40 border border-border/40">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Billed</p>
              <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                {formatRupees(data.totalFeeAmount)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-medium">Collected</p>
              <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatRupees(data.totalAmountPaid)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-medium">Outstanding</p>
              <p className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {formatRupees(data.totalRemainingBalance)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Payment Mode Breakdown</p>
            {data.modeBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">No payment transactions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {data.modeBreakdown.map((item) => {
                  const Icon = getModeIcon(item.mode);
                  const percentage =
                    data.totalAmountPaid > 0
                      ? Math.round((item.amount / data.totalAmountPaid) * 100)
                      : 0;

                  return (
                    <div
                      key={item.mode}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{item.mode}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.count} {item.count === 1 ? "transaction" : "transactions"} ({percentage}%)
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-bold font-mono text-foreground">
                        {formatRupees(item.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
