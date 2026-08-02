import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingVerifications } from "@/lib/actions/final-verification";
import { FinalVerificationClient } from "./verification-client";

export default async function FinalVerificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pending = await getPendingVerifications();

  return <FinalVerificationClient pending={pending} />;
}
