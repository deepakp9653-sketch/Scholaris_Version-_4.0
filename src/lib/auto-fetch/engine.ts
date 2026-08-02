export type FormKey = "form1" | "form2" | "form3" | "form4" | "form5";

export interface AutoFetchRule {
  studentProfileField: string;
  forms: Partial<Record<FormKey, string>>;
}

export const AUTO_FETCH_MAP: AutoFetchRule[] = [
  {
    studentProfileField: "fullNameSurname",
    forms: { form1: "fullNameSurname", form5: "surname" },
  },
  {
    studentProfileField: "fullNameFirst",
    forms: { form1: "fullNameFirst", form5: "firstName" },
  },
  {
    studentProfileField: "fullNameFather",
    forms: { form1: "fullNameFather", form5: "fatherName" },
  },
  {
    studentProfileField: "fatherName",
    forms: { form1: "fatherName", form4: "sonDaughterOf" },
  },
  {
    studentProfileField: "motherName",
    forms: { form1: "motherName", form3: "motherName" },
  },
  {
    studentProfileField: "dateOfBirth",
    forms: { form1: "dateOfBirth", form3: "dateOfBirth", form5: "dateOfBirth" },
  },
  {
    studentProfileField: "gender",
    forms: { form1: "gender", form3: "gender", form5: "gender" },
  },
  {
    studentProfileField: "bloodGroup",
    forms: { form1: "bloodGroup", form5: "bloodGroup" },
  },
  {
    studentProfileField: "mobileNo",
    forms: { form1: "mobileNo", form2: "mobileNo", form3: "mobileNo", form5: "studentMobileNo" },
  },
  {
    studentProfileField: "parentsTelNo",
    forms: { form5: "parentsTelNo" },
  },
  {
    studentProfileField: "email",
    forms: { form1: "email", form2: "email", form3: "email", form5: "email" },
  },
  {
    studentProfileField: "religionCaste",
    forms: { form1: "religionCaste", form3: "religion" },
  },
  {
    studentProfileField: "category",
    forms: { form1: "admissionCategory", form3: "categoryTick", form5: "castCategory" },
  },
  {
    studentProfileField: "branchCourse",
    forms: { form1: "branchCourse", form2: "branch", form3: "courseName", form5: "branchDept" },
  },
  {
    studentProfileField: "admissionYearStart",
    forms: { form1: "admissionYearStart", form2: "admissionYear" },
  },
  {
    studentProfileField: "correspondenceAddress",
    forms: { form1: "correspondenceAddress", form5: "localAddress" },
  },
  {
    studentProfileField: "correspondencePin",
    forms: { form1: "correspondencePin", form5: "localPin" },
  },
  {
    studentProfileField: "permanentAddress",
    forms: { form1: "permanentAddress", form5: "permanentAddress" },
  },
  {
    studentProfileField: "permanentPin",
    forms: { form1: "permanentPin", form5: "permanentPin" },
  },
  {
    studentProfileField: "permanentCity",
    forms: { form5: "permanentCity" },
  },
  {
    studentProfileField: "aadharNoEncrypted",
    forms: { form3: "aadharNoEncrypted" },
  },
  {
    studentProfileField: "photoFileRef",
    forms: { form1: "photoFileRef", form5: "photoFileRef" },
  },
  {
    studentProfileField: "admissionReceiptNo",
    forms: { form5: "admissionReceiptNo" },
  },
  {
    studentProfileField: "contactTelNo",
    forms: { form1: "contactTelNo" },
  },
  {
    studentProfileField: "correspondenceTelNo",
    forms: { form1: "correspondenceTelNo" },
  },
  {
    studentProfileField: "permanentTelNo",
    forms: { form1: "permanentTelNo" },
  },
  {
    studentProfileField: "admissionDate",
    forms: { form5: "admissionDate" },
  },
];

export interface FormFieldValues {
  [field: string]: unknown;
}

export function propagateFromStudentProfile(
  changedField: string,
  value: unknown,
  targetForm: FormKey,
  sourceForm: FormKey
): { field: string; value: unknown } | null {
  const rule = AUTO_FETCH_MAP.find((r) => r.studentProfileField === changedField);
  if (!rule) return null;

  const targetField = rule.forms[targetForm];
  if (!targetField) return null;
  if (rule.forms[sourceForm] === targetField) return null;

  return { field: targetField, value };
}

export function getPropagatableFields(
  studentProfile: Record<string, unknown>,
  targetForm: FormKey
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const rule of AUTO_FETCH_MAP) {
    const value = studentProfile[rule.studentProfileField];
    if (value !== undefined && value !== null) {
      const targetField = rule.forms[targetForm];
      if (targetField) {
        result[targetField] = value;
      }
    }
  }
  return result;
}

export function getSourceFormField(field: string): FormKey | null {
  for (const rule of AUTO_FETCH_MAP) {
    if (rule.studentProfileField === field) {
      const entries = Object.entries(rule.forms) as [FormKey, string][];
      return entries.length > 0 ? entries[0][0] : null;
    }
  }
  return null;
}

// ─── CAP Candidate → StudentProfile mapper ────────────────────────────────────

export interface CapCandidatePayload {
  candidateName: string;
  applicationId: string | null;
  category: string | null;
  gender: "M" | "F" | "O" | null;
  meritNo: number | null;
  score: string | null;
  departmentName: string;
  choiceCode: string;
}

/**
 * Maps a parsed CAP candidate row to a partial StudentProfile record that
 * can be used to pre-seed the 5-form admission wizard.
 */
export function populateFromCapCandidate(
  cap: CapCandidatePayload,
): Record<string, unknown> {
  const nameParts = cap.candidateName.trim().split(/\s+/);
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : "";

  const genderMap: Record<string, string> = { M: "Male", F: "Female", O: "Transgender" };
  const categoryMap: Record<string, string> = {
    OPEN: "Open", OBC: "OBC", SC: "SC", ST: "ST", EWS: "EWS",
    SEBC: "SEBC", SBC: "SBC", DEF: "DEF", PH: "PH",
    "NT 1": "NT1", "NT 2 (NT-C)": "NT2", "NT 3": "NT3",
  };

  return {
    // Name split
    fullNameSurname: surname,
    fullNameFirst: firstName,
    // Branch
    branchCourse: cap.departmentName,
    // Gender
    gender: cap.gender ? (genderMap[cap.gender] ?? null) : null,
    // Category
    category: cap.category ? (categoryMap[cap.category] ?? cap.category) : null,
  };
}
