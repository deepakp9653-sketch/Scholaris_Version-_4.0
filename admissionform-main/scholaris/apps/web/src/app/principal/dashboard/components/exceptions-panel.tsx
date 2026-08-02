"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUpRight, Clock } from "lucide-react";

interface ExceptionsPanelProps {
  data: {
    id: string;
    candidateName: string;
    branch: string;
    status: string;
    reason: string;
    daysElapsed: number;
    updatedAt: string;
  }[];
}

export function ExceptionsPanel({ data }: ExceptionsPanelProps) {
  return (
    <Card className="rounded-xl border border-border/60 bg-card/95 shadow-sm h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            Exceptions & Attention Required
          </CardTitle>
          <CardDescription className="text-xs">
            List of student applications placed on hold or rejected in the pipeline
          </CardDescription>
        </CardHeader>

        <CardContent>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground space-y-2 border border-dashed border-border/60 rounded-xl bg-muted/20">
              <AlertCircle className="h-8 w-8 text-emerald-500 opacity-80" />
              <p className="text-xs font-medium text-foreground">Zero Exceptions Flagged</p>
              <p className="text-[11px] text-muted-foreground max-w-[240px]">
                There are currently no candidate records on hold or rejected in the system.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {data.map((item) => {
                const isRejected = item.status === "REJECTED";

                return (
                  <Link
                    key={item.id}
                    href={`/admissions/${item.id}`}
                    className="group block p-3 rounded-lg border border-border/50 bg-background/60 hover:bg-muted/40 hover:border-border transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                            {item.candidateName}
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-1.5 ${
                              isRejected
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {isRejected ? "REJECTED" : "ON HOLD"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{item.branch}</p>
                      </div>

                      <div className="flex items-center text-[10px] text-muted-foreground shrink-0 gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {item.daysElapsed === 0
                            ? "Today"
                            : `${item.daysElapsed} ${item.daysElapsed === 1 ? "day" : "days"} ago`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] p-2 rounded bg-muted/40 text-muted-foreground font-mono leading-relaxed border border-border/30">
                      <span className="font-semibold text-foreground font-sans">Reason: </span>
                      {item.reason}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
