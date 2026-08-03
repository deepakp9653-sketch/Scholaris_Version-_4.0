"use client";

import { Search } from "lucide-react";
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates, CAP IDs, records… (Ctrl+K)"
            className="pl-9 h-8.5 text-xs bg-surface-muted/50 border-border focus:bg-background transition-all rounded-lg"
          />
        </div>
      </div>
    </header>
  );
}
