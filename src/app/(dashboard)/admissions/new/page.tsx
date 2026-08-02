import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WizardClient } from "./wizard-client";
import { prisma } from "@/lib/db";

import { serializeData } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ capCandidateId?: string; recordId?: string; id?: string }>;
}

export default async function NewAdmissionPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const capCandidateId = params.capCandidateId;
  const recordId = params.recordId || params.id;
  let capBanner: { name: string; department: string; category: string | null } | undefined;
  let initialRecord: any = null;

  if (recordId) {
    try {
      initialRecord = await prisma.admissionRecord.findUnique({
        where: { id: recordId },
        include: {
          studentProfile: true,
          form1Application: true,
          form2Checklist: { include: { items: true } },
          form3Eligibility: { include: { educationalGaps: true } },
          form4Affidavit: true,
          form5Library: true,
          documentUploads: true,
        },
      });
    } catch (e) {
      console.warn("recordId query warning:", e);
    }
  }

  if (capCandidateId) {
    const cap = await prisma.capCandidate.findUnique({
      where: { id: capCandidateId },
      include: { choiceCode: { include: { department: true } } },
    });
    if (cap && !cap.isVacant) {
      capBanner = {
        name: cap.candidateName,
        department: cap.choiceCode.department.name,
        category: cap.category,
      };
      if (!initialRecord) {
        try {
          initialRecord = await prisma.admissionRecord.findFirst({
            where: { capCandidateId },
            include: {
              studentProfile: true,
              form1Application: true,
              form2Checklist: { include: { items: true } },
              form3Eligibility: { include: { educationalGaps: true } },
              form4Affidavit: true,
              form5Library: true,
              documentUploads: true,
            },
          });
        } catch (e) {
          console.warn("capCandidateId query warning:", e);
        }
      }
    }
  }

  return (
    <WizardClient
      capCandidateId={capCandidateId}
      capImportBanner={capBanner}
      initialRecord={serializeData(initialRecord)}
    />
  );
}

