import { prisma } from "@/lib/db/prisma";
import { validateRecordForExcel } from "./validation";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import ExcelJS from "exceljs";

export interface SyncResult {
  success: boolean;
  rowNumber: number;
  batchId: string;
  excelPath: string;
  syncedAt: string;
}

const COLUMN_LETTERS = [
  "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
  "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD", "AE", "AF", "AG"
] as const;

/**
 * Executes Stage B per-student write to the working .xlsx file using exceljs
 * preserving column A formulas, validations, and row limits without binary file corruption.
 */
export async function writeStudentToExcelBatch(
  admissionRecordId: string,
  adminUserId: string = "system"
): Promise<SyncResult> {
  // 1. Pre-sync validation against SPPU rules
  const validation = await validateRecordForExcel(admissionRecordId);
  if (!validation.valid) {
    const errorDetails = validation.errors.map((e) => `${e.label} (${e.column}): ${e.message}`).join("; ");
    await prisma.excelSyncAudit.create({
      data: {
        studentId: admissionRecordId,
        batchId: "00000000-0000-0000-0000-000000000000",
        action: "VALIDATE_FAILURE",
        detail: { errors: validation.errors } as any,
        performedById: adminUserId,
      },
    }).catch(() => {});
    throw new Error(`Validation failed for SPPU Excel Sync: ${errorDetails}`);
  }

  const { branchCode, mappedValues } = validation;
  const academicYear = "2026-27";
  const admissionStatus = "granted";

  // 2. Find or create AcademicBatch
  let batch = await prisma.academicBatch.findFirst({
    where: {
      academicYear,
      branchCode,
      admissionStatus,
    },
  });

  const workingDir = path.join(process.cwd(), "public", "doc-lib-seed-files", "working_batches");
  if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir, { recursive: true });
  }

  const workingFileName = `${branchCode}_eligibility_${academicYear.replace("-", "_")}_${admissionStatus}.xlsx`;
  const workingExcelPath = path.join(workingDir, workingFileName);

  // 3. Initialize working .xlsx from master template if it doesn't exist
  if (!fs.existsSync(workingExcelPath)) {
    const masterXlsxPath = path.join(
      process.cwd(),
      "public",
      "doc-lib-seed-files",
      "templates",
      `${branchCode}_eligibility_master.xlsx`
    );
    const fallbackMasterPath = path.join(
      process.cwd(),
      "public",
      "doc-lib-seed-files",
      "templates",
      "eligibility_test01_master.xlsx"
    );

    if (fs.existsSync(masterXlsxPath)) {
      fs.copyFileSync(masterXlsxPath, workingExcelPath);
    } else if (fs.existsSync(fallbackMasterPath)) {
      fs.copyFileSync(fallbackMasterPath, workingExcelPath);
    } else {
      // Create new clean workbook with SPPU header structure if master not found
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Eligibility");
      
      // Row 12 headers
      ws.getRow(12).values = [
        "Sr. No.", "Surname", "First Name", "Father Name", "Mother Name", "DOB", "Sex",
        "Category", "NCL", "Qual. Board", "Qual. Exam", "Qual. Seat No", "Qual. %", "Qual. Passing",
        "MH/Non-MH", "Address", "PH Type", "Minority", "ABC ID", "Mobile", "Email", "Minority Details",
        "GR No", "Gap Details", "Last Board", "Last Exam", "Last %", "Last Passing", "Aadhar No",
        "Religion", "Voter Y/N", "EPIC Y/N", "EPIC Number"
      ];
      // Row 13 column indices
      ws.getRow(13).values = Array.from({ length: 33 }, (_, i) => i + 1);

      await wb.xlsx.writeFile(workingExcelPath);
    }
  }

  if (!batch) {
    batch = await prisma.academicBatch.create({
      data: {
        academicYear,
        branchCode,
        admissionStatus,
        workingExcelPath: `/doc-lib-seed-files/working_batches/${workingFileName}`,
        nextFreeRow: 15,
      },
    });
  }

  const targetRow = batch.nextFreeRow;
  if (targetRow > 511) {
    throw new Error("Batch capacity exceeded max row limit 511 per SPPU specification");
  }

  // 4. Load workbook with exceljs and write student data to target row
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workingExcelPath);
  const sheet = workbook.getWorksheet(1) || workbook.addWorksheet("Eligibility");

  const row = sheet.getRow(targetRow);

  // Set Sr. No formula in Col A (never touch value directly)
  row.getCell(1).value = { formula: `IF(B${targetRow}="","",A${targetRow - 1}+1)` };

  // Write mapped values to Columns B through AG (indices 2 through 33)
  COLUMN_LETTERS.forEach((colLetter, idx) => {
    const colIndex = idx + 2;
    const val = mappedValues[colLetter];
    if (val !== undefined && val !== null) {
      row.getCell(colIndex).value = val;
    }
  });

  row.commit();
  await workbook.xlsx.writeFile(workingExcelPath);

  // Recalibrate docLibEligibilityFile checksum in database
  try {
    const newBuf = fs.readFileSync(workingExcelPath);
    const newChecksum = crypto.createHash("sha256").update(newBuf).digest("hex");
    await prisma.docLibEligibilityFile.updateMany({
      where: { department: { equals: branchCode, mode: "insensitive" } },
      data: { checksum: newChecksum },
    });
  } catch (checksumErr) {
    console.warn("Checksum recalibration note:", checksumErr);
  }

  const syncedAt = new Date();

  // 5. Update database state
  await prisma.$transaction([
    prisma.academicBatch.update({
      where: { id: batch.id },
      data: {
        nextFreeRow: targetRow + 1,
      },
    }),
    prisma.admissionRecord.update({
      where: { id: admissionRecordId },
      data: {
        excelRowNumber: targetRow,
        excelSyncedAt: syncedAt,
        syncStatus: "COMPLETED_SYNCED",
        status: "ADMITTED",
      },
    }),
    prisma.excelSyncAudit.create({
      data: {
        studentId: admissionRecordId,
        batchId: batch.id,
        action: "WRITE_SUCCESS",
        detail: {
          rowNumber: targetRow,
          mappedValues,
          branchCode,
          academicYear,
        } as any,
        performedById: adminUserId,
      },
    }),
  ]);

  return {
    success: true,
    rowNumber: targetRow,
    batchId: batch.id,
    excelPath: batch.workingExcelPath,
    syncedAt: syncedAt.toISOString(),
  };
}
