"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getPhaseStatus, getPhaseEnd } from "@/lib/admission-phase-status";
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

const CATEGORY_PRIORITY: Record<AdmissionPhaseCategory, number> = {
  CAP_ROUND_1: 10,
  CAP_ROUND_2: 10,
  CAP_ROUND_3: 10,
  CAP_ROUND_4: 10,
  GENERAL: 5,
  INSTITUTE_LEVEL: 1,
};

function formatTimeRemaining(diffMs: number): string {
  if (diffMs <= 0) return "00:00:00";
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");

  if (days > 0) {
    return `${days}d ${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}:${ss}`;
}

export function AdmissionCountdownBar({ phases }: { phases: SerializedPhase[] }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    const tickTimer = setInterval(() => {
      if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const debugDate = urlParams.get("debugDate");
        if (debugDate) {
          setNow(new Date(`${debugDate}T12:00:00+05:30`));
          return;
        }
      }
      setNow(new Date());
    }, 1000);

    return () => clearInterval(tickTimer);
  }, []);

  const activeState = useMemo(() => {
    if (!phases || phases.length === 0) return null;

    // 1. Ongoing phases
    const ongoing = phases.filter((p) => getPhaseStatus(p, now) === "ongoing");
    if (ongoing.length > 0) {
      ongoing.sort((a, b) => {
        const pA = CATEGORY_PRIORITY[a.category] || 0;
        const pB = CATEGORY_PRIORITY[b.category] || 0;
        if (pB !== pA) return pB - pA;
        return new Date(a.firstDate).getTime() - new Date(b.firstDate).getTime();
      });

      const activePhase = ongoing[0];
      const target = getPhaseEnd(activePhase);
      const diff = target.getTime() - now.getTime();

      return {
        mode: "ends-in" as const,
        phase: activePhase,
        label: `${activePhase.shortLabel} — closes in`,
        timeStr: formatTimeRemaining(diff),
      };
    }

    // 2. Future phases
    const future = phases
      .filter((p) => new Date(p.firstDate).getTime() > now.getTime())
      .sort((a, b) => new Date(a.firstDate).getTime() - new Date(b.firstDate).getTime());

    if (future.length > 0) {
      const nextPhase = future[0];
      const target = new Date(nextPhase.firstDate);
      const diff = target.getTime() - now.getTime();

      return {
        mode: "starts-in" as const,
        phase: nextPhase,
        label: `Next: ${nextPhase.shortLabel} — opens in`,
        timeStr: formatTimeRemaining(diff),
      };
    }

    // 3. Concluded
    return {
      mode: "completed" as const,
      phase: null,
      label: "Admission process for 2026-27 has concluded.",
      timeStr: null,
    };
  }, [phases, now]);

  return (
    <Link
      href="/admissions/timeline"
      className="sticky top-0 z-50 h-9 bg-slate-900 text-slate-100 text-xs font-medium flex items-center justify-between px-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors shrink-0"
      suppressHydrationWarning
    >
      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden" suppressHydrationWarning>
        {(!mounted || !activeState || activeState.mode === "completed") ? (
          <span className="h-2 w-2 rounded-full bg-slate-500 shrink-0"></span>
        ) : activeState.mode === "ends-in" ? (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0"></span>
        )}

        <span className="truncate text-slate-200" suppressHydrationWarning>
          {mounted && activeState ? activeState.label : "Loading Admission Schedule..."}
        </span>
      </div>

      {mounted && activeState?.timeStr && (
        <div className="flex items-center gap-1.5 shrink-0 ml-3" suppressHydrationWarning>
          <span className="font-mono tabular-nums font-semibold bg-white/10 text-emerald-300 px-2 py-0.5 rounded text-[11px] tracking-wider shadow-inner" suppressHydrationWarning>
            {activeState.timeStr}
          </span>
        </div>
      )}
    </Link>
  );
}
