import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await context.params;

    const batch = await prisma.academicBatch.findUnique({
      where: { id },
    });

    if (!batch || !batch.workingExcelPath) {
      return NextResponse.json({ error: "Batch or working Excel file not found" }, { status: 404 });
    }

    const fullPath = path.join(process.cwd(), "public", batch.workingExcelPath.replace(/^\//, ""));

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "Working Excel file missing from disk" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const fileName = path.basename(fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error("Error downloading batch Excel:", err);
    return NextResponse.json({ error: err.message || "Failed to download batch Excel" }, { status: 500 });
  }
}
