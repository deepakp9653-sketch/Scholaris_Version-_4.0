export { form1Schema, type Form1Values, FORM1_DEFAULT_VALUES } from "./form1-application";
export { form2Schema, type Form2Values, type ChecklistItemValues, createForm2DefaultValues, DOCUMENT_NAMES } from "./form2-checklist";
export { form3Schema, type Form3Values, FORM3_DEFAULT_VALUES } from "./form3-eligibility";
export { form4Schema, type Form4Values, FORM4_DEFAULT_VALUES } from "./form4-affidavit";
export { form5Schema, type Form5Values, FORM5_DEFAULT_VALUES } from "./form5-library";

export const FORM_LABELS = [
  "Application Form",
  "List of Documents",
  "Application for Eligibility (SPPU)",
  "Anti-Ragging Affidavit",
  "Library Membership Form",
] as const;

export const FORM_KEYS = ["form1", "form2", "form3", "form4", "form5"] as const;
export type FormKey = (typeof FORM_KEYS)[number];
