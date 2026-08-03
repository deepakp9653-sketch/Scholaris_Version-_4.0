"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { parseCapPdf } from "@/lib/cap-parser/capParser";
import {
  storePreview,
  getPreview,
  deletePreview,
  generatePreviewId,
} from "@/lib/cap-parser/previewStore";
import type { ParsedBatch } from "@/lib/cap-parser/parserTypes";

// ─── Upload & Parse (returns preview, does NOT commit to DB) ─────────────────

export async function uploadAndParseCapPdf(formData: FormData): Promise<{
  success: boolean;
  previewId?: string;
  preview?: ParsedBatch;
  error?: string;
}> {
  await requireAuth();

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };
  if (!file.name.endsWith(".pdf"))
    return { success: false, error: "File must be a PDF" };
  if (file.size > 20 * 1024 * 1024)
    return { success: false, error: "File exceeds 20MB limit" };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseCapPdf(buffer, file.name);
    const previewId = generatePreviewId();
    storePreview(previewId, parsed);
    return { success: true, previewId, preview: parsed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Parse failed";
    return { success: false, error: msg };
  }
}

// ─── Commit preview to database ───────────────────────────────────────────────

export async function commitCapBatch(previewId: string): Promise<{
  success: boolean;
  batchId?: string;
  error?: string;
}> {
  await requireAuth();

  const parsed = getPreview(previewId);
  if (!parsed) return { success: false, error: "Preview expired or not found" };

  try {
    // Upsert institute
    const institute = await prisma.capInstitute.upsert({
      where: { code: parsed.institute_code },
      create: { code: parsed.institute_code, name: parsed.institution_code_name.split(" - ").slice(1).join(" - ") },
      update: { name: parsed.institution_code_name.split(" - ").slice(1).join(" - ") },
    });

    // Create upload batch
    const batch = await prisma.capUploadBatch.create({
      data: {
        instituteId: institute.id,
        roundLabel: parsed.round_label,
        publishedOn: parsed.published_on ? new Date(parsed.published_on) : null,
        sourceFilename: parsed.source_filename,
        status: "processing",
      },
    });

    // Process each choice code
    for (const cc of parsed.departments) {
      // Upsert department
      const dept = await prisma.capDepartment.upsert({
        where: { instituteId_name: { instituteId: institute.id, name: cc.department_name } },
        create: { instituteId: institute.id, name: cc.department_name },
        update: {},
      });

      // Create choice code
      const choiceCode = await prisma.capChoiceCode.create({
        data: {
          batchId: batch.id,
          departmentId: dept.id,
          code: cc.code,
          variant: cc.variant,
          statusLabel: cc.status_label || null,
          sanctionIntake: cc.sanction_intake,
          capSeats: cc.cap_seats,
          msSeats: cc.ms_seats,
          minoritySeats: cc.minority_seats,
          aiSeats: cc.ai_seats,
          instituteSeats: cc.institute_seats,
          filledSeats: cc.filled_seats,
          vacantSeats: cc.vacant_seats,
        },
      });

      // Create seat pools and candidates
      for (const pool of cc.seat_pools) {
        const seatPool = await prisma.capSeatPool.create({
          data: {
            choiceCodeId: choiceCode.id,
            label: pool.label,
            sortOrder: pool.sort_order,
          },
        });

        if (pool.candidates.length > 0) {
          await prisma.capCandidate.createMany({
            data: pool.candidates.map((c) => ({
              choiceCodeId: choiceCode.id,
              seatPoolId: seatPool.id,
              srNo: c.sr_no,
              meritNo: c.merit_no,
              score: c.score,
              scoreType: c.score_type ?? null,
              applicationId: c.application_id,
              candidateName: c.candidate_name,
              gender: c.gender ?? null,
              category: c.candidate_category,
              seatTypeCode: c.raw_seat_type,
              statusSymbol: c.status_symbol,
              statusLabel: c.status_label,
              isVacant: c.is_vacant,
            })),
          });
        }
      }
    }

    // Mark batch as success
    await prisma.capUploadBatch.update({
      where: { id: batch.id },
      data: { status: "success" },
    });

    deletePreview(previewId);
    revalidatePath("/cap-analytics");
    return { success: true, batchId: batch.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Commit failed";
    return { success: false, error: msg };
  }
}

// ─── Dashboard overview data ──────────────────────────────────────────────────

export async function getCapDashboardData(batchId?: string) {
  await requireAuth();

  try {
    // Get latest batch if no batchId
    const batch = batchId
      ? await prisma.capUploadBatch.findUnique({ where: { id: batchId }, include: { institute: true } })
      : await prisma.capUploadBatch.findFirst({
          where: { status: "success" },
          orderBy: { createdAt: "desc" },
          include: { institute: true },
        });

    if (!batch) return null;

    const allBatches = await prisma.capUploadBatch.findMany({
      where: { status: "success" },
      orderBy: { createdAt: "desc" },
      select: { id: true, roundLabel: true, createdAt: true },
    });

    const choiceCodes = await prisma.capChoiceCode.findMany({
      where: { batchId: batch.id },
      include: { department: true },
      orderBy: { code: "asc" },
    });

    const totalSanctionIntake = choiceCodes.reduce((s, c) => s + c.sanctionIntake, 0);
    const totalFilled = choiceCodes.reduce((s, c) => s + c.filledSeats, 0);
    const totalVacant = choiceCodes.reduce((s, c) => s + c.vacantSeats, 0);

    // Status counts from candidates
    const statusCounts = await prisma.capCandidate.groupBy({
      by: ["statusLabel"],
      where: {
        choiceCode: { batchId: batch.id },
      },
      _count: { id: true },
    });

    return {
      batch,
      allBatches,
      choiceCodes,
      summary: {
        totalSanctionIntake,
        totalFilled,
        totalVacant,
        totalChoiceCodes: choiceCodes.length,
        fillRate: totalSanctionIntake > 0 ? ((totalFilled / totalSanctionIntake) * 100).toFixed(1) : "0",
      },
      statusCounts: statusCounts.map((s) => ({
        label: s.statusLabel ?? "Unknown",
        count: s._count.id,
      })),
    };
  } catch (err) {
    console.warn("CAP dashboard data fetch warning:", err);
    return null;
  }
}

// ─── Candidate list with filters ──────────────────────────────────────────────

export async function getCapCandidates(
  batchId: string,
  opts: {
    search?: string;
    departmentId?: string;
    category?: string;
    gender?: string;
    isVacant?: boolean;
    page?: number;
    pageSize?: number;
  } = {},
) {
  await requireAuth();

  const { search, departmentId, category, gender, isVacant, page = 1, pageSize = 50 } = opts;

  try {
    const where = {
      choiceCode: {
        batchId,
        ...(departmentId ? { departmentId } : {}),
      },
      ...(search
        ? {
            OR: [
              { candidateName: { contains: search, mode: "insensitive" as const } },
              { applicationId: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(category ? { category: { contains: category, mode: "insensitive" as const } } : {}),
      ...(gender ? { gender: gender as "M" | "F" | "O" } : {}),
      ...(isVacant !== undefined ? { isVacant } : {}),
    };

    const [total, rawCandidates] = await Promise.all([
      prisma.capCandidate.count({ where }),
      prisma.capCandidate.findMany({
        where,
        include: {
          choiceCode: { include: { department: true } },
          seatPool: true,
          admissionRecords: { select: { id: true, status: true } },
        },
        orderBy: [{ choiceCode: { code: "asc" } }, { srNo: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const candidates = rawCandidates.map((c) => ({
      ...c,
      score: c.score ? Number(c.score) : null,
      createdAt: c.createdAt ? c.createdAt.toISOString() : null,
    }));

    return { total, candidates, page, pageSize };
  } catch (err) {
    console.warn("getCapCandidates warning:", err);
    return { total: 0, candidates: [], page, pageSize };
  }
}

// ─── Import CAP candidate → create draft Admission Record ────────────────────

import { parseCapCandidateNameSync, mapCapCategorySync } from "@/lib/cap-parser/capNameCategoryUtils";

export async function parseCapCandidateName(rawName: string) {
  return parseCapCandidateNameSync(rawName);
}

export async function mapCapCategory(raw: string | null): Promise<string> {
  return mapCapCategorySync(raw);
}

export async function importCandidateToAdmission(candidateId: string): Promise<{
  success: boolean;
  admissionRecordId?: string;
  error?: string;
}> {
  await requireAuth();

  try {
    const candidate = await prisma.capCandidate.findUnique({
      where: { id: candidateId },
      include: { choiceCode: { include: { department: true } } },
    });

    if (!candidate) return { success: false, error: "Candidate not found" };
    if (candidate.isVacant) return { success: false, error: "Cannot import a vacant seat" };

    let existing = null;
    try {
      existing = await prisma.admissionRecord.findFirst({
        where: { capCandidateId: candidateId },
      });
    } catch (e) {
      console.warn("capCandidateId lookup fallback:", e);
    }

    if (existing) {
      return { success: true, admissionRecordId: existing.id };
    }

    const institution = await prisma.institution.findFirst();
    if (!institution) return { success: false, error: "No institution configured" };

    const { surname, firstName, fatherInName, fatherFullName } = parseCapCandidateNameSync(candidate.candidateName);
    const category = mapCapCategorySync(candidate.category);

    let record;
    try {
      record = await prisma.admissionRecord.create({
        data: {
          status: "DRAFT",
          institutionId: institution.id,
          capCandidateId: candidateId,
          studentProfile: {
            create: {
              fullNameSurname: surname,
              fullNameFirst: firstName,
              fullNameFather: fatherInName,
              fatherName: fatherFullName,
              gender: candidate.gender === "M" ? "Male" : candidate.gender === "F" ? "Female" : candidate.gender === "O" ? "Transgender" : null,
              branchCourse: candidate.choiceCode.department.name,
              category: category as any,
            } as Parameters<typeof prisma.studentProfile.create>[0]["data"],
          },
          form1Application: {
            create: {
              admissionQuota: "CAP_CET_AIEEE",
              admissionCategory: category,
              cetMeritNo: candidate.meritNo ? String(candidate.meritNo) : null,
              cetPcmTotalObtained: candidate.scoreType === "MHT_CET" && candidate.score ? Number(candidate.score) : null,
              cetPcmTotalOutOf: 100,
              cetPhysicsOutOf: 100,
              cetChemistryOutOf: 100,
              cetMathsOutOf: 100,
              sscGrandTotalOutOf: 500,
              hscPcmTotalOutOf: 300,
              hscGrandTotalOutOf: 600,
            },
          },
        },
      });
    } catch (createErr) {
      console.warn("Retrying admissionRecord.create without capCandidateId column:", createErr);
      record = await prisma.admissionRecord.create({
        data: {
          status: "DRAFT",
          institutionId: institution.id,
          studentProfile: {
            create: {
              fullNameSurname: surname,
              fullNameFirst: firstName,
              fullNameFather: fatherInName,
              fatherName: fatherFullName,
              gender: candidate.gender === "M" ? "Male" : candidate.gender === "F" ? "Female" : candidate.gender === "O" ? "Transgender" : null,
              branchCourse: candidate.choiceCode.department.name,
              category: category as any,
            } as Parameters<typeof prisma.studentProfile.create>[0]["data"],
          },
          form1Application: {
            create: {
              admissionQuota: "CAP_CET_AIEEE",
              admissionCategory: category,
              cetMeritNo: candidate.meritNo ? String(candidate.meritNo) : null,
              cetPcmTotalObtained: candidate.scoreType === "MHT_CET" && candidate.score ? Number(candidate.score) : null,
              cetPcmTotalOutOf: 100,
              cetPhysicsOutOf: 100,
              cetChemistryOutOf: 100,
              cetMathsOutOf: 100,
              sscGrandTotalOutOf: 500,
              hscPcmTotalOutOf: 300,
              hscGrandTotalOutOf: 600,
            },
          },
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/pipeline");
    return { success: true, admissionRecordId: record.id };
  } catch (err: unknown) {
    console.error("Error in importCandidateToAdmission:", err);
    const msg = err instanceof Error ? err.message : "Import failed";
    return { success: false, error: msg };
  }
}

// ─── Get batch list ───────────────────────────────────────────────────────────

export async function getCapBatches() {
  await requireAuth();
  try {
    return await prisma.capUploadBatch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        institute: true,
        _count: { select: { choiceCodes: true } },
      },
    });
  } catch (err) {
    console.warn("getCapBatches warning:", err);
    return [];
  }
}

export async function deleteCapBatch(batchId: string, password?: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  if (password !== "Admin@123") {
    return { success: false, error: "Incorrect admin password" };
  }
  try {
    const candidateIds = (
      await prisma.capCandidate.findMany({
        where: {
          choiceCode: {
            batchId,
          },
        },
        select: { id: true },
      })
    ).map((c) => c.id);

    if (candidateIds.length > 0) {
      await prisma.admissionRecord.updateMany({
        where: { capCandidateId: { in: candidateIds } },
        data: { capCandidateId: null },
      });
      await prisma.capCandidate.deleteMany({
        where: {
          choiceCode: {
            batchId,
          },
        },
      });
    }

    await prisma.capUploadBatch.delete({ where: { id: batchId } });
    revalidatePath("/cap-analytics");
    revalidatePath("/admissions");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteCapBatch error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Delete failed" };
  }
}

// ─── Get All Candidates for Export (Full Batch) ───────────────────────────────

export async function getAllCapCandidatesForExport(batchId: string) {
  await requireAuth();
  try {
    const candidates = await prisma.capCandidate.findMany({
      where: {
        choiceCode: {
          batchId,
        },
      },
      include: {
        choiceCode: {
          include: {
            department: true,
          },
        },
        seatPool: true,
      },
      orderBy: [
        { choiceCode: { code: "asc" } },
        { srNo: "asc" },
      ],
    });

    return candidates.map((c) => ({
      ...c,
      score: c.score ? Number(c.score) : null,
    }));
  } catch (err) {
    console.error("getAllCapCandidatesForExport error:", err);
    return [];
  }
}

// ─── Search CAP Candidates for Wizard Auto-Fetch ──────────────────────────────

export async function searchCapCandidates(query: string) {
  await requireAuth();

  try {
    const candidates = await prisma.capCandidate.findMany({
      where: {
        isVacant: false,
        OR: [
          { candidateName: { contains: query, mode: "insensitive" } },
          { applicationId: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        choiceCode: {
          include: {
            department: true,
          },
        },
      },
      take: 10,
    });

    return candidates.map((c) => ({
      ...c,
      score: c.score ? Number(c.score) : null,
      createdAt: c.createdAt ? c.createdAt.toISOString() : null,
    }));
  } catch (err) {
    console.warn("searchCapCandidates warning:", err);
    return [];
  }
}

// ─── Get CAP Candidate by ID ──────────────────────────────────────────────────

export async function getCapCandidateById(id: string) {
  await requireAuth();

  try {
    const candidate = await prisma.capCandidate.findUnique({
      where: { id },
      include: {
        choiceCode: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!candidate) return null;

    return {
      ...candidate,
      score: candidate.score ? Number(candidate.score) : null,
      createdAt: candidate.createdAt ? candidate.createdAt.toISOString() : null,
    };
  } catch (err) {
    console.warn("getCapCandidateById warning:", err);
    return null;
  }
}

// ─── Get Vacant Seats Analysis ────────────────────────────────────────────────

import { OFFICIAL_SEAT_MATRIX, DepartmentSeatMatrixConfig } from "@/lib/data/seatMatrixData";

export async function getVacantSeatsAnalysis() {
  await requireAuth();

  try {
    // Fetch all submitted/admitted admission records to compute live filled vs vacant counts
    // Seats are ONLY marked as filled when a student submits their admission form in the college
    let admittedRecords: any[] = [];
    try {
      admittedRecords = await prisma.admissionRecord.findMany({
        where: {
          status: {
            in: ["ADMITTED", "FORMS_COMPLETE", "DOCS_VERIFIED", "FEE_RECORDED", "READY_TO_PRINT", "PRINTED"],
          },
        },
        select: {
          id: true,
          status: true,
          studentProfile: {
            select: {
              branchCourse: true,
              category: true,
            },
          },
          form1Application: {
            select: {
              admissionQuota: true,
              admissionCategory: true,
            },
          },
        },
      });
    } catch (dbErr) {
      console.warn("admittedRecords query fallback:", dbErr);
      admittedRecords = [];
    }

    // Group filled seats by branch name & category & quota
    const deptFilledMap: Record<string, {
      byCategory: Record<string, number>;
      byQuota: Record<string, number>;
      managementFilled: number;
    }> = {};

    for (const rec of admittedRecords) {
      const branchName = rec.studentProfile?.branchCourse || rec.capCandidate?.choiceCode?.department?.name || "";
      const category = (rec.studentProfile?.category || rec.form1Application?.admissionCategory || "Open").toUpperCase();
      const quota = rec.form1Application?.admissionQuota || "CAP_CET_AIEEE";

      if (!deptFilledMap[branchName]) {
        deptFilledMap[branchName] = {
          byCategory: {},
          byQuota: {},
          managementFilled: 0,
        };
      }

      deptFilledMap[branchName].byCategory[category] = (deptFilledMap[branchName].byCategory[category] || 0) + 1;
      deptFilledMap[branchName].byQuota[quota] = (deptFilledMap[branchName].byQuota[quota] || 0) + 1;

      if (quota === "MGMT") {
        deptFilledMap[branchName].managementFilled += 1;
      }
    }

    const departmentAnalysis = OFFICIAL_SEAT_MATRIX.map((dept) => {
      const branchData = deptFilledMap[dept.departmentName] || {
        byCategory: {},
        byQuota: {},
        managementFilled: 0,
      };

      const categoriesAnalysis = dept.categories.map((catConfig) => {
        const catCode = catConfig.category.toUpperCase();
        const totalCategoryFilled = branchData.byCategory[catCode] || branchData.byCategory[catCode.replace("/", "")] || 0;

        const totalSanctioned =
          catConfig.huGeneral +
          catConfig.huLadies +
          catConfig.ohuGeneral +
          catConfig.ohuLadies +
          catConfig.pwd +
          catConfig.def;

        const totalVacant = Math.max(0, totalSanctioned - totalCategoryFilled);

        return {
          category: catConfig.category,
          sanctioned: totalSanctioned,
          filled: totalCategoryFilled,
          vacant: totalVacant,
          vacancyRate: totalSanctioned > 0 ? Math.round((totalVacant / totalSanctioned) * 100) : 0,
          subcategories: [
            { label: "Home Univ. General (HU-G)", total: catConfig.huGeneral, filled: Math.min(catConfig.huGeneral, totalCategoryFilled), vacant: Math.max(0, catConfig.huGeneral - Math.min(catConfig.huGeneral, totalCategoryFilled)) },
            { label: "Home Univ. Ladies (HU-L)", total: catConfig.huLadies, filled: 0, vacant: catConfig.huLadies },
            { label: "Other Univ. General (OHU-G)", total: catConfig.ohuGeneral, filled: 0, vacant: catConfig.ohuGeneral },
            { label: "Other Univ. Ladies (OHU-L)", total: catConfig.ohuLadies, filled: 0, vacant: catConfig.ohuLadies },
            { label: "PWD Quota", total: catConfig.pwd, filled: 0, vacant: catConfig.pwd },
            { label: "Defense Quota", total: catConfig.def, filled: 0, vacant: catConfig.def },
          ],
        };
      });

      // Compute Special Seats (EWS, TFWS, AI, IL / Management, Orphan)
      const ewsFilled = branchData.byQuota["EWS"] || 0;
      const tfwsFilled = branchData.byQuota["TFWS"] || 0;
      const aiFilled = branchData.byQuota["AI"] || 0;
      const ilFilled = branchData.managementFilled;
      const orphanFilled = 0;

      const ewsVacant = Math.max(0, dept.ewsSeats - ewsFilled);
      const tfwsVacant = Math.max(0, dept.tfwsSeats - tfwsFilled);
      const aiVacant = Math.max(0, dept.allIndiaSeats - aiFilled);
      const ilVacant = Math.max(0, dept.instituteSeats - ilFilled);
      const orphanTotal = dept.orphanI + dept.orphanN;
      const orphanVacant = Math.max(0, orphanTotal - orphanFilled);

      const totalSanctioned = dept.sanctionIntake + dept.ewsSeats + dept.tfwsSeats;
      const categorySanctioned = categoriesAnalysis.reduce((acc, c) => acc + c.sanctioned, 0);
      const categoryFilled = categoriesAnalysis.reduce((acc, c) => acc + c.filled, 0);
      const categoryVacant = categoriesAnalysis.reduce((acc, c) => acc + c.vacant, 0);

      const grandTotalFilled = categoryFilled + ewsFilled + tfwsFilled + aiFilled + ilFilled + orphanFilled;
      const grandTotalVacant = Math.max(0, totalSanctioned - grandTotalFilled);

      return {
        ...dept,
        totalSanctioned,
        grandTotalFilled,
        grandTotalVacant,
        overallVacancyRate: totalSanctioned > 0 ? Math.round((grandTotalVacant / totalSanctioned) * 100) : 0,
        managementSection: {
          total: dept.instituteSeats,
          filled: ilFilled,
          vacant: ilVacant,
          vacancyRate: dept.instituteSeats > 0 ? Math.round((ilVacant / dept.instituteSeats) * 100) : 100,
        },
        specialSeats: [
          { label: "Management Seats (IL / MGMT)", total: dept.instituteSeats, filled: ilFilled, vacant: ilVacant },
          { label: "EWS (Economically Weaker)", total: dept.ewsSeats, filled: ewsFilled, vacant: ewsVacant },
          { label: "TFWS (Tuition Fee Waiver)", total: dept.tfwsSeats, filled: tfwsFilled, vacant: tfwsVacant },
          { label: "All India (AI Quota)", total: dept.allIndiaSeats, filled: aiFilled, vacant: aiVacant },
          { label: "Orphan Quota", total: orphanTotal, filled: orphanFilled, vacant: orphanVacant },
        ],
        categories: categoriesAnalysis,
      };
    });

    // Compute Institute Level Grand Totals across all 5 departments
    const totalInstIntake = departmentAnalysis.reduce((acc, d) => acc + d.totalSanctioned, 0);
    const totalInstFilled = departmentAnalysis.reduce((acc, d) => acc + d.grandTotalFilled, 0);
    const totalInstVacant = departmentAnalysis.reduce((acc, d) => acc + d.grandTotalVacant, 0);

    // Compute Total Management Seats
    const totalMgmtSeats = departmentAnalysis.reduce((acc, d) => acc + d.instituteSeats, 0);
    const totalMgmtFilled = departmentAnalysis.reduce((acc, d) => acc + d.managementSection.filled, 0);
    const totalMgmtVacant = Math.max(0, totalMgmtSeats - totalMgmtFilled);

    return {
      instituteSummary: {
        totalIntake: totalInstIntake,
        totalFilled: totalInstFilled,
        totalVacant: totalInstVacant,
        overallVacancyRate: totalInstIntake > 0 ? Math.round((totalInstVacant / totalInstIntake) * 100) : 0,
        managementSummary: {
          total: totalMgmtSeats,
          filled: totalMgmtFilled,
          vacant: totalMgmtVacant,
          vacancyRate: totalMgmtSeats > 0 ? Math.round((totalMgmtVacant / totalMgmtSeats) * 100) : 100,
        },
      },
      departments: departmentAnalysis,
    };
  } catch (err) {
    console.error("getVacantSeatsAnalysis warning:", err);
    return null;
  }
}
