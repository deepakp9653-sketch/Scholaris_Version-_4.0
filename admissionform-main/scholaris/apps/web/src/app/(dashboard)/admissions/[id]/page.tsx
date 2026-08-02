import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdmissionRecord } from "@/lib/actions/admission";
import { AdmissionDetailClient } from "./admission-detail-client";

// Force dynamic — prevents static page data collection in the build which would
// trigger the lucide-react createContext SSR evaluation error in Turbopack
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ capImported?: string }>;
}

export default async function AdmissionRecordOverviewPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const { capImported } = await searchParams;

  const record = await getAdmissionRecord(id);
  if (!record) redirect("/admissions");

  if (capImported === "1" && record.status === "DRAFT") {
    redirect(`/admissions/${id}/edit`);
  }

  return (
    <AdmissionDetailClient
      record={JSON.parse(JSON.stringify(record))}
      id={id}
    />
  );
}
