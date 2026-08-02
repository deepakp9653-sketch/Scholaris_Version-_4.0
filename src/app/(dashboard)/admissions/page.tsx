import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/pipeline";
import { DashboardHome } from "../dashboard-home";

export default async function AdmissionsDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stats = await getDashboardStats();

  return <DashboardHome user={session.user} stats={stats} />;
}
