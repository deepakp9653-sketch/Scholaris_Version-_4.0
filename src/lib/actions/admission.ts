"use server";

import { prisma } from "@/lib/db";
import { ensureDbCalibrated } from "@/lib/db/prisma";
import { requireAuth, verifyPasswordGate } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { encryptAadharToBuffer } from "@/lib/encryption";
import { serializeData } from "@/lib/utils";

export async function createAdmissionRecord() {
  const user = await requireAuth();
  await ensureDbCalibrated();

  const institution = await prisma.institution.findFirst();
  if (!institution) throw new Error("No institution configured");

  // Verify the user actually exists in app_user before using as FK
  let operatorId: string | null = null;
  try {
    const dbUser = await prisma.appUser.findUnique({ where: { id: user.id }, select: { id: true } });
    if (dbUser) operatorId = dbUser.id;
  } catch {
    // ignore – leave operatorId null
  }

  let record;
  try {
    record = await prisma.admissionRecord.create({
      data: {
        status: "DRAFT",
        institutionId: institution.id,
        ...(operatorId ? { assignedOperatorId: operatorId } : {}),
        studentProfile: { create: {} },
      },
    });
  } catch (createErr) {
    console.warn("Retrying createAdmissionRecord after calibration:", createErr);
    await ensureDbCalibrated();
    record = await prisma.admissionRecord.create({
      data: {
        status: "DRAFT",
        institutionId: institution.id,
        ...(operatorId ? { assignedOperatorId: operatorId } : {}),
        studentProfile: { create: {} },
      },
    });
  }

  try { revalidatePath("/"); } catch {}
  return { id: record.id };
}

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function parseIntNullable(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : Math.round(val);
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return null;
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function parseDecimalNullable(val: unknown): number | string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  }
  return null;
}

