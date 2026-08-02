export const CANONICAL_CATEGORIES = [
  "Open", "OBC", "SBC", "SEBC", "EWS", "DEF", "PH", "Other",
  "NT1", "NT2", "NT3", "NT(B)", "NT(C)", "NT(D)", "DT(A)", "VJ",
  "SC", "ST",
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

export const FORM1_CATEGORIES = [
  "Open", "OBC", "SBC", "NT1", "NT2", "NT3", "SC", "ST", "DEF", "PH",
] as const;

export const FORM3_CATEGORIES = [
  "Open", "SC", "ST", "DT(A)", "NT(B)", "NT(C)", "NT(D)", "OBC", "SBC", "SEBC", "EWS",
] as const;

export const FORM5_CATEGORIES = [
  "Open", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "SBC", "Other",
] as const;

export const NT_ALIAS_MAP: Record<string, string> = {
  "NT1": "NT(B)",
  "NT2": "NT(C)",
  "NT3": "NT(D)",
  "NT(B)": "NT1",
  "NT(C)": "NT2",
  "NT(D)": "NT3",
};

export function toCanonical(value: string): string {
  return NT_ALIAS_MAP[value] ?? value;
}

export function resolveCategoryAlias(source: string, targetForm: "form1" | "form3" | "form5"): string {
  const canonical = toCanonical(source);
  const allowed = targetForm === "form1" ? FORM1_CATEGORIES
    : targetForm === "form3" ? FORM3_CATEGORIES
    : FORM5_CATEGORIES;
  if ((allowed as readonly string[]).includes(canonical)) return canonical;
  const reverseMapped = NT_ALIAS_MAP[source];
  if (reverseMapped && (allowed as readonly string[]).includes(reverseMapped)) return reverseMapped;
  return canonical;
}

export const RESERVED_CATEGORIES = new Set([
  "OBC", "SBC", "SEBC", "NT1", "NT2", "NT3", "NT(B)", "NT(C)", "NT(D)", "DT(A)", "VJ",
  "SC", "ST", "DEF", "PH",
]);
