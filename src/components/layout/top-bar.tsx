"use client";

import { Search, Bell, ShieldCheck, ChevronDown, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  userName?: string | null;
  role?: string | null;
}

export function TopBar({ userName, role }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
      {/* Left: Global Search & Breadcrumb context */}
      <div className="flex items-center gap-4">
        <div className="relative w-64 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates, CAP IDs, records… (Ctrl+K)"
            className="pl-9 h-8.5 text-xs bg-surface-muted/50 border-border focus:bg-background transition-all rounded-lg"
          />
        </div>
      </div>

      {/* Right: Actions, Badges & Profile */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-muted transition-colors">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
        </button>

        <div className="h-4 w-px bg-border my-auto" />

        {/* User Info Dropdown Trigger */}
        <div className="flex items-center gap-2.5 pl-1 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            {(userName ?? "A")[0].toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold leading-none text-foreground">{userName ?? "System Admin"}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{role ?? "Administrator"}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
