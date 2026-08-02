import { NextRequest, NextResponse } from "next/server";
import { writeStudentToExcelBatch } from "@/lib/excel-sync/writer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const adminUserId = body.adminUserId || "SystemAdmin";

    const syncResult = await writeStudentToExcelBatch(id, adminUserId);
    return NextResponse.json({
      message: "Student admission completed and synced to SPPU Excel successfully!",
      result: syncResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to complete and sync student to Excel" },
      { status: 400 }
    );
  }
}