export async function saveFormData(
  recordId: string,
  formKey: "form1" | "form2" | "form3" | "form4" | "form5",
  data: Record<string, unknown>
) {
  const user = await requireAuth();

  const record = await prisma.admissionRecord.findUnique({
    where: { id: recordId },
    select: { status: true },
  });

  if (!record) return { success: false, error: "Record not found" };
  if (record.status === "ADMITTED") {
    return { success: false, error: "Completed / admitted student forms cannot be edited" };
  }

  try {
    if (formKey === "form1") {
      // First, extract and save shared student profile fields from form1 data
      const profileFieldMap: Record<string, string> = {
        fullNameSurname: "fullNameSurname",
        fullNameFirst: "fullNameFirst",
        fullNameFather: "fullNameFather",
        fatherName: "fatherName",
        motherName: "motherName",
        dateOfBirth: "dateOfBirth",
        bloodGroup: "bloodGroup",
        gender: "gender",
        religionCaste: "religionCaste",
        admissionCategory: "category",
        contactTelNo: "contactTelNo",
        mobileNo: "mobileNo",
        email: "email",
        aadharNo: "aadharNo",
        panNo: "panNo",
        correspondenceAddress: "correspondenceAddress",
        correspondencePin: "correspondencePin",
        correspondenceTelNo: "correspondenceTelNo",
        permanentAddress: "permanentAddress",
        permanentPin: "permanentPin",
        permanentTelNo: "permanentTelNo",
        branchCourse: "branchCourse",
        admissionYearStart: "admissionYearStart",
        admissionYearEnd: "admissionYearEnd",
      };

      const profileUpdate: Record<string, unknown> = {};
      for (const [formField, profileField] of Object.entries(profileFieldMap)) {
        const v = data[formField];
        if (v !== undefined && v !== null && v !== "") {
          if (formField === "dateOfBirth") {
            profileUpdate[profileField] = parseDate(v);
          } else if (formField === "admissionYearStart" || formField === "admissionYearEnd") {
            profileUpdate[profileField] = parseIntNullable(v);
          } else if (formField === "aadharNo") {
            profileUpdate["aadharNoEncrypted"] = encryptAadharToBuffer(String(v));
          } else {
            profileUpdate[profileField] = v;
          }
        }
      }

      if (Object.keys(profileUpdate).length > 0) {
        await prisma.studentProfile.upsert({
          where: { admissionRecordId: recordId },
          create: { admissionRecordId: recordId, ...profileUpdate } as any,
          update: profileUpdate as any,
        });
      }

      const allowedKeys = new Set([
        "admissionQuota", "admissionCategory", "homeUniversity", "motherTongue",
        "sscMarksEnglishObtained", "sscMarksEnglishOutOf", "sscMarksMathsObtained", "sscMarksMathsOutOf",
        "sscGrandTotalObtained", "sscGrandTotalOutOf", "sscPercentage", "sscYearOfPassing",
        "hscPhysicsObtained", "hscPhysicsOutOf", "hscChemistrySubjectName", "hscChemistryObtained", "hscChemistryOutOf",
        "hscMathsObtained", "hscMathsOutOf", "hscPcmTotalObtained", "hscPcmTotalOutOf",
        "hscGrandTotalObtained", "hscGrandTotalOutOf", "hscYearOfPassing",
        "cetPhysicsObtained", "cetPhysicsOutOf", "cetChemistryObtained", "cetChemistryOutOf",
        "cetMathsObtained", "cetMathsOutOf", "cetPcmTotalObtained", "cetPcmTotalOutOf",
        "cetExamSeatNo", "cetMeritNo", "aieeeMarks",
        "diplomaMarksObtained", "diplomaMarksOutOf", "diplomaBranchCourse", "diplomaBteEnrollmentNo", "diplomaYearOfPassing",
        "annualIncomeOfParent", "dateField", "placeField",
        "signatureStudentRef", "signatureParentRef", "officeUseEligibleFor", "officeUseBranch"
      ]);

      const intKeys = new Set(["sscYearOfPassing", "hscYearOfPassing", "diplomaYearOfPassing"]);
      const dateKeys = new Set(["dateField"]);
      const decimalKeys = new Set([
        "sscMarksEnglishObtained", "sscMarksEnglishOutOf", "sscMarksMathsObtained", "sscMarksMathsOutOf",
        "sscGrandTotalObtained", "sscGrandTotalOutOf", "sscPercentage",
        "hscPhysicsObtained", "hscPhysicsOutOf", "hscChemistryObtained", "hscChemistryOutOf",
        "hscMathsObtained", "hscMathsOutOf", "hscPcmTotalObtained", "hscPcmTotalOutOf",
        "hscGrandTotalObtained", "hscGrandTotalOutOf",
        "cetPhysicsObtained", "cetPhysicsOutOf", "cetChemistryObtained", "cetChemistryOutOf",
        "cetMathsObtained", "cetMathsOutOf", "cetPcmTotalObtained", "cetPcmTotalOutOf",
        "diplomaMarksObtained", "diplomaMarksOutOf", "annualIncomeOfParent"
      ]);

      const payload: Record<string, unknown> = { admissionRecordId: recordId };
      for (const [k, v] of Object.entries(data)) {
        if (allowedKeys.has(k) && v !== undefined) {
          if (dateKeys.has(k)) {
            payload[k] = parseDate(v);
          } else if (intKeys.has(k)) {
            payload[k] = parseIntNullable(v);
          } else if (decimalKeys.has(k)) {
            payload[k] = parseDecimalNullable(v);
          } else {
            payload[k] = v === "" ? null : v;
          }
        }
      }

      await prisma.form1Application.upsert({
        where: { admissionRecordId: recordId },
        create: payload as any,
        update: payload as any,
      });
    } else if (formKey === "form2") {
      const allowedKeys = new Set([
        "admissionType", "capId", "staffSignRef", "studentSignRef", "checklistDate"
      ]);

      const payload: Record<string, unknown> = { admissionRecordId: recordId };
      for (const [k, v] of Object.entries(data)) {
        if (allowedKeys.has(k) && v !== undefined) {
          if (k === "checklistDate") payload[k] = parseDate(v);
          else payload[k] = v === "" ? null : v;
        }
      }

      await prisma.form2DocumentChecklist.upsert({
        where: { admissionRecordId: recordId },
        create: payload as any,
        update: payload as any,
      });
    } else if (formKey === "form3") {
      const allowedKeys = new Set([
        "courseName", "courseYear", "applicantType", "nationality", "religion",
        "categoryTick", "belongsToReservedYn", "physicallyDisabledYn", "physicallyDisabledType",
        "qualCourseName", "qualDuration", "qualUniversity", "qualCollegeDept",
        "qualSeatNo", "qualMonthYearPassing", "qualPercentage", "qualClassGrade",
        "minorityYn", "minorityLinguistic", "minorityReligion", "signatureCandidateRef",
        "officeReceiptNo", "officeDate", "officeEligibleStatus", "officeAsst", "officeSrAsst", "officeOsRegistrarHod"
      ]);

      const payload: Record<string, unknown> = { admissionRecordId: recordId };
      for (const [k, v] of Object.entries(data)) {
        if (allowedKeys.has(k) && v !== undefined) {
          if (k === "officeDate") payload[k] = parseDate(v);
          else if (k === "qualPercentage") payload[k] = parseDecimalNullable(v);
          else payload[k] = v === "" ? null : v;
        }
      }

      await prisma.form3Eligibility.upsert({
        where: { admissionRecordId: recordId },
        create: payload as any,
        update: payload as any,
      });

      if (data.gapLastExamName) {
        const existingGap = await prisma.educationalGap.findFirst({
          where: { admissionRecordId: recordId }
        });
        const gapData = {
          admissionRecordId: recordId,
          lastExamName: String(data.gapLastExamName),
          seatNo: data.gapSeatNo ? String(data.gapSeatNo) : null,
          monthYearPassing: data.gapMonthYearPassing ? String(data.gapMonthYearPassing) : null,
          percentage: data.gapPercentage ? Number(data.gapPercentage) : null,
          classGrade: data.gapClassGrade ? String(data.gapClassGrade) : null,
        };

        if (existingGap) {
          await prisma.educationalGap.update({
            where: { id: existingGap.id },
            data: gapData,
          });
        } else {
          await prisma.educationalGap.create({
            data: gapData,
          });
        }
      }
    } else if (formKey === "form4") {
      const allowedKeys = new Set([
        "fullNameWithEnrollmentNo", "sonDaughterOf", "admittedToInstitution",
        "declaredDay", "declaredMonth", "declaredYear", "signatureDeponentRef",
        "verifiedAtPlace", "verifiedDay", "verifiedMonth", "verifiedYear",
        "signatureDeponentVerificationRef"
      ]);

      const payload: Record<string, unknown> = { admissionRecordId: recordId };
      for (const [k, v] of Object.entries(data)) {
        if (allowedKeys.has(k) && v !== undefined) {
          payload[k] = v === "" ? null : v;
        }
      }

      await prisma.form4AntiRaggingAffidavit.upsert({
        where: { admissionRecordId: recordId },
        create: payload as any,
        update: payload as any,
      });
    } else if (formKey === "form5") {
      const allowedKeys = new Set([
        "yearLevel", "diplomaFyDsy", "localAddress", "localCity", "localPin",
        "castCategory", "librarySignatureRef", "dateField", "adminOfficerAccountantSignRef",
        "libraryMembershipIdCardNo", "remark", "librarianSignRef", "rulesAgreedYn", "rulesAgreedAt"
      ]);

      const payload: Record<string, unknown> = { admissionRecordId: recordId };
      for (const [k, v] of Object.entries(data)) {
        if (allowedKeys.has(k) && v !== undefined) {
          if (k === "dateField" || k === "rulesAgreedAt") payload[k] = parseDate(v);
          else payload[k] = v === "" ? null : v;
        }
      }

      await prisma.form5LibraryMembership.upsert({
        where: { admissionRecordId: recordId },
        create: payload as any,
        update: payload as any,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error(`Error in saveFormData (${formKey}):`, err);
    return { success: false, error: err.message || "Failed to save form data" };
  }
}

export async function saveChecklistItems(
  recordId: string,
  items: { srNo: number; documentName: string; required: boolean }[]
) {
  await requireAuth();

  try {
    await prisma.form2DocumentChecklist.upsert({
      where: { admissionRecordId: recordId },
      create: { admissionRecordId: recordId },
      update: {},
    });

    for (const item of items) {
      await prisma.checklistItem.upsert({
        where: { form2Id_srNo: { form2Id: recordId, srNo: item.srNo } },
        create: {
          form2Id: recordId,
          srNo: item.srNo,
          documentName: item.documentName,
          required: item.required,
        },
        update: {
          required: item.required,
        },
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error in saveChecklistItems:", err);
    return { success: false, error: err.message || "Failed to save checklist items" };
  }
}

async function resolveActorId(userId: string): Promise<string | null> {
  try {
    const dbUser = await prisma.appUser.findUnique({ where: { id: userId }, select: { id: true } });
    return dbUser?.id ?? null;
  } catch { return null; }
}

export async function verifyFormsPassword(
  recordId: string,
  passwordAttempt: string
) {
  const user = await requireAuth();
  const valid = await verifyPasswordGate(passwordAttempt, "FORMS_SAVE_PASSWORD");

  const actorId = await resolveActorId(user.id);
  if (actorId) {
    await prisma.verificationLog.create({
      data: {
        admissionRecordId: recordId,
        action: "FORMS_SAVE_PASSWORD",
        actorId,
        roleAtTime: String(user.role),
        passwordConfirmed: valid,
      },
    });
  }

  if (!valid) {
    return { success: false, error: "Incorrect password" };
  }

  await prisma.admissionRecord.update({
    where: { id: recordId },
    data: { status: "FORMS_COMPLETE" },
  });

  try { revalidatePath("/"); } catch {}
  return { success: true };
}

export async function updateStudentProfile(
  recordId: string,
  data: Record<string, unknown>
) {
  await requireAuth();

  const record = await prisma.admissionRecord.findUnique({
    where: { id: recordId },
    select: { status: true },
  });

  if (!record) return { success: false, error: "Record not found" };
  if (record.status !== "DRAFT") {
    return { success: false, error: "Profile can only be edited in DRAFT status" };
  }

  try {
    const allowedKeys = new Set([
      "fullNameSurname", "fullNameFirst", "fullNameFather", "fatherName", "motherName",
      "dateOfBirth", "gender", "bloodGroup", "mobileNo", "contactTelNo", "parentsTelNo",
      "email", "religionCaste", "category", "branchCourse", "admissionYearStart",
      "admissionYearEnd", "admissionDate", "correspondenceAddress", "correspondencePin",
      "correspondenceTelNo", "permanentAddress", "permanentPin", "permanentCity",
      "permanentTelNo", "panNo", "photoFileRef", "admissionReceiptNo", "aadharNoEncrypted"
    ]);

    const intKeys = new Set(["admissionYearStart", "admissionYearEnd"]);
    const dateKeys = new Set(["dateOfBirth", "admissionDate"]);

    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === "aadharNo" && typeof v === "string" && v.trim() !== "") {
        payload.aadharNoEncrypted = encryptAadharToBuffer(v);
      } else if (allowedKeys.has(k) && v !== undefined) {
        if (dateKeys.has(k)) {
          payload[k] = parseDate(v);
        } else if (intKeys.has(k)) {
          payload[k] = parseIntNullable(v);
        } else {
          payload[k] = v === "" ? null : v;
        }
      }
    }

    await prisma.studentProfile.upsert({
      where: { admissionRecordId: recordId },
      create: { admissionRecordId: recordId, ...payload } as any,
      update: payload as any,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error in updateStudentProfile:", err);
    return { success: false, error: err.message || "Failed to update student profile" };
  }
}

export async function getAdmissionRecord(recordId: string) {
  await requireAuth();

  const record = await prisma.admissionRecord.findUnique({
    where: { id: recordId },
    include: {
      studentProfile: true,
      form1Application: true,
      form2Checklist: { include: { items: { orderBy: { srNo: "asc" } } } },
      form3Eligibility: { include: { educationalGaps: true } },
      form4Affidavit: true,
      form5Library: true,
      documentUploads: true,
      printLogs: true,
      feeRecord: true,
    },
  });

  if (!record) return null;

  return serializeData(record);
}

export async function deleteAdmissionRecord(recordId: string, adminPassword?: string) {
  await requireAuth();
  await ensureDbCalibrated();

  const record = await prisma.admissionRecord.findUnique({
    where: { id: recordId },
    select: { id: true, status: true },
  });

  if (!record) return { success: false, error: "Record not found" };

  if (record.status === "ADMITTED") {
    if (adminPassword !== "admin@123") {
      return { success: false, error: "Incorrect admin password. Deletion denied." };
    }
  }

  try { await prisma.verificationLog.deleteMany({ where: { admissionRecordId: recordId } }); } catch {}
  try { await prisma.installment.deleteMany({ where: { feeRecord: { admissionRecordId: recordId } } }); } catch {}
  try { await prisma.feeRecord.deleteMany({ where: { admissionRecordId: recordId } }); } catch {}
  try { await prisma.documentUpload.deleteMany({ where: { admissionRecordId: recordId } }); } catch {}
  try { await prisma.form1Application.deleteMany({ where: { admissionRecordId: recordId } }); } catch {}
  try { await prisma.form2DocumentChecklist.deleteMany({ where: { admissionRecordId: recordId } }); } catch {}
  try { await prisma.educationalGap.deleteMany({ where: { form3Eligibility: { admissionRecordId: recordId } } }); } catch {}
  try { await prisma.form3Eligibility.deleteMany({ where: { admissionRecordId: recordId } }); } catch {}
  try { await prisma.form4AntiRaggingAffidavit.deleteMany({ where: { admissionRecordId: recordId } }); } catch {}
  try { await prisma.form5LibraryMembership.deleteMany({ where: { admissionRecordId: recordId } }); } catch {}
  try { await prisma.studentProfile.deleteMany({ where: { admissionRecordId: recordId } }); } catch {}

  await prisma.admissionRecord.delete({ where: { id: recordId } });

  revalidatePath("/");
  revalidatePath("/admissions");
  revalidatePath("/pipeline");
  return { success: true };
}

export async function updateAdmissionStatus(recordId: string, newStatus: any) {
  await requireAuth();
  await ensureDbCalibrated();

  await prisma.admissionRecord.update({
    where: { id: recordId },
    data: { status: newStatus },
  });

  revalidatePath("/");
  revalidatePath("/admissions");
  revalidatePath("/pipeline");
  revalidatePath("/final-verification");
  return { success: true };
}
