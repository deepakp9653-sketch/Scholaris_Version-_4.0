import { prisma } from "@/lib/db";
import { AdmissionCountdownBar, SerializedPhase } from "./AdmissionCountdownBar";

export async function AdmissionCountdownBarServer() {
  try {
    const rawPhases = await prisma.admissionPhase.findMany({
      where: { academicYear: "2026-27" },
      orderBy: { srNo: "asc" },
    });

    const phases: SerializedPhase[] = rawPhases.map((p) => ({
      id: p.id,
      academicYear: p.academicYear,
      srNo: p.srNo,
      category: p.category,
      activity: p.activity,
      shortLabel: p.shortLabel,
      firstDate: p.firstDate.toISOString(),
      lastDate: p.lastDate ? p.lastDate.toISOString() : null,
    }));

    return <AdmissionCountdownBar phases={phases} />;
  } catch {
    return <AdmissionCountdownBar phases={[]} />;
  }
}
