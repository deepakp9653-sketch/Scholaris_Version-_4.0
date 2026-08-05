import { cn } from "@/lib/utils";

const STAGES = [
  { key: "FORMS", label: "Forms" },
  { key: "DOCS", label: "Documents" },
  { key: "FEE", label: "Fee" },
  { key: "PRINT", label: "Print" },
  { key: "VERIFY", label: "Verify" },
  { key: "ADMIT", label: "Admit" },
] as const;

function statusToStageIndex(status: string): number {
  switch (status) {
    case "DRAFT":                     return 0;
    case "FORMS_COMPLETE":            return 0;
    case "DOCS_IN_PROGRESS":          return 1;
    case "DOCS_VERIFIED":             return 1;
    case "FEE_RECORDED":              return 2;
    case "READY_TO_PRINT":            return 3;
    case "PRINTED":                   return 3;
    case "PENDING_FINAL_VERIFICATION": return 4;
    case "ADMITTED":                  return 5;
    case "ON_HOLD":
    case "REJECTED":                  return -1;
    default:                          return 0;
  }
}

function stageStatusFor(status: string, stageIdx: number): "complete" | "current" | "upcoming" | "blocked" {
  const idx = statusToStageIndex(status);
  if (status === "REJECTED" || status === "ON_HOLD") return "blocked";
  if (status === "ADMITTED") return "complete";
  if (stageIdx < idx) return "complete";
  if (stageIdx === idx) return "current";
  return "upcoming";
}

interface StageProgressProps {
  status: string;
  compact?: boolean;
}

export function StageProgress({ status, compact }: StageProgressProps) {
  return (
    <div className={cn("flex items-center gap-1", compact ? "gap-0.5" : "gap-1")}>
      {STAGES.map((stage, i) => {
        const stageStatus = stageStatusFor(status, i);
        return (
          <div key={stage.key} className="flex items-center gap-0.5">
            <div
              className={cn(
                "flex items-center justify-center rounded-full text-xs font-medium transition-colors",
                compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs",
                stageStatus === "complete" && "bg-success text-white",
                stageStatus === "current" && "bg-accent text-white",
                stageStatus === "upcoming" && "bg-surface-muted text-muted-foreground",
                stageStatus === "blocked" && "bg-destructive/20 text-destructive",
              )}
              title={`${stage.label}: ${stageStatus}`}
            >
              {stageStatus === "complete" ? "✓" : stageStatus === "blocked" ? "!" : i + 1}
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "h-px",
                  compact ? "w-2" : "w-3",
                  stageStatus === "complete" ? "bg-success" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
