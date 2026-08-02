import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const batches = await prisma.academicBatch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { audits: true },
        },
      },
    });
    return NextResponse.json({ batches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch batches" }, { status: 500 });
  }
}
