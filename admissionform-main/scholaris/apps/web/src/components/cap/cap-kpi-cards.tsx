"use client";

import { Users, UserCheck, UserX, Layers, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CapKpiCardsProps {
  summary: {
    totalSanctionIntake: number;
    totalFilled: number;
    totalVacant: number;
    totalChoiceCodes: number;
    fillRate: string;
  };
}

const cards = [
  {
    key: "totalSanctionIntake",
    label: "Sanctioned Intake",
    icon: Users,
    color: "text-foreground",
    bg: "bg-surface-muted",
  },
  {
    key: "totalFilled",
    label: "Filled Seats",
    icon: UserCheck,
    color: "text-success",
    bg: "bg-success/10",
    badge: "fillRate",
    badgeSuffix: "% filled",
    trend: "up",
  },
  {
    key: "totalVacant",
    label: "Vacant Seats",
    icon: UserX,
    color: "text-pending",
    bg: "bg-pending/10",
    trend: "down",
  },
  {
    key: "totalChoiceCodes",
    label: "Choice Codes",
    icon: Layers,
    color: "text-foreground",
    bg: "bg-surface-muted",
  },
] as const;

export function CapKpiCards({ summary }: CapKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = summary[card.key as keyof typeof summary];
        return (
          <Card key={card.key} className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`p-2 rounded-xl ${card.bg}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end gap-2">
                <span className={`text-3xl font-bold font-mono ${card.color}`}>{value}</span>
                {"badge" in card && card.badge && (
                  <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full mb-1">
                    {summary[card.badge as keyof typeof summary]}{card.badgeSuffix}
                  </span>
                )}
              </div>
              {"trend" in card && card.trend && (
                <div className="flex items-center gap-1 mt-1">
                  {card.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-pending" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {card.trend === "up" ? "Above target" : "Needs attention"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
