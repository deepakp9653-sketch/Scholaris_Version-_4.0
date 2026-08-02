"use client";

import { useEffect, useState } from "react";
import { CATEGORY_META } from "@/lib/admission-phase-ui";
import { getPhaseStatus, getPhaseEnd } from "@/lib/admission-phase-status";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarClock, CheckCircle2, Clock, Sparkles } from "lucide-react";
import type { AdmissionPhaseCategory } from "@prisma/client";

export interface SerializedPhase {
  id: string;
  academicYear: string;
  srNo: number;
  category: AdmissionPhaseCategory;
  activity: string;
  shortLabel: string;
  firstDate: string;
  lastDate: string | null;
}

const CATEGORY_ORDER: AdmissionPhaseCategory[] = [
  "GENERAL",
  "CAP_ROUND_1",
  "CAP_ROUND_2",
  "CAP_ROUND_3",
  "CAP_ROUND_4",
  "INSTITUTE_LEVEL",
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function AdmissionTimelineList({ phases }: { phases: SerializedPhase[] }) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    meta: CATEGORY_META[cat],
    items: phases.filter((p) => p.category === cat).sort((a, b) => a.srNo - b.srNo),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <Card key={group.category} className="overflow-hidden border border-border shadow-sm">
          {/* Colored Section Header */}
          <div className={`px-5 py-3.5 flex items-center justify-between ${group.meta.barColor} text-white`}>
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 opacity-90" />
              <h2 className="font-bold text-sm tracking-wide uppercase">{group.meta.label}</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
              {group.items.length} Activities
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">Sr.</th>
                  <th className="py-3 px-4">Activity Details</th>
                  <th className="py-3 px-4 w-36">Start Date</th>
                  <th className="py-3 px-4 w-36">End Date</th>
                  <th className="py-3 px-4 w-36 text-center">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {group.items.map((phase) => {
                  const status = getPhaseStatus(phase, now);
                  const isOngoing = status === "ongoing";

                  return (
                    <tr
                      key={phase.id}
                      className={`transition-colors ${
                        isOngoing
                          ? "bg-emerald-500/10 border-l-4 border-emerald-500 font-medium"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                        {phase.srNo}
                      </td>
                      <td className="py-3.5 px-4 text-foreground leading-relaxed">
                        <div className="flex items-center gap-2">
                          {isOngoing && (
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                          )}
                          <span>{phase.activity}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {formatDate(phase.firstDate)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {formatDate(phase.lastDate)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {status === "ongoing" && (
                          <Badge className="bg-emerald-600 text-white gap-1 text-[11px] font-semibold px-2.5 py-0.5">
                            <Clock className="w-3 h-3 animate-spin" /> Ongoing now
                          </Badge>
                        )}
                        {status === "upcoming" && (
                          <Badge variant="outline" className="text-slate-600 border-slate-300 gap-1 text-[11px]">
                            <CalendarClock className="w-3 h-3" /> Upcoming
                          </Badge>
                        )}
                        {status === "completed" && (
                          <Badge variant="secondary" className="text-muted-foreground gap-1 text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-muted-foreground" /> Completed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="block md:hidden divide-y divide-border/60">
            {group.items.map((phase) => {
              const status = getPhaseStatus(phase, now);
              const isOngoing = status === "ongoing";

              return (
                <div
                  key={phase.id}
                  className={`p-4 space-y-3 ${
                    isOngoing ? "bg-emerald-500/10 border-l-4 border-emerald-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Sr. #{phase.srNo}
                    </span>
                    <div>
                      {status === "ongoing" && (
                        <Badge className="bg-emerald-600 text-white gap-1 text-[10px]">
                          Ongoing now
                        </Badge>
                      )}
                      {status === "upcoming" && (
                        <Badge variant="outline" className="text-slate-600 text-[10px]">
                          Upcoming
                        </Badge>
                      )}
                      {status === "completed" && (
                        <Badge variant="secondary" className="text-muted-foreground text-[10px]">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground leading-snug">{phase.activity}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
                    <div>
                      <span className="font-semibold text-foreground/70">Start:</span> {formatDate(phase.firstDate)}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground/70">End:</span> {formatDate(phase.lastDate)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
