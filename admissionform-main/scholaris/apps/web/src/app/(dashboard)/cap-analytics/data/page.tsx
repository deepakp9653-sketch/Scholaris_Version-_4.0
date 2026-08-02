"use client";

import { useState, useEffect } from "react";
import { getCapBatches } from "@/lib/actions/cap";
import { DataPageClient } from "./data-client";
import { Loader2 } from "lucide-react";

export default function CapDataPage() {
  const [batches, setBatches] = useState<Awaited<ReturnType<typeof getCapBatches>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getCapBatches().then((data) => {
      if (isMounted) {
        setBatches(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-muted-foreground gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading Upload History…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">CAP Data & Upload</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage CAP Round PDF uploads and parsed datasets
        </p>
      </div>
      <DataPageClient batches={batches as Parameters<typeof DataPageClient>[0]["batches"]} />
    </div>
  );
}
