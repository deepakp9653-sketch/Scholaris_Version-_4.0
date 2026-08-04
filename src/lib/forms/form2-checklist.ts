import { z } from "zod";

export const checklistItemSchema = z.object({
  srNo: z.number(),
  documentName: z.string(),
  required: z.boolean(),
});

export const form2Schema = z.object({
  admissionType: z.enum(["FE", "DSE"]).nullable(),
  capId: z.string().nullable(),
  openSubCategory: z.enum(["Open", "Open (OMS)"]).default("Open"),
  staffSignRef: z.string().nullable(),
  studentSignRef: z.string().nullable(),
  checklistDate: z.string().nullable(),
  items: z.array(checklistItemSchema).min(18).max(20),
});

export type Form2Values = z.infer<typeof form2Schema>;
export type ChecklistItemValues = z.infer<typeof checklistItemSchema>;

export const DOCUMENT_NAMES = [
  "Allotment Letter",
  "Confirmation Letter",
  "S.S.C. Mark sheet",
  "S.S.C. Board Certificate",
  "H.S.C. Mark sheet",
  "H.S.C. Board Certificate",
  "Leaving / TC Certificate",
  "Migration Certificate (If Applicable)",
  "Age, Nationality, Domicile / Birth Certificate",
  "Cast Certificate (If Applicable)",
  "Cast Validity Certificate (If Applicable)",
  "Non Creamy-layer (If Applicable)",
  "Income Certificate (If Applicable)",
  "EWS Certificate (If Applicable)",
  "Gap Certificate (If Applicable)",
  "Aadhar Card Xerox",
  "APAAR/ABC ID Xerox",
  "Passport Size 2 Photo",
  "JEE Score Card",
  "CET Score Card",
] as const;

/**
 * Calculates whether a document is required for a given category based on the official TSSM DTE EN6649 chart:
 * - SC, ST: Caste & Validity required, NCL not required, EWS not required.
 * - VJ-A, NT-B,C,S (NT1, NT2, NT3), OBC, SBC: Caste, Validity & NCL required, EWS not required.
 * - OPEN (MS): Caste, Validity, NCL, EWS not required. Domicile required, Migration not required.
 * - OPEN (OMS): Migration required, Domicile optional/not required.
 * - EWS: EWS Certificate required. Caste, Validity, NCL not required.
 * - GIRLS: Same as Open/category.
 */
export function isDocumentRequiredForCategory(
  documentName: string,
  category: string | null | undefined,
  isOpenOms: boolean = false
): boolean {
  const normCat = (category || "Open").toUpperCase().trim().replace(/_/g, " ");

  const isSC = normCat === "SC";
  const isST = normCat === "ST";
  const isVJA = normCat === "VJ-A" || normCat === "VJ" || normCat === "DT-A" || normCat === "DT(A)" || normCat === "DT_A" || normCat === "NT-A" || normCat === "NTA" || normCat === "NT A" || normCat.startsWith("VJ");
  const isNTB = normCat === "NT-B" || normCat === "NTB" || normCat === "NT 1" || normCat === "NT1" || normCat === "NT(B)" || normCat === "NT-1" || normCat === "NT B";
  const isNTC = normCat === "NT-C" || normCat === "NTC" || normCat === "NT 2" || normCat === "NT2" || normCat === "NT(C)" || normCat === "NT-2" || normCat === "NT C";
  const isNTD = normCat === "NT-D" || normCat === "NTD" || normCat === "NT 3" || normCat === "NT3" || normCat === "NT(D)" || normCat === "NT-3" || normCat === "NT D";
  const isNT = isVJA || isNTB || isNTC || isNTD || normCat.startsWith("NT");
  const isOBC = normCat === "OBC";
  const isSBC = normCat === "SBC" || normCat === "SEBC";
  const isEWS = normCat === "EWS";

  // Caste & Validity required for reserved categories (SC, ST, VJ-A/NT-A, NT-B/C/D, OBC, SBC, SEBC)
  const isCasteRequired = isSC || isST || isVJA || isNT || isOBC || isSBC;
  
  // NCL required ONLY for VJ-A/NT-A, NT-B, NT-C, NT-D, OBC, SBC, SEBC (SC and ST do NOT require NCL)
  const isNCLRequired = isVJA || isNT || isOBC || isSBC;

  const docLower = documentName.toLowerCase();

  // 1. Mandatory base documents for all categories
  if (
    docLower.includes("allotment") ||
    docLower.includes("confirmation") ||
    docLower.includes("s.s.c") ||
    docLower.includes("h.s.c") ||
    docLower.includes("leaving") ||
    docLower.includes("tc") ||
    docLower.includes("income") ||
    docLower.includes("aadhar") ||
    docLower.includes("apaar") ||
    docLower.includes("photo") ||
    docLower.includes("gap") ||
    docLower.includes("jee") ||
    docLower.includes("cet") ||
    docLower.includes("score card")
  ) {
    return true;
  }

  // 2. Domicile & Nationality Certificate: Required for all Maharashtra State candidates; Not required for Open (OMS)
  if (docLower.includes("domicile") || docLower.includes("nationality") || docLower.includes("age, nationality")) {
    return !isOpenOms;
  }

  // 3. Migration Certificate: Required for Open (OMS) / OMS candidates
  if (docLower.includes("migration")) {
    return isOpenOms;
  }

  // 4. Caste Certificate & Caste Validity Certificate
  if (docLower.includes("cast certificate") || docLower.includes("caste certificate") || docLower.includes("validity")) {
    return isCasteRequired;
  }

  // 5. Non-Creamy Layer Certificate
  if (docLower.includes("non creamy") || docLower.includes("creamy-layer") || docLower.includes("ncl")) {
    return isNCLRequired;
  }

  // 6. EWS Certificate: Required ONLY for EWS category
  if (docLower.includes("ews")) {
    return isEWS;
  }

  return true;
}

export function getForm2ChecklistForCategory(
  category: string | null | undefined,
  isOpenOms: boolean = false
) {
  return DOCUMENT_NAMES.map((name, i) => ({
    srNo: i + 1,
    documentName: name,
    required: isDocumentRequiredForCategory(name, category, isOpenOms),
  }));
}

export function createForm2DefaultValues(): Form2Values {
  return {
    admissionType: null,
    capId: null,
    openSubCategory: "Open",
    staffSignRef: null,
    studentSignRef: null,
    checklistDate: null,
    items: DOCUMENT_NAMES.map((name, i) => ({
      srNo: i + 1,
      documentName: name,
      required: false,
    })),
  };
}
