import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedBatchId = searchParams.get('batchId');
    const search = searchParams.get('search') || '';
    const choiceCode = searchParams.get('choiceCode') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const category = searchParams.get('category') || 'ALL';
    const gender = searchParams.get('gender') || 'ALL';
    const scoreType = searchParams.get('scoreType') || 'ALL';

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);

    const batch = requestedBatchId
      ? await prisma.uploadBatch.findUnique({ where: { id: requestedBatchId } })
      : await prisma.uploadBatch.findFirst({ orderBy: { createdAt: 'desc' } });

    if (!batch) {
      return NextResponse.json({ candidates: [], total: 0, page: 1, totalPages: 1 });
    }

    const where: Prisma.CandidateWhereInput = {
      choiceCode: {
        batchId: batch.id
      }
    };

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { applicationId: { contains: q, mode: 'insensitive' } },
        { candidateName: { contains: q, mode: 'insensitive' } },
        { seatTypeCode: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (choiceCode !== 'ALL') {
      where.choiceCode = {
        batchId: batch.id,
        code: choiceCode
      };
    }

    if (status !== 'ALL') {
      if (status === 'Vacant') {
        where.isVacant = true;
      } else {
        where.isVacant = false;
        where.statusLabel = status;
      }
    }

    if (category !== 'ALL') {
      where.seatTypeCode = { contains: category };
    }

    if (gender !== 'ALL') {
      where.gender = gender as any;
    }

    if (scoreType !== 'ALL') {
      where.scoreType = scoreType as any;
    }

    const total = await prisma.candidate.count({ where });
    const totalPages = Math.ceil(total / pageSize) || 1;
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * pageSize;

    const candidates = await prisma.candidate.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { srNo: 'asc' },
      include: {
        choiceCode: {
          include: {
            department: true
          }
        }
      }
    });

    const formatted = candidates.map(c => ({
      id: c.id,
      srNo: c.srNo,
      meritNo: c.meritNo,
      score: c.score,
      scoreType: c.scoreType,
      applicationId: c.applicationId,
      candidateName: c.candidateName,
      gender: c.gender,
      category: c.category,
      seatTypeCode: c.seatTypeCode,
      statusSymbol: c.statusSymbol,
      statusLabel: c.statusLabel,
      isVacant: c.isVacant,
      choiceCode: c.choiceCode.code,
      departmentName: c.choiceCode.department.name
    }));

    return NextResponse.json({
      candidates: formatted,
      total,
      page: safePage,
      pageSize,
      totalPages
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch candidate records" }, { status: 500 });
  }
}
