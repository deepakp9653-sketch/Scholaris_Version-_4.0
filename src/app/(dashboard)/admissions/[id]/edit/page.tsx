import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdmissionRecord } from "@/lib/actions/admission";
import { WizardClient } from "../../new/wizard-client";

export default async function EditAdmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const record = await getAdmissionRecord(id);
  if (!record) redirect("/admissions");

  if (record.status !== "DRAFT") {
    redirect(`/admissions/${id}`);
  }

  return (
    <WizardClient
      initialRecord={record as any}
    />
  );
}
