export const ADMISSION_STATUS_FLOW = [
  "DRAFT",
  "FORMS_COMPLETE",
  "DOCS_IN_PROGRESS",
  "DOCS_VERIFIED",
  "FEE_RECORDED",
  "READY_TO_PRINT",
  "PRINTED",
  "PENDING_FINAL_VERIFICATION",
  "ADMITTED",
] as const;

export type AdmissionStatus = (typeof ADMISSION_STATUS_FLOW)[number];

const STATUS_ORDER: Record<string, number> = {};
ADMISSION_STATUS_FLOW.forEach((s, i) => { STATUS_ORDER[s] = i; });

function statusIndex(status: string): number {
  const idx = STATUS_ORDER[status];
  if (idx === undefined) throw new Error(`Unknown status: ${status}`);
  return idx;
}

export const TRANSITION_RULES: Record<string, { allowed: string[]; gate?: "password_forms" | "password_final" }> = {
  DRAFT:                       { allowed: ["FORMS_COMPLETE"], gate: "password_forms" },
  FORMS_COMPLETE:              { allowed: ["DOCS_IN_PROGRESS"] },
  DOCS_IN_PROGRESS:            { allowed: ["DOCS_VERIFIED"] },
  DOCS_VERIFIED:               { allowed: ["FEE_RECORDED"] },
  FEE_RECORDED:                { allowed: ["READY_TO_PRINT"] },
  READY_TO_PRINT:              { allowed: ["PRINTED"] },
  PRINTED:                     { allowed: ["PENDING_FINAL_VERIFICATION"] },
  PENDING_FINAL_VERIFICATION:  { allowed: ["ADMITTED"], gate: "password_final" },
  ADMITTED:                    { allowed: [] },
  ON_HOLD:                     { allowed: [] },
  REJECTED:                    { allowed: [] },
};

export function canTransition(from: string, to: string): boolean {
  return TRANSITION_RULES[from]?.allowed.includes(to) ?? false;
}

export function isPasswordGated(from: string): "password_forms" | "password_final" | null {
  return TRANSITION_RULES[from]?.gate ?? null;
}

export function assertValidTransition(from: AdmissionStatus | string, to: AdmissionStatus | string): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`);
  }
}
