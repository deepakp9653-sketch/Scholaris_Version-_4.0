import { NextRequest, NextResponse } from "next/server";
import { validateRecordForExcel } from "@/lib/excel-sync/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const validation = await validateRecordForExcel(id);
    return NextResponse.json(validation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to validate student record" },
      { status: 500 }
    );
  }
}
