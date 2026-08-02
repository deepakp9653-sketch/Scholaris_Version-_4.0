import { getVacantSeatsAnalysis } from "@/lib/actions/cap";
import { VacantSeatsClient } from "./vacant-seats-client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Vacant Seats Analysis | CAP Analytics",
  description: "Graphical seat matrix breakdown of sanctioned intake vs filled vs vacant seats for all categories and subcategories.",
};

export default async function VacantSeatsAnalysisPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getVacantSeatsAnalysis();

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Failed to load Vacant Seats Analysis data.
      </div>
    );
  }

  return <VacantSeatsClient data={data} />;
}
