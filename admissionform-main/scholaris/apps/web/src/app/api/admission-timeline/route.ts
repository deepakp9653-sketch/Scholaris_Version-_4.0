import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const revalidate = 300;

const yearSchema = z.string().regex(/^\d{4}-\d{2}$/);

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearSchema.safeParse(yearParam).success ? yearParam! : "2026-27";

  try {
    const phases = await prisma.admissionPhase.findMany({
      where: { academicYear: year },
      orderBy: { srNo: "asc" },
    });

    return NextResponse.json({ year, phases });
  } catch (err) {
    console.error("Failed to fetch admission phases:", err);
    return NextResponse.json({ year, phases: [] });
  }
}
