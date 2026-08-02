"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { FORM_LABELS } from "@/lib/forms";

interface WizardStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
}

export function WizardStepper({ currentStep, completedSteps }: WizardStepperProps) {
  return (
    <nav aria-label="Form progress" className="w-full">
      <ol className="flex items-center gap-0">
        {FORM_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = currentStep === i;
          const isCompleted = completedSteps.has(i);

          return (
            <li key={i} className="flex-1">
              <div className="flex items-center">
                {i > 0 && (
                  <div
                    className={cn(
                      "h-px flex-1 mx-1",
                      isCompleted || (isActive && completedSteps.size >= i)
                        ? "bg-success"
                        : "bg-border"
                    )}
                  />
                )}
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      isCompleted && "bg-success text-white",
                      isActive && !isCompleted && "bg-accent text-accent-foreground ring-2 ring-accent/30",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] leading-tight text-center max-w-[80px] truncate hidden sm:block",
                      isActive ? "font-medium text-accent" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
