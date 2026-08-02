import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const record = await prisma.admissionRecord.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!record) return <div>Record not found</div>;

  return <DocumentsClient recordId={record.id} currentStatus={record.status} />;
}
