import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPipelineData, getFilterOptions } from "@/lib/actions/pipeline";
import { PipelineClient } from "./pipeline-client";

export default async function PipelinePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [records, filterOptions] = await Promise.all([
    getPipelineData(),
    getFilterOptions(),
  ]);

  return <PipelineClient records={records} filterOptions={filterOptions} />;
}
