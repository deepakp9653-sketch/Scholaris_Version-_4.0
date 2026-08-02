import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedBatchId = searchParams.get('batchId');

    const batch = requestedBatchId
      ? await prisma.uploadBatch.findUnique({ where: { id: requestedBatchId } })
      : await prisma.uploadBatch.findFirst({ orderBy: { createdAt: 'desc' } });

    if (!batch) {
      return NextResponse.json({ choiceCodes: [] });
    }

    const choiceCodes = await prisma.choiceCode.findMany({
      where: { batchId: batch.id },
      include: {
        department: true,
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { code: 'asc' }
    });

    const formatted = choiceCodes.map(cc => ({
      id: cc.id,
      code: cc.code,
      departmentName: cc.department.name,
      variant: cc.variant,
      statusLabel: cc.statusLabel,
      sanctionIntake: cc.sanctionIntake,
      capSeats: cc.capSeats,
      msSeats: cc.msSeats,
      minoritySeats: cc.minoritySeats,
      aiSeats: cc.aiSeats,
      instituteSeats: cc.instituteSeats,
      filledSeats: cc.filledSeats,
      vacantSeats: cc.vacantSeats,
      fillRate: cc.capSeats > 0 ? parseFloat(((cc.filledSeats / cc.capSeats) * 100).toFixed(1)) : 0
    }));

    return NextResponse.json({ choiceCodes: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch department choice codes" }, { status: 500 });
  }
}
