import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedBatchId = searchParams.get('batchId');
    const format = searchParams.get('format') || 'csv';

    const batch = requestedBatchId
      ? await prisma.uploadBatch.findUnique({ where: { id: requestedBatchId } })
      : await prisma.uploadBatch.findFirst({ orderBy: { createdAt: 'desc' } });

    if (!batch) {
      return NextResponse.json({ error: "No batch found for export" }, { status: 404 });
    }

    const candidates = await prisma.candidate.findMany({
      where: { choiceCode: { batchId: batch.id } },
      orderBy: { srNo: 'asc' },
      include: {
        choiceCode: {
          include: { department: true }
        }
      }
    });

    if (format === 'json') {
      const jsonStr = JSON.stringify(candidates, null, 2);
      return new NextResponse(jsonStr, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="Scholaris_Candidates_${batch.roundLabel.replace(/\s+/g, '_')}.json"`
        }
      });
    }

    const headers = [
      'Sr No', 'Merit No', 'Score Type', 'Score', 'Application ID', 
      'Candidate Name', 'Gender', 'Category', 'Choice Code', 'Department Name', 
      'Seat Type Code', 'Status Symbol', 'Status Label', 'Is Vacant'
    ];

    const rows = candidates.map(c => [
      c.srNo,
      c.meritNo || '',
      c.scoreType || '',
      c.score || '',
      `"${c.applicationId || ''}"`,
      `"${c.candidateName.replace(/"/g, '""')}"`,
      c.gender || '',
      `"${c.category || ''}"`,
      `"${c.choiceCode.code}"`,
      `"${c.choiceCode.department.name}"`,
      `"${c.seatTypeCode}"`,
      c.statusSymbol || '',
      `"${c.statusLabel || ''}"`,
      c.isVacant
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Scholaris_Candidates_${batch.roundLabel.replace(/\s+/g, '_')}.csv"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to export candidate data" }, { status: 500 });
  }
}
