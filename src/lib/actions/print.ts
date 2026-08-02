"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approvePreview(recordId: string) {
  const user = await requireAuth();

  await prisma.admissionRecord.update({
    where: { id: recordId },
    data: { status: "READY_TO_PRINT" },
  });
  await prisma.verificationLog.create({
    data: {
      admissionRecordId: recordId,
      action: "STATUS_CHANGE",
      actorId: user.id,
      roleAtTime: String(user.role),
        passwordConfirmed: false,
      notes: "Preview approved",
    },
  });

  revalidatePath("/");
  revalidatePath(`/admissions/${recordId}/preview`);
  return { success: true };
}

export async function markPrinted(recordId: string) {
  const user = await requireAuth();

  const currentLogCount = await prisma.printLog.count({
    where: { admissionRecordId: recordId },
  });

  await prisma.printLog.create({
    data: {
      admissionRecordId: recordId,
      printedById: user.id,
      version: currentLogCount + 1,
    },
  });

  await prisma.admissionRecord.update({
    where: { id: recordId },
    data: { status: "PRINTED" },
  });

  revalidatePath("/");
  return { success: true };
}
