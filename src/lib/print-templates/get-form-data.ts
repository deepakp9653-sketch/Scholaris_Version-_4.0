import { prisma } from "@/lib/db";
import { decryptAadharFromBuffer } from "@/lib/encryption";

export interface PrintFormData {
  record: {
    id: string;
    status: string;
    createdAt: Date;
  };
  student: Record<string, unknown>;
  form1: Record<string, unknown>;
  form2: Record<string, unknown>;
  form3: Record<string, unknown>;
  form4: Record<string, unknown>;
  form5: Record<string, unknown>;
  checklistItems: { srNo: number; documentName: string; required: boolean }[];
  fee: Record<string, unknown> | null;
}

export async function getPrintFormData(recordId: string): Promise<PrintFormData | null> {
  const record = await prisma.admissionRecord.findUnique({
    where: { id: recordId },
    include: {
      studentProfile: true,
      form1Application: true,
      form2Checklist: { include: { items: { orderBy: { srNo: "asc" } } } },
      form3Eligibility: { include: { educationalGaps: true } },
      form4Affidavit: true,
      form5Library: true,
      feeRecord: true,
    },
  });

  if (!record) return null;

  // Calculate sequential form number starting from 001, 002, etc. based on admission creation order
  const allRecords = await prisma.admissionRecord.findMany({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  const index = allRecords.findIndex((r) => r.id === recordId);
  const sequenceNo = index >= 0 ? index + 1 : 1;
  const formNumberStr = String(sequenceNo).padStart(3, "0");

  const student: Record<string, unknown> = {
    ...(record.studentProfile as Record<string, unknown> ?? {}),
    serialNumber: formNumberStr,
    formNumber: formNumberStr,
  };

  if (record.studentProfile?.aadharNoEncrypted) {
    student.aadharNoDecrypted = decryptAadharFromBuffer(record.studentProfile.aadharNoEncrypted);
  } else {
    student.aadharNoDecrypted = "";
  }

  const form3Obj: Record<string, unknown> = {
    ...(record.form3Eligibility as Record<string, unknown> ?? {}),
  };

  // Automatically map educational gap details from relational table if present
  const gaps = (record.form3Eligibility as any)?.educationalGaps;
  if (Array.isArray(gaps) && gaps.length > 0) {
    const g = gaps[0];
    if (!form3Obj.gapLastExamName) form3Obj.gapLastExamName = g.lastExamName;
    if (!form3Obj.gapSeatNo) form3Obj.gapSeatNo = g.seatNo;
    if (!form3Obj.gapMonthYearPassing) form3Obj.gapMonthYearPassing = g.monthYearPassing;
    if (!form3Obj.gapPercentage) form3Obj.gapPercentage = g.percentage;
    if (!form3Obj.gapClassGrade) form3Obj.gapClassGrade = g.classGrade;
  }

  return {
    record: { id: record.id, status: record.status, createdAt: record.createdAt },
    student,
    form1: record.form1Application as Record<string, unknown> ?? {},
    form2: (record.form2Checklist ?? {}) as Record<string, unknown>,
    form3: form3Obj,
    form4: record.form4Affidavit as Record<string, unknown> ?? {},
    form5: record.form5Library as Record<string, unknown> ?? {},
    checklistItems: record.form2Checklist?.items.map(i => ({
      srNo: i.srNo,
      documentName: i.documentName,
      required: i.required,
    })) ?? [],
    fee: record.feeRecord as Record<string, unknown> ?? null,
  };
}
