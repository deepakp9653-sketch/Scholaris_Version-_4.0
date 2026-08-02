import { prisma } from "@/lib/db";
import { AdmissionTimelineList, SerializedPhase } from "./timeline-client";

export const metadata = {
  title: "Engineering Admission Process Timeline 2026-27 | Scholaris",
  description: "Official CAP Round Admission Schedule for First Year Engineering 2026-27.",
};

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Page Header SVG */}
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight">
              Engineering Admission Process — 2026-27
            </h1>
            <p className="text-sm text-muted-foreground">
              Official Centralized Admission Process (CAP) Schedule &amp; Activity Status
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Grouped Schedule List */}
      <AdmissionTimelineList phases={phases} />
    </div>
  );
}
