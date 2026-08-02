import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdmittedRecords } from "@/lib/actions/final-verification";
import { RegistryClient } from "./registry-client";

export default async function RegistryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const records = await getAdmittedRecords();

  return <RegistryClient records={records} />;
}
