"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  PlusCircle,
  ListTodo,
  ShieldCheck,
  ScrollText,
  LogOut,
  BarChart3,
  Users,
  Building2,
  DatabaseBackup,
  GraduationCap,
  ChevronRight,
  CalendarClock,
  FolderLock,
  Lock,
  PieChart,
} from "lucide-react";
import { useState } from "react";
import { PasswordGateModal } from "@/components/wizard/password-gate-modal";
import { verifyDocLibPassword } from "@/lib/actions/doc-lib";

const ADMISSION_NAV = [
  { href: "/admissions", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admissions/timeline", label: "Timeline", icon: CalendarClock },
  { href: "/admissions/new", label: "New Admission", icon: PlusCircle },
  { href: "/pipeline", label: "Pipeline", icon: ListTodo },
  { href: "/final-verification", label: "Final Verification", icon: ShieldCheck },
  { href: "/registry", label: "Registry", icon: ScrollText },
];

const CAP_NAV = [
  { href: "/cap-analytics", label: "Overview", icon: BarChart3 },
  { href: "/cap-analytics/vacant-seats", label: "Vacant Seats Analysis", icon: PieChart },
  { href: "/cap-analytics/candidates", label: "Candidate List", icon: Users },
  { href: "/cap-analytics/departments", label: "Dept. Matrix", icon: Building2 },
  { href: "/cap-analytics/data", label: "Data & Upload", icon: DatabaseBackup },
];

function NavGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      <span
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </span>
    </Link>
  );
}

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [capExpanded, setCapExpanded] = useState(
    pathname.startsWith("/cap-analytics"),
  );
  const [docLibModalOpen, setDocLibModalOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  const isDocLibActive = pathname.startsWith("/doc-lib");

  const handleDocLibClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const isUnlocked = sessionStorage.getItem("doc_lib_unlocked") === "true";
      if (isUnlocked) {
        router.push("/doc-lib");
      } else {
        setDocLibModalOpen(true);
      }
    }
  };

  return (
    <>
      <aside className="hidden md:flex h-full w-[220px] flex-col bg-sidebar border-r border-sidebar-border shrink-0">
        {/* Brand */}
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm shrink-0">
            <GraduationCap className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-sidebar-foreground">Scholaris</p>
            <p className="text-[10px] leading-tight text-sidebar-muted">Phase 1 ERP</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5" aria-label="Main navigation">
          {/* CAP Analytics Section (collapsible) */}
          <NavGroup label="CAP Analytics">
            <div className="space-y-0.5">
              {/* CAP Section Toggle Header */}
              <button
                onClick={() => setCapExpanded((p) => !p)}
                className={cn(
                  "w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  pathname.startsWith("/cap-analytics")
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="h-4 w-4 shrink-0" />
                  <span>CAP Round</span>
                </div>
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    capExpanded ? "rotate-90" : "",
                  )}
                />
              </button>

              {/* Sub-items */}
              {capExpanded && (
                <div className="ml-3 pl-3 border-l border-sidebar-border/60 space-y-0.5">
                  {CAP_NAV.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isActive(item.href)}
                    />
                  ))}
                </div>
              )}
            </div>
          </NavGroup>

          {/* Admissions Section */}
          <NavGroup label="Admissions">
            <div className="space-y-0.5">
              {ADMISSION_NAV.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive(item.href)}
                />
              ))}
            </div>
          </NavGroup>

          {/* Vault / Library Section */}
          <NavGroup label="Vault & Documents">
            <div className="space-y-0.5">
              <button
                onClick={handleDocLibClick}
                className={cn(
                  "w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all text-left",
                  isDocLibActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <FolderLock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Doc Lib</span>
                </div>
                <Lock className="h-3 w-3 opacity-60 shrink-0" />
              </button>
            </div>
          </NavGroup>

          {/* Executive Section */}
          <NavGroup label="Executive">
            <div className="space-y-0.5">
              <NavItem
                href="/principal/dashboard"
                label="Principal Portal"
                icon={ShieldCheck}
                active={isActive("/principal")}
              />
            </div>
          </NavGroup>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {(userName ?? "U")[0].toUpperCase()}
            </div>
            <p className="truncate text-xs text-sidebar-muted">{userName ?? "User"}</p>
          </div>
          <Link href="/api/auth/signout">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs h-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>

      {/* Password Gate Modal for Doc Lib */}
      <PasswordGateModal
        open={docLibModalOpen}
        onOpenChange={setDocLibModalOpen}
        title="Doc Lib Access Vault"
        description="Enter the Doc Lib password to unlock official student documents and SPPU eligibility criteria."
        onVerify={async (pass) => {
          const res = await verifyDocLibPassword(pass);
          return res.success;
        }}
        onSuccess={() => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("doc_lib_unlocked", "true");
          }
          setDocLibModalOpen(false);
          router.push("/doc-lib");
        }}
      />
    </>
  );
}

