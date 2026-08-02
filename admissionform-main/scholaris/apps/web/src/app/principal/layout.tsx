import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/auth";
import { GraduationCap, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  const isAllowedRole = role === "PRINCIPAL" || role === "SUPER_ADMIN" || role === "SystemAdmin";
  if (!isAllowedRole) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950/5 dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-card/95 backdrop-blur-md shadow-xs">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground tracking-tight">Scholaris Executive Portal</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <ShieldCheck className="h-3 w-3" /> Read-Only View
                </span>
              </div>
              <p className="text-xs text-muted-foreground">TSSM&apos;s Bhivarabai Sawant College of Engineering & Research</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-foreground">{session.user.name || "Principal"}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{session.user.email}</p>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
