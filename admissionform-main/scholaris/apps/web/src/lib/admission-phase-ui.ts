import type { AdmissionPhaseCategory } from "@prisma/client";

export const CATEGORY_META: Record<
  AdmissionPhaseCategory,
  { label: string; badge: string; barColor: string }
> = {
  GENERAL:          { label: "General",                  badge: "bg-slate-700 text-white",   barColor: "bg-slate-700" },
  CAP_ROUND_1:      { label: "CAP Round I",               badge: "bg-violet-700 text-white",  barColor: "bg-violet-700" },
  CAP_ROUND_2:      { label: "CAP Round II",              badge: "bg-emerald-600 text-white", barColor: "bg-emerald-600" },
  CAP_ROUND_3:      { label: "CAP Round III",             badge: "bg-blue-700 text-white",    barColor: "bg-blue-700" },
  CAP_ROUND_4:      { label: "CAP Round IV",              badge: "bg-orange-600 text-white",  barColor: "bg-orange-600" },
  INSTITUTE_LEVEL:  { label: "Institute Level Option Form", badge: "bg-pink-700 text-white",  barColor: "bg-pink-700" },
};
