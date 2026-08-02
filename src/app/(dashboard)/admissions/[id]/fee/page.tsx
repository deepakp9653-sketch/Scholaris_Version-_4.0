import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFeeRecord } from "@/lib/actions/fee";
import { FeeClient } from "./fee-client";

export default async function FeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const feeRecord = await getFeeRecord(id);

  return <FeeClient recordId={id} initialFeeRecord={feeRecord} />;
}
