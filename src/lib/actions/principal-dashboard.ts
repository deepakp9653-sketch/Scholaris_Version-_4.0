"use server";

import { prisma } from "@/lib/db";
import { getVacantSeatsAnalysis } from "@/lib/actions/cap";
import { serializeData } from "@/lib/utils";

export async function getKpiMetrics() {
  try {
    const vacantSeatsData = await getVacantSeatsAnalysis();
    const totalSeats = vacantSeatsData?.instituteSummary?.totalIntake || 360;

    const totalAdmitted = await prisma.admissionRecord.count({
      where: { status: "ADMITTED" },
    });

    const feeSum = await prisma.feeRecord.aggregate({
      _sum: {
        amountPaid: true,
      },
    });
    const feesCollected = feeSum._sum.amountPaid ? Number(feeSum._sum.amountPaid) : 0;

    const pendingVerification = await prisma.admissionRecord.count({
      where: { status: "PENDING_FINAL_VERIFICATION" },
    });

    return {
      totalSeats,
      totalAdmitted,
      feesCollected,
      pendingVerification,
    };
  } catch (error) {
    console.error("Error fetching KPI metrics:", error);
    return {
      totalSeats: 360,
      totalAdmitted: 0,
      feesCollected: 0,
      pendingVerification: 0,
    };
  }
}

export async function getAdmissionFunnelData() {
  try {
    const rawCounts = await prisma.admissionRecord.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    const countMap: Record<string, number> = {};
    for (const item of rawCounts) {
      countMap[item.status] = item._count._all;
    }

    const funnelStages = [
      { key: "DRAFT", label: "Draft Form", count: countMap["DRAFT"] || 0 },
      { key: "FORMS_COMPLETE", label: "Forms Filled", count: countMap["FORMS_COMPLETE"] || 0 },
      { key: "DOCS_IN_PROGRESS", label: "Doc Verification In Progress", count: countMap["DOCS_IN_PROGRESS"] || 0 },
      { key: "DOCS_VERIFIED", label: "Docs Verified", count: countMap["DOCS_VERIFIED"] || 0 },
      { key: "FEE_RECORDED", label: "Fee Paid", count: countMap["FEE_RECORDED"] || 0 },
      { key: "PENDING_FINAL_VERIFICATION", label: "Pending Final Approval", count: countMap["PENDING_FINAL_VERIFICATION"] || 0 },
      { key: "ADMITTED", label: "Admitted", count: countMap["ADMITTED"] || 0 },
    ];

    const exceptionCounts = {
      onHold: countMap["ON_HOLD"] || 0,
      rejected: countMap["REJECTED"] || 0,
    };

    return {
      funnelStages,
      exceptionCounts,
    };
  } catch (error) {
    console.error("Error fetching admission funnel data:", error);
    return {
      funnelStages: [],
      exceptionCounts: { onHold: 0, rejected: 0 },
    };
  }
}

export async function getBranchCategoryRiskData() {
  try {
    const analysis = await getVacantSeatsAnalysis();
    if (!analysis || !analysis.departments) return [];

    const branchRisks = analysis.departments.map((dept) => {
      const categoryVacancies: Record<string, { total: number; vacant: number }> = {};
      const reservedCategories = ["SC", "ST", "SEBC", "SBC", "EWS", "OBC", "VJ/NT"];

      let reservedVacancyCount = 0;
      for (const cat of dept.categories) {
        const nameUpper = cat.category.toUpperCase();
        if (reservedCategories.some((r) => nameUpper.includes(r))) {
          categoryVacancies[cat.category] = {
            total: cat.sanctioned,
            vacant: cat.vacant,
          };
          reservedVacancyCount += cat.vacant;
        }
      }

      // EWS from specialSeats
      const ewsSeat = dept.specialSeats.find((s) => s.label.includes("EWS"));
      if (ewsSeat) {
        categoryVacancies["EWS"] = {
          total: ewsSeat.total,
          vacant: ewsSeat.vacant,
        };
        reservedVacancyCount += ewsSeat.vacant;
      }

      const mgmt = dept.managementSection;

      return {
        departmentName: dept.departmentName,
        sanctionIntake: dept.sanctionIntake,
        totalVacant: dept.grandTotalVacant,
        reservedVacancyCount,
        categoryVacancies,
        management: {
          total: mgmt.total,
          filled: mgmt.filled,
          vacant: mgmt.vacant,
        },
      };
    });

    // Sort branches with any reserved-category vacancy > 0 to the top
    branchRisks.sort((a, b) => b.reservedVacancyCount - a.reservedVacancyCount);

    return branchRisks;
  } catch (error) {
    console.error("Error fetching branch category risk data:", error);
    return [];
  }
}

export async function getFinancialSummaryData() {
  try {
    const totals = await prisma.feeRecord.aggregate({
      _sum: {
        totalFeeAmount: true,
        amountPaid: true,
        remainingBalance: true,
      },
    });

    const modeGroups = await prisma.feeRecord.groupBy({
      by: ["modeOfPayment"],
      _count: {
        _all: true,
      },
      _sum: {
        amountPaid: true,
      },
    });

    const modeBreakdown = modeGroups.map((group) => ({
      mode: group.modeOfPayment || "Unspecified",
      count: group._count._all,
      amount: group._sum.amountPaid ? Number(group._sum.amountPaid) : 0,
    }));

    return {
      totalFeeAmount: totals._sum.totalFeeAmount ? Number(totals._sum.totalFeeAmount) : 0,
      totalAmountPaid: totals._sum.amountPaid ? Number(totals._sum.amountPaid) : 0,
      totalRemainingBalance: totals._sum.remainingBalance ? Number(totals._sum.remainingBalance) : 0,
      modeBreakdown,
    };
  } catch (error) {
    console.error("Error fetching financial summary data:", error);
    return {
      totalFeeAmount: 0,
      totalAmountPaid: 0,
      totalRemainingBalance: 0,
      modeBreakdown: [],
    };
  }
}

export async function getExceptionsData() {
  try {
    const records = await prisma.admissionRecord.findMany({
      where: {
        status: {
          in: ["ON_HOLD", "REJECTED"],
        },
      },
      include: {
        studentProfile: true,
        form1Application: true,
        capCandidate: {
          include: {
            choiceCode: {
              include: {
                department: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const now = new Date().getTime();

    const exceptions = records.map((rec) => {
      const name =
        rec.studentProfile?.fullNameFirst ||
        rec.capCandidate?.candidateName ||
        "Candidate";

      const surname = rec.studentProfile?.fullNameSurname || "";

      const fullName = surname ? `${surname} ${name}` : name;

      const branch =
        rec.studentProfile?.branchCourse ||
        rec.form1Application?.officeUseBranch ||
        rec.capCandidate?.choiceCode?.department?.name ||
        "Computer Engineering";

      const updatedTime = new Date(rec.updatedAt).getTime();
      const daysElapsed = Math.floor((now - updatedTime) / (1000 * 60 * 60 * 24));

      return {
        id: rec.id,
        candidateName: fullName,
        branch,
        status: rec.status,
        reason: rec.holdReason || rec.rejectedReason || "No specific reason logged",
        daysElapsed,
        updatedAt: rec.updatedAt.toISOString(),
      };
    });

    return serializeData(exceptions);
  } catch (error) {
    console.error("Error fetching exceptions data:", error);
    return [];
  }
}
