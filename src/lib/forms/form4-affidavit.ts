import { z } from "zod";

export const form4Schema = z.object({
  fullNameWithEnrollmentNo: z.string().nullable(),
  sonDaughterOf: z.string().nullable(),
  admittedToInstitution: z.string().nullable(),
  declaredDay: z.string().nullable(),
  declaredMonth: z.string().nullable(),
  declaredYear: z.string().nullable(),
  signatureDeponentRef: z.string().nullable(),
  verifiedAtPlace: z.string().nullable(),
  verifiedDay: z.string().nullable(),
  verifiedMonth: z.string().nullable(),
  verifiedYear: z.string().nullable(),
  signatureDeponentVerificationRef: z.string().nullable(),
});

export type Form4Values = z.infer<typeof form4Schema>;

export const FORM4_DEFAULT_VALUES: Form4Values = {
  fullNameWithEnrollmentNo: null,
  sonDaughterOf: null,
  admittedToInstitution: null,
  declaredDay: null,
  declaredMonth: null,
  declaredYear: null,
  signatureDeponentRef: null,
  verifiedAtPlace: null,
  verifiedDay: null,
  verifiedMonth: null,
  verifiedYear: null,
  signatureDeponentVerificationRef: null,
};
