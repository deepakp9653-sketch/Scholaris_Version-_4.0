export type PhaseStatus = "upcoming" | "ongoing" | "completed";

export function getPhaseEnd(phase: { firstDate: string | Date; lastDate: string | Date | null }): Date {
  if (phase.lastDate) return new Date(phase.lastDate);
  const start = new Date(phase.firstDate);
  const end = new Date(start);
  end.setUTCHours(end.getUTCHours() + 23, 29, 59);
  return end;
}

export function getPhaseStatus(
  phase: { firstDate: string | Date; lastDate: string | Date | null },
  now: Date
): PhaseStatus {
  const start = new Date(phase.firstDate);
  const end = getPhaseEnd(phase);
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "ongoing";
}
