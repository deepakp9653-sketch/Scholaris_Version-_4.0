import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedBatchId = searchParams.get('batchId');

    const batch = requestedBatchId
      ? await prisma.uploadBatch.findUnique({
          where: { id: requestedBatchId },
          include: { institute: true }
        })
      : await prisma.uploadBatch.findFirst({
          orderBy: { createdAt: 'desc' },
          include: { institute: true }
        });

    if (!batch) {
      return NextResponse.json({
        hasData: false,
        message: "No uploaded batches found. Please upload a CAP round PDF."
      });
    }

    const choiceCodes = await prisma.choiceCode.findMany({
      where: { batchId: batch.id },
      include: {
        department: true
      }
    });

    let totalSanctionIntake = 0;
    let totalCapSeats = 0;
    let totalFilledSeats = 0;
    let totalVacantSeats = 0;

    choiceCodes.forEach(cc => {
      totalSanctionIntake += cc.sanctionIntake;
      totalCapSeats += cc.capSeats;
      totalFilledSeats += cc.filledSeats;
      totalVacantSeats += cc.vacantSeats;
    });

    const fillRate = totalCapSeats > 0 ? parseFloat(((totalFilledSeats / totalCapSeats) * 100).toFixed(1)) : 0;

    const statusCountsRaw = await prisma.candidate.groupBy({
      by: ['statusLabel', 'isVacant'],
      where: { choiceCode: { batchId: batch.id } },
      _count: { _all: true }
    });

    const statusCounts: Record<string, number> = {};
    statusCountsRaw.forEach(item => {
      const label = item.isVacant ? 'Vacant Seat' : (item.statusLabel || 'Standard Allotment');
      statusCounts[label] = (statusCounts[label] || 0) + item._count._all;
    });

    const deptSummaryMap: Record<string, { id: string; name: string; intake: number; capSeats: number; filled: number; vacant: number; choiceCodesCount: number }> = {};

    choiceCodes.forEach(cc => {
      const deptName = cc.department.name;
      if (!deptSummaryMap[deptName]) {
        deptSummaryMap[deptName] = {
          id: cc.department.id,
          name: deptName,
          intake: 0,
          capSeats: 0,
          filled: 0,
          vacant: 0,
          choiceCodesCount: 0
        };
      }
      deptSummaryMap[deptName].intake += cc.sanctionIntake;
      deptSummaryMap[deptName].capSeats += cc.capSeats;
      deptSummaryMap[deptName].filled += cc.filledSeats;
      deptSummaryMap[deptName].vacant += cc.vacantSeats;
      deptSummaryMap[deptName].choiceCodesCount += 1;
    });

    const departmentSummaries = Object.values(deptSummaryMap).map(d => ({
      ...d,
      fillRate: d.capSeats > 0 ? parseFloat(((d.filled / d.capSeats) * 100).toFixed(1)) : 0
    }));

    return NextResponse.json({
      hasData: true,
      batch: {
        id: batch.id,
        roundLabel: batch.roundLabel,
        publishedOn: batch.publishedOn,
        sourceFilename: batch.sourceFilename,
        instituteCode: batch.institute.code,
        instituteName: batch.institute.name
      },
      headlineStats: {
        totalSanctionIntake,
        totalCapSeats,
        totalFilledSeats,
        totalVacantSeats,
        fillRate,
        totalChoiceCodes: choiceCodes.length,
        totalDepartments: departmentSummaries.length
      },
      statusCounts,
      departmentSummaries
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load overview analytics" }, { status: 500 });
  }
}
