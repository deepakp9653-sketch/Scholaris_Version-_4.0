"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Menu,
  X,
  LayoutDashboard,
  CalendarClock,
  PlusCircle,
  ListTodo,
  ShieldCheck,
  ScrollText,
  BarChart3,
  PieChart,
  Users,
  Building2,
  DatabaseBackup,
  GraduationCap,
} from "lucide-react";

interface TopBarProps {
  userName?: string | null;
  role?: string | null;
}

const MOBILE_NAV = [
  { href: "/admissions", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admissions/timeline", label: "Timeline", icon: CalendarClock },
  { href: "/admissions/new", label: "New Admission", icon: PlusCircle },
  { href: "/pipeline", label: "Pipeline", icon: ListTodo },
  { href: "/final-verification", label: "Final Verification", icon: ShieldCheck },
  { href: "/registry", label: "Registry", icon: ScrollText },
  { href: "/doc-lib", label: "Doc Lib", icon: GraduationCap },
  { href: "/cap-analytics", label: "CAP Overview", icon: BarChart3 },
  { href: "/cap-analytics/candidates", label: "CAP Candidates", icon: Users },
  { href: "/cap-analytics/departments", label: "Dept Matrix", icon: Building2 },
];

export function TopBar({ userName, role }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="h-14 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        {/* Left: Mobile Menu Toggle & Brand / Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-lg border border-border bg-surface-muted text-foreground hover:bg-accent focus:outline-none"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 md:hidden">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-foreground">Scholaris</span>
          </div>

          <div className="relative w-full max-w-[220px] sm:w-64 lg:w-80 hidden xs:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search candidates, CAP IDs, records… (Ctrl+K)"
              className="pl-9 h-8.5 text-xs bg-surface-muted/50 border-border focus:bg-background transition-all rounded-lg"
            />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-4/5 max-w-xs bg-sidebar border-r border-sidebar-border p-4 shadow-xl z-50">
            <div className="flex items-center justify-between border-b border-sidebar-border pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm shrink-0">
                  <GraduationCap className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-sidebar-foreground">Scholaris</p>
                  <p className="text-[10px] text-sidebar-muted">Phase 1 ERP</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-sidebar-hover text-sidebar-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1">
              {MOBILE_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? "bg-primary text-primary-foreground font-semibold" : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
