"use server";

import { prisma } from "@/lib/db";
import { requireAuth, verifyPasswordGate } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeStudentToExcelBatch } from "@/lib/excel-sync/writer";

export async function getPendingVerifications() {
  await requireAuth();

  const rows = await prisma.admissionRecord.findMany({
    where: {
      status: {
        in: [
          "FORMS_COMPLETE",
          "DOCS_IN_PROGRESS",
          "DOCS_VERIFIED",
          "FEE_RECORDED",
          "PENDING_FINAL_VERIFICATION",
          "DRAFT"
        ],
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      studentProfile: { select: { fullNameSurname: true, fullNameFirst: true, fullNameFather: true, fatherName: true, branchCourse: true, category: true } },
      feeRecord: { select: { feeStatus: true, totalFeeAmount: true, amountPaid: true } },
      capCandidate: { select: { candidateName: true } },
    },
  });

  return rows.map((r) => ({
    ...r,
    feeRecord: r.feeRecord
      ? {
          feeStatus: r.feeRecord.feeStatus,
          totalFeeAmount: r.feeRecord.totalFeeAmount?.toNumber() ?? null,
          amountPaid: r.feeRecord.amountPaid?.toNumber() ?? null,
        }
      : null,
  }));
}

export async function getAdmittedRecords(search?: string) {
  await requireAuth();

  const where: any = { status: "ADMITTED" };

  if (search) {
    where.OR = [
      { studentProfile: { fullNameSurname: { contains: search, mode: "insensitive" } } },
      { studentProfile: { fullNameFirst: { contains: search, mode: "insensitive" } } },
      { studentProfile: { fullNameFather: { contains: search, mode: "insensitive" } } },
      { studentProfile: { fatherName: { contains: search, mode: "insensitive" } } },
      { studentProfile: { branchCourse: { contains: search, mode: "insensitive" } } },
    ];
  }

  const feeRecordSelect = { select: { feeStatus: true, totalFeeAmount: true, amountPaid: true } };

  const rows = await prisma.admissionRecord.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      studentProfile: {
        select: {
          fullNameSurname: true,
          fullNameFirst: true,
          fullNameFather: true,
          fatherName: true,
          branchCourse: true,
          category: true,
          mobileNo: true,
          email: true,
          admissionYearStart: true,
        },
      },
      feeRecord: feeRecordSelect,
      admittedStudent: { select: { admittedAt: true } },
    },
  });

  return rows.map((r) => ({
    ...r,
    feeRecord: r.feeRecord
      ? {
          feeStatus: r.feeRecord.feeStatus,
          totalFeeAmount: r.feeRecord.totalFeeAmount?.toNumber() ?? null,
          amountPaid: r.feeRecord.amountPaid?.toNumber() ?? null,
        }
      : null,
  }));
}

export async function admitStudent(recordId: string, passwordAttempt: string) {
  const user = await requireAuth();

  const valid = await verifyPasswordGate(passwordAttempt, "FINAL_VERIFICATION_PASSWORD");

  await prisma.verificationLog.create({
    data: {
      admissionRecordId: recordId,
      action: "FINAL_VERIFICATION_PASSWORD",
      actorId: user.id,
      roleAtTime: String(user.role),
      passwordConfirmed: valid,
    },
  });

  if (!valid) {
    return { success: false, error: "Incorrect verification password" };
  }

  const record = await prisma.admissionRecord.findUnique({
    where: { id: recordId },
    include: {
      studentProfile: true,
      form1Application: true,
      form2Checklist: { include: { items: true } },
      form3Eligibility: true,
      form4Affidavit: true,
      form5Library: true,
      feeRecord: { include: { installments: true } },
      documentUploads: true,
      printLogs: { orderBy: { printedAt: "desc" }, take: 1 },
    },
  });

  if (!record) {
    return { success: false, error: "Record not found" };
  }

  if (record.status === "ADMITTED") {
    return { success: false, error: "Record is already admitted" };
  }

  function toNum(v: any): number | null {
    return typeof v?.toNumber === "function" ? v.toNumber() : typeof v === "number" ? v : null;
  }

  const snapshot = {
    admittedAt: new Date().toISOString(),
    admittedBy: user.id,
    admittedByName: user.name,
    studentProfile: record.studentProfile ? JSON.parse(JSON.stringify(record.studentProfile, (k, v) => k === "aadharNoEncrypted" ? undefined : v instanceof Date ? v.toISOString() : v)) : null,
    form1Application: record.form1Application,
    form2Checklist: record.form2Checklist,
    form3Eligibility: record.form3Eligibility,
    form4Affidavit: record.form4Affidavit,
    form5Library: record.form5Library,
    feeRecord: record.feeRecord
      ? {
          ...record.feeRecord,
          totalFeeAmount: toNum(record.feeRecord.totalFeeAmount),
          amountPaid: toNum(record.feeRecord.amountPaid),
          installments: record.feeRecord.installments.map((inst) => ({
            ...inst,
            amount: toNum(inst.amount),
            remainingAfter: toNum(inst.remainingAfter),
          })),
        }
      : null,
    documentCount: record.documentUploads.length,
    verifiedDocCount: record.documentUploads.filter((d) => d.status === "VERIFIED").length,
    lastPrintLog: record.printLogs[0] ?? null,
  };

  await prisma.$transaction([
    prisma.admittedStudent.create({
      data: {
        admissionRecordId: recordId,
        snapshot: snapshot,
      },
    }),
    prisma.admissionRecord.update({
      where: { id: recordId },
      data: {
        status: "ADMITTED",
        lockedAt: new Date(),
      },
    }),
  ]);

  // Auto-fill student data into branch SPPU Excel template upon admission
  try {
    await writeStudentToExcelBatch(recordId, user.id);
  } catch (syncErr) {
    console.warn("Auto-sync to Excel warning in admitStudent:", syncErr);
  }

  revalidatePath("/");
  revalidatePath("/final-verification");
  revalidatePath("/registry");
  revalidatePath("/doc-lib");
  return { success: true };
}
