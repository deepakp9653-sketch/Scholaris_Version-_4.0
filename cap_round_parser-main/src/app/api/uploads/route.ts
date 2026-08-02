import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../lib/auth';
import { parseCapPdf } from '../../../lib/parser/capParser';
import { storePreview } from '../../../lib/parser/previewStore';
import prisma from '../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: "Uploaded file must be a PDF document" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedData = await parseCapPdf(buffer, file.name);

    if (parsedData.totalChoiceCodes === 0) {
      return NextResponse.json({ 
        error: "No choice codes or valid allotment tables recognized in this PDF. Please verify the document matches official State CET CAP Round Allotment PDFs." 
      }, { status: 422 });
    }

    const previewId = storePreview(parsedData);

    return NextResponse.json({
      success: true,
      previewId,
      preview: {
        instituteCode: parsedData.instituteCode,
        instituteName: parsedData.instituteName,
        roundLabel: parsedData.roundLabel,
        sourceFilename: parsedData.sourceFilename,
        totalChoiceCodes: parsedData.totalChoiceCodes,
        totalCandidates: parsedData.totalCandidates,
        totalFilledSeats: parsedData.totalFilledSeats,
        totalVacantSeats: parsedData.totalVacantSeats,
        warnings: parsedData.warnings,
        choiceCodesSummary: parsedData.choiceCodes.map(cc => ({
          code: cc.code,
          departmentName: cc.departmentName,
          variant: cc.variant,
          capSeats: cc.capSeats,
          filledSeats: cc.filledSeats,
          vacantSeats: cc.vacantSeats,
          reconciled: cc.reconciled,
          reconciliationWarning: cc.reconciliationWarning
        }))
      }
    });

  } catch (error: any) {
    console.error("Upload parse error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse PDF document" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const batches = await prisma.uploadBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        institute: true,
        _count: {
          select: { choiceCodes: true }
        }
      }
    });

    return NextResponse.json({ success: true, batches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch batches" }, { status: 500 });
  }
}
