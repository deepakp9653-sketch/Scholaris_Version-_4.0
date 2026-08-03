"use client";

import { Input } from "@/components/ui/input";

interface TopBarProps {
  userName?: string | null;
  role?: string | null;
}

export function TopBar({ userName, role }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
      {/* Left: Global Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-64 lg:w-80">
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
  );
}
