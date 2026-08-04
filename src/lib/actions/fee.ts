"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";

export type FeeRecordResponse = {
  id?: string;
  admissionRecordId: string;
  totalFeeAmount: number | null;
  amountPaid: number | null;
  remainingBalance: number | null;
  modeOfPayment: string | null;
  installmentEnabled: boolean;
  feeStatus: string;
  installments: {
    id: string;
    installmentNo: number;
    amount: number | null;
    modeOfPayment: string | null;
    date: Date | null;
    remainingAfter: number | null;
    voided: boolean;
  }[];
};

export async function getFeeRecord(recordId: string): Promise<FeeRecordResponse | null> {
  await requireAuth();

  const record = await prisma.feeRecord.findUnique({
    where: { admissionRecordId: recordId },
    include: {
      installments: { orderBy: { installmentNo: "asc" } },
    },
  });

  if (!record) return null;

  return serializeData({
    ...record,
    totalFeeAmount: record.totalFeeAmount?.toNumber() ?? null,
    amountPaid: record.amountPaid?.toNumber() ?? null,
    remainingBalance: record.remainingBalance?.toNumber() ?? null,
    modeOfPayment: record.modeOfPayment,
    feeStatus: record.feeStatus,
    installments: record.installments.map((inst) => ({
      ...inst,
      amount: inst.amount?.toNumber() ?? null,
      remainingAfter: inst.remainingAfter?.toNumber() ?? null,
    })),
  });
}

function computeFeeStatus(
  totalFee: number,
  amountPaid: number
): "Unpaid" | "Partially_Paid" | "Fully_Paid" {
  if (totalFee === 0) return "Fully_Paid";
  if (amountPaid <= 0) return "Unpaid";
  if (amountPaid >= totalFee) return "Fully_Paid";
  return "Partially_Paid";
}

export async function saveFeeRecord(
  recordId: string,
  data: {
    totalFeeAmount: number;
    amountPaid: number;
    modeOfPayment: string;
    installmentEnabled: boolean;
  }
) {
  const user = await requireAuth();

  const feeStatus = computeFeeStatus(data.totalFeeAmount, data.amountPaid);

  const feeRecord = await prisma.feeRecord.upsert({
    where: { admissionRecordId: recordId },
    create: {
      admissionRecordId: recordId,
      totalFeeAmount: data.totalFeeAmount,
      amountPaid: data.amountPaid,
      modeOfPayment: data.modeOfPayment as any,
      installmentEnabled: data.installmentEnabled,
      feeStatus,
    },
    update: {
      totalFeeAmount: data.totalFeeAmount,
      amountPaid: data.amountPaid,
      modeOfPayment: data.modeOfPayment as any,
      installmentEnabled: data.installmentEnabled,
      feeStatus,
    },
  });

  const record = await prisma.admissionRecord.findUnique({
    where: { id: recordId },
    select: { status: true },
  });

  if (record?.status === "DOCS_VERIFIED") {
    await prisma.admissionRecord.update({
      where: { id: recordId },
      data: { status: "FEE_RECORDED" },
    });
    await prisma.verificationLog.create({
      data: {
        admissionRecordId: recordId,
        action: "STATUS_CHANGE",
        actorId: user.id,
        roleAtTime: String(user.role),
        passwordConfirmed: false,
        notes: "Fee recorded",
      },
    });
  }

  revalidatePath("/");
  revalidatePath(`/admissions/${recordId}/fee`);
  return { success: true, feeRecord: serializeData(feeRecord), feeStatus };
}

import { writeStudentToExcelBatch } from "@/lib/excel-sync/writer";

export async function confirmAdmissionAndSetAdmitted(recordId: string) {
  const user = await requireAuth();

  await prisma.admissionRecord.update({
    where: { id: recordId },
    data: { status: "ADMITTED" },
  });

  try {
    await prisma.verificationLog.create({
      data: {
        admissionRecordId: recordId,
        action: "STATUS_CHANGE" as const,
        actorId: user.id,
        roleAtTime: String(user.role),
        passwordConfirmed: true,
        notes: "Candidate officially admitted to institution.",
      },
    });
  } catch {}

  // Auto-fill student data into branch SPPU Excel template upon admission (non-blocking background task)
  writeStudentToExcelBatch(recordId, user.id).catch((syncErr) => {
    console.warn("Auto-sync to Excel warning upon admission:", syncErr);
  });

  revalidatePath("/");
  revalidatePath("/admissions");
  revalidatePath("/registry");
  revalidatePath("/doc-lib");
  revalidatePath("/cap-analytics/vacant-seats");
  return { success: true };
}

export async function addInstallment(
  recordId: string,
  data: {
    amount: number;
    modeOfPayment: string;
    date: string;
  }
) {
  await requireAuth();

  const feeRecord = await prisma.feeRecord.findUnique({
    where: { admissionRecordId: recordId },
    include: { installments: { orderBy: { installmentNo: "desc" }, take: 1 } },
  });

  if (!feeRecord) return { success: false, error: "Fee record not found" };

  const lastNo = feeRecord.installments[0]?.installmentNo ?? 0;
  const installmentNo = lastNo + 1;

  const lastRemaining = (feeRecord.installments[0]?.remainingAfter ?? feeRecord.totalFeeAmount?.toNumber() ?? 0);
  const remainingAfter = Number(lastRemaining) - Number(data.amount);

  await prisma.installment.create({
    data: {
      feeRecordId: recordId,
      installmentNo,
      amount: data.amount,
      modeOfPayment: data.modeOfPayment as any,
      date: data.date ? new Date(data.date) : new Date(),
      remainingAfter,
    },
  });

  // Keep parent FeeRecord in sync with active installments
  const activeInstallments = await prisma.installment.findMany({
    where: { feeRecordId: recordId, voided: false },
  });
  const totalPaid = activeInstallments.reduce((sum, inst) => sum + (inst.amount?.toNumber() ?? 0), 0);
  const totalFee = feeRecord.totalFeeAmount?.toNumber() ?? 0;
  const feeStatus = computeFeeStatus(totalFee, totalPaid);

  await prisma.feeRecord.update({
    where: { admissionRecordId: recordId },
    data: {
      amountPaid: totalPaid,
      feeStatus,
    },
  });

  revalidatePath(`/admissions/${recordId}/fee`);
  return { success: true };
}

export async function voidInstallment(installmentId: string, recordId: string) {
  await requireAuth();

  await prisma.installment.update({
    where: { id: installmentId },
    data: { voided: true },
  });

  const feeRecord = await prisma.feeRecord.findUnique({
    where: { admissionRecordId: recordId },
  });

  if (feeRecord) {
    // Keep parent FeeRecord in sync with active installments after voiding
    const activeInstallments = await prisma.installment.findMany({
      where: { feeRecordId: recordId, voided: false },
    });
    const totalPaid = activeInstallments.reduce((sum, inst) => sum + (inst.amount?.toNumber() ?? 0), 0);
    const totalFee = feeRecord.totalFeeAmount?.toNumber() ?? 0;
    const feeStatus = computeFeeStatus(totalFee, totalPaid);

    await prisma.feeRecord.update({
      where: { admissionRecordId: recordId },
      data: {
        amountPaid: totalPaid,
        feeStatus,
      },
    });
  }

  revalidatePath(`/admissions/${recordId}/fee`);
  return { success: true };
}
