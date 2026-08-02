"use client";

import { useRouter } from "next/navigation";

interface BatchOption {
  id: string;
  roundLabel: string;
}

export function CapBatchSelector({
  batches,
  currentBatchId,
}: {
  batches: BatchOption[];
  currentBatchId: string;
}) {
  const router = useRouter();

  return (
    <select
      value={currentBatchId}
      onChange={(e) => {
        router.push(`/cap-analytics?batchId=${e.target.value}`);
      }}
      className="text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground"
    >
      {batches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.roundLabel}
        </option>
      ))}
    </select>
  );
}
