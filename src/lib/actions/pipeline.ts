"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import type { admission_status } from "@prisma/client";

export interface PipelineRecord {
  id: string;
  status: admission_status;
  createdAt: Date;
  updatedAt: Date;
  studentProfile: {
    fullNameSurname: string | null;
    fullNameFirst: string | null;
    branchCourse: string | null;
    category: string | null;
    mobileNo: string | null;
  } | null;
  feeRecord: {
    feeStatus: string;
    totalFeeAmount: number | null;
    amountPaid: number | null;
  } | null;
}

export interface DashboardStats {
  todayNewAdmissions: number;
  pendingVerifications: number;
  pendingFeeBalances: number;
  statusCounts: { status: string; count: number }[];
}

export async function getPipelineData(filters?: {
  status?: string[];
  branch?: string;
  category?: string;
}): Promise<PipelineRecord[]> {
  await requireAuth();

  try {
    const where: any = {};

    if (filters?.status?.length) {
      where.status = { in: filters.status };
    }
    if (filters?.branch) {
      where.studentProfile = { ...(where.studentProfile || {}), branchCourse: filters.branch };
    }
    if (filters?.category) {
      where.studentProfile = { ...(where.studentProfile || {}), category: filters.category };
    }

    const rows = await prisma.admissionRecord.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        studentProfile: { select: { fullNameSurname: true, fullNameFirst: true, branchCourse: true, category: true, mobileNo: true } },
        feeRecord: { select: { feeStatus: true, totalFeeAmount: true, amountPaid: true } },
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
  } catch (err) {
    console.warn("Pipeline DB fetch warning:", err);
    return [];
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAuth();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, pendingVerifications, pendingFees, statusCounts] = await Promise.all([
      prisma.admissionRecord.count({ where: { createdAt: { gte: today } } }),
      prisma.admissionRecord.count({ where: { status: "PENDING_FINAL_VERIFICATION" } }),
      prisma.admissionRecord.count({
        where: {
          feeRecord: { feeStatus: { not: "Fully_Paid" } },
        },
      }),
      prisma.admissionRecord.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return {
      todayNewAdmissions: todayCount,
      pendingVerifications,
      pendingFeeBalances: pendingFees,
      statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count })),
    };
  } catch (err) {
    console.warn("Dashboard stats DB warning:", err);
    return {
      todayNewAdmissions: 0,
      pendingVerifications: 0,
      pendingFeeBalances: 0,
      statusCounts: [],
    };
  }
}

export async function getFilterOptions() {
  await requireAuth();

  const records = await prisma.admissionRecord.findMany({
    select: {
      studentProfile: { select: { branchCourse: true, category: true } },
    },
  });

  const branches = new Set<string>();
  const categories = new Set<string>();
  for (const r of records) {
    if (r.studentProfile?.branchCourse) branches.add(r.studentProfile.branchCourse);
    if (r.studentProfile?.category) categories.add(r.studentProfile.category);
  }

  return {
    branches: Array.from(branches).sort(),
    categories: Array.from(categories).sort(),
  };
}
