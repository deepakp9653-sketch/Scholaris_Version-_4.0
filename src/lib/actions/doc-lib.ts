"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export interface DocLibEligibilityFileItem {
  id: string;
  department: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  checksum: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface StudentDocOverview {
  recordId: string;
  studentName: string;
  applicationId: string | null;
  capId: string | null;
  branch: string | null;
  category: string | null;
  status: string;
  totalDocuments: number;
  verifiedDocuments: number;
  studentProfile: any;
  feeRecord: any;
  createdAt: Date;
  documents: {
    id: string;
    documentName: string;
    fileRef: string;
    fileType: string;
    status: string;
    uploadedAt: Date;
    verifiedAt: Date | null;
  }[];
}

const SEED_FILES_CONFIG = [
  { department: "Civil Engineering", slug: "civil", fileName: "civil_eligibility.xlsx" },
  { department: "Computer Engineering", slug: "computer", fileName: "computer_eligibility.xlsx" },
  { department: "E&TC (Electronics & Telecommunication)", slug: "entc", fileName: "entc_eligibility.xlsx" },
  { department: "Electrical Engineering", slug: "electrical", fileName: "electrical_eligibility.xlsx" },
  { department: "Mechanical Engineering", slug: "mechanical", fileName: "mechanical_eligibility.xlsx" },
];

/**
 * Password verification for Doc Lib gate with audit logging
 */
export async function verifyDocLibPassword(passwordAttempt: string) {
  const user = await requireAuth();
  const configuredPassword = process.env.PASSWORD_GATE_DOC_LIB || "doclib@123";

  const isValid = passwordAttempt === configuredPassword;

  try {
    await prisma.docLibAccessLog.create({
      data: {
        tenantId: user.institutionId || "default",
        actorId: user.id || "anonymous",
        action: isValid ? "UNLOCK_ATTEMPT_SUCCESS" : "UNLOCK_ATTEMPT_FAIL",
        targetFile: null,
      },
    });
  } catch (err) {
    console.warn("Failed to write to DocLibAccessLog:", err);
  }

  if (isValid) {
    return { success: true };
  } else {
    return { success: false, error: "Incorrect Doc Lib access password" };
  }
}

/**
 * Ensures seed eligibility files are inserted into DB and returns eligibility files list
 */
export async function getDocLibEligibilityFiles(): Promise<DocLibEligibilityFileItem[]> {
  await requireAuth();

  const seedDir = path.join(
    process.cwd(),
    "public",
    "doc-lib-seed-files",
    "eligibility-criteria"
  );

  try {
    let existingFiles = await prisma.docLibEligibilityFile.findMany({
      orderBy: { department: "asc" },
    });

    if (existingFiles.length < SEED_FILES_CONFIG.length) {
      for (const item of SEED_FILES_CONFIG) {
        const filePath = path.join(seedDir, item.fileName);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");
          const fileUrl = `/api/doc-lib/download/by-dept/${item.slug}`;

          const existing = await prisma.docLibEligibilityFile.findFirst({
            where: { department: item.department },
          });

          if (!existing) {
            await prisma.docLibEligibilityFile.create({
              data: {
                tenantId: "default",
                department: item.department,
                fileName: item.fileName,
                fileUrl,
                checksum,
                uploadedBy: "system",
              },
            });
          } else if (existing.checksum !== checksum) {
            await prisma.docLibEligibilityFile.update({
              where: { id: existing.id },
              data: { checksum, fileName: item.fileName, fileUrl },
            });
          }
        }
      }

      existingFiles = await prisma.docLibEligibilityFile.findMany({
        orderBy: { department: "asc" },
      });
    }

    return existingFiles.map((file: any) => {
      const filePath = path.join(seedDir, file.fileName);
      let fileSize = 160256;
      if (fs.existsSync(filePath)) {
        fileSize = fs.statSync(filePath).size;
      }

      return {
        id: file.id,
        department: file.department,
        fileName: file.fileName,
        fileUrl: `/api/doc-lib/download/${file.id}`,
        fileSize,
        checksum: file.checksum,
        uploadedAt: file.uploadedAt,
        uploadedBy: file.uploadedBy,
      };
    });
  } catch (err) {
    console.error("Error fetching eligibility files:", err);
    return [];
  }
}

/**
 * Read-only projection into existing student document storage (Section 1)
 */
export async function getDocLibStudentDocuments(query?: {
  search?: string;
  branch?: string;
}): Promise<StudentDocOverview[]> {
  await requireAuth();

  try {
    const records = await prisma.admissionRecord.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        studentProfile: true,
        capCandidate: true,
        feeRecord: true,
        documentUploads: {
          include: {
            checklistItem: true,
          },
        },
      },
    });

    let result: StudentDocOverview[] = records.map((r) => {
      const father = r.studentProfile?.fullNameFather || r.studentProfile?.fatherName;
      const studentName =
        [r.studentProfile?.fullNameSurname, r.studentProfile?.fullNameFirst, father]
          .filter(Boolean)
          .join(" ") ||
        r.capCandidate?.candidateName ||
        "Unnamed Candidate";

      const applicationId = r.capCandidate?.applicationId || null;
      const capId = r.capCandidate?.id || null;
      const branch = r.studentProfile?.branchCourse || null;
      const category = r.studentProfile?.category || null;

      const docs = r.documentUploads.map((d) => ({
        id: d.id,
        documentName: d.checklistItem?.documentName || d.fileRef || "Document",
        fileRef: d.fileRef,
        fileType: d.fileType || "pdf",
        status: d.status,
        uploadedAt: d.uploadedAt,
        verifiedAt: d.verifiedAt,
      }));

      const verifiedCount = docs.filter((d) => d.status === "VERIFIED").length;

      return {
        recordId: r.id,
        studentName,
        applicationId,
        capId,
        branch,
        category,
        status: r.status,
        totalDocuments: docs.length,
        verifiedDocuments: verifiedCount,
        studentProfile: r.studentProfile,
        feeRecord: r.feeRecord
          ? {
              feeStatus: r.feeRecord.feeStatus,
              totalFeeAmount: r.feeRecord.totalFeeAmount?.toNumber() ?? 0,
              amountPaid: r.feeRecord.amountPaid?.toNumber() ?? 0,
              remainingBalance: r.feeRecord.remainingBalance?.toNumber() ?? 0,
              modeOfPayment: r.feeRecord.modeOfPayment,
            }
          : null,
        createdAt: r.createdAt,
        documents: docs,
      };
    });

    if (query?.search) {
      const q = query.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          (s.applicationId && s.applicationId.toLowerCase().includes(q)) ||
          s.recordId.toLowerCase().includes(q)
      );
    }

    if (query?.branch && query.branch !== "ALL") {
      result = result.filter((s) => s.branch === query.branch);
    }

    return result;
  } catch (err) {
    console.error("Error fetching student documents for Doc Lib:", err);
    return [];
  }
}
