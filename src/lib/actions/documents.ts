"use server";

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { systemCheck } from "@/lib/storage/validation";
import { s3Client, BUCKET_NAME } from "@/lib/storage/s3-client";
import { revalidatePath } from "next/cache";

export async function getDocumentSlots(recordId: string) {
  await requireAuth();

  const items = await prisma.checklistItem.findMany({
    where: { form2Id: recordId, required: true },
    orderBy: { srNo: "asc" },
    include: {
      upload: {
        where: { admissionRecordId: recordId },
        orderBy: { uploadedAt: "desc" },
        take: 1,
      },
    },
  });

  return items.map((item) => ({
    checklistItemId: item.id,
    srNo: item.srNo,
    documentName: item.documentName,
    upload: item.upload[0] ?? null,
  }));
}

export async function uploadDocument(
  recordId: string,
  checklistItemId: string,
  formData: FormData
) {
  const user = await requireAuth();

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;
  const fileName = file.name;

  const check = await systemCheck(buffer, mimeType);

  const fileRef = `admissions/${recordId}/${checklistItemId}/${Date.now()}-${fileName}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileRef,
    Body: buffer,
    ContentType: mimeType,
  }));

  const fileType = mimeType === "application/pdf" ? "pdf" : "image";

  const uploadMethod = (formData.get("uploadMethod") as string) || "browse";

  const upload = await prisma.documentUpload.create({
    data: {
      admissionRecordId: recordId,
      checklistItemId,
      fileRef,
      fileType: fileType as any,
      uploadMethod: uploadMethod as any,
      status: "UPLOADED_PENDING_REVIEW",
      systemCheckPassed: check.passed,
      systemCheckNotes: check.notes.join("; ") || null,
      receivedYn: null,
    },
  });

  const record = await prisma.admissionRecord.findUnique({
    where: { id: recordId },
    select: { status: true },
  });

  if (record?.status === "FORMS_COMPLETE") {
    await prisma.admissionRecord.update({
      where: { id: recordId },
      data: { status: "DOCS_IN_PROGRESS" },
    });
    await prisma.verificationLog.create({
      data: {
        admissionRecordId: recordId,
        action: "STATUS_CHANGE",
        actorId: user.id,
        roleAtTime: String(user.role),
        passwordConfirmed: false,
        notes: "First document uploaded",
      },
    });
  }

  revalidatePath(`/admissions/${recordId}/documents`);
  return { success: true, uploadId: upload.id, systemCheckPassed: check.passed, systemCheckNotes: check.notes };
}

export async function setReceivedStatus(
  uploadId: string,
  received: boolean
) {
  await requireAuth();

  await prisma.documentUpload.update({
    where: { id: uploadId },
    data: { receivedYn: received },
  });

  revalidatePath("/");
  return { success: true };
}

export async function verifyDocument(uploadId: string) {
  const user = await requireAuth();

  const upload = await prisma.documentUpload.findUnique({
    where: { id: uploadId },
    select: { admissionRecordId: true, receivedYn: true },
  });

  if (!upload) return { success: false, error: "Upload not found" };
  if (upload.receivedYn !== true) {
    return { success: false, error: "Document must be marked as Received before verifying" };
  }

  await prisma.documentUpload.update({
    where: { id: uploadId },
    data: {
      status: "VERIFIED",
      verifiedById: user.id,
      verifiedAt: new Date(),
    },
  });

  await prisma.verificationLog.create({
    data: {
      admissionRecordId: upload.admissionRecordId,
      action: "DOC_VERIFIED",
      actorId: user.id,
      roleAtTime: String(user.role),
      passwordConfirmed: false,
      notes: `Document upload ${uploadId} verified`,
    },
  });

  await checkStageCompletion(upload.admissionRecordId);

  revalidatePath("/");
  return { success: true };
}

export async function rejectDocument(uploadId: string, reason: string) {
  await requireAuth();

  const upload = await prisma.documentUpload.findUnique({
    where: { id: uploadId },
    select: { admissionRecordId: true, fileRef: true },
  });
  if (!upload) return { success: false, error: "Upload not found" };

  if (upload.fileRef) {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: upload.fileRef,
    }));
  }

  await prisma.documentUpload.update({
    where: { id: uploadId },
    data: {
      status: "REJECTED_REUPLOAD",
      receivedYn: false,
      verifiedById: null,
      verifiedAt: null,
    },
  });

  revalidatePath("/");
  return { success: true };
}

async function checkStageCompletion(recordId: string) {
  const user = await requireAuth();

  // Get all required checklist items
  const requiredItems = await prisma.checklistItem.findMany({
    where: {
      form2Id: recordId,
      required: true,
    },
  });

  // Get all verified document uploads for this record
  const verifiedUploads = await prisma.documentUpload.findMany({
    where: {
      admissionRecordId: recordId,
      status: "VERIFIED",
    },
  });

  const verifiedChecklistItemIds = new Set(
    verifiedUploads.map((u) => u.checklistItemId).filter(Boolean)
  );

  const allVerified =
    requiredItems.length > 0 &&
    requiredItems.every((item) => verifiedChecklistItemIds.has(item.id));

  if (allVerified) {
    await prisma.admissionRecord.update({
      where: { id: recordId },
      data: { status: "DOCS_VERIFIED" },
    });
    await prisma.verificationLog.create({
      data: {
        admissionRecordId: recordId,
        action: "STATUS_CHANGE",
        actorId: user.id,
        roleAtTime: String(user.role),
        passwordConfirmed: false,
        notes: "All required documents verified",
      },
    });
  }
}
