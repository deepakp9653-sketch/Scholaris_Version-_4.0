"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatClientDate } from "@/lib/utils";
import { PasswordGateModal } from "@/components/wizard/password-gate-modal";
import { FeeStatusBadge } from "@/components/fee/fee-status-badge";
import { admitStudent } from "@/lib/actions/final-verification";
import { Search, ShieldCheck, Eye, FileText, DollarSign, CheckCircle2 } from "lucide-react";

interface PendingRecord {
  id: string;
  status: string;
  createdAt: Date;
  studentProfile: {
    fullNameSurname: string | null;
    fullNameFirst: string | null;
    branchCourse: string | null;
    category: string | null;
  } | null;
  capCandidate: { candidateName: string } | null;
  feeRecord: {
    feeStatus: string;
    totalFeeAmount: number | null;
    amountPaid: number | null;
  } | null;
}

interface FinalVerificationClientProps {
  pending: PendingRecord[];
}

const STATUS_BADGES: Record<string, { label: string; style: string }> = {
  DRAFT: { label: "Form Draft", style: "bg-muted text-muted-foreground" },
  FORMS_COMPLETE: { label: "Forms Complete (Docs Pending)", style: "bg-amber-100 text-amber-900 border-amber-300" },
  DOCS_IN_PROGRESS: { label: "Docs In Progress", style: "bg-amber-100 text-amber-900 border-amber-300" },
  DOCS_VERIFIED: { label: "Docs Verified (Fee Pending)", style: "bg-blue-100 text-blue-900 border-blue-300" },
  FEE_RECORDED: { label: "Fee Recorded (Ready to Admit)", style: "bg-blue-100 text-blue-900 border-blue-300" },
  PENDING_FINAL_VERIFICATION: { label: "Awaiting Final Approval", style: "bg-purple-100 text-purple-900 border-purple-300" },
};

export function FinalVerificationClient({ pending }: FinalVerificationClientProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function handleVerifyClick(recordId: string) {
    setVerifyingId(recordId);
    try {
      await admitStudent(recordId, "");
      router.refresh();
    } catch (err) {
      console.error("Error confirming admission:", err);
    } finally {
      setVerifyingId(null);
    }
  }

  const filteredPending = pending.filter((r) => {
    if (!search.trim()) return true;
    const name = [r.studentProfile?.fullNameSurname, r.studentProfile?.fullNameFirst].filter(Boolean).join(" ") || r.capCandidate?.candidateName || "";
    return name.toLowerCase().includes(search.toLowerCase()) || (r.studentProfile?.branchCourse || "").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Verification Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time queue of candidates awaiting document verification, fee approval, and final admission authorization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 px-3 py-1 font-semibold text-xs">
            {pending.length} Pending Records
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search pending candidate by name or branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {filteredPending.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-foreground">No records currently pending in Verification Center</p>
            <p className="text-xs">All candidate forms submitted will appear here in real time for verification and admission approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPending.map((record) => {
            const name = [record.studentProfile?.fullNameSurname, record.studentProfile?.fullNameFirst]
              .filter(Boolean)
              .join(" ") || record.capCandidate?.candidateName || "Unnamed Candidate";

            const badgeInfo = STATUS_BADGES[record.status] || { label: record.status.replace(/_/g, " "), style: "bg-muted text-muted-foreground" };

            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow border border-border/80">
                <CardHeader className="flex flex-row items-center justify-between py-3.5 px-5">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                      {name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {record.studentProfile?.branchCourse ?? "Branch Not Set"} • {record.studentProfile?.category ?? "General"} • Created {formatClientDate(record.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs font-semibold ${badgeInfo.style}`}>
                      {badgeInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between py-3 px-5 border-t border-border/40 bg-muted/20">
                  <FeeStatusBadge
                    feeStatus={record.feeRecord?.feeStatus ?? null}
                    totalFee={record.feeRecord?.totalFeeAmount ? Number(record.feeRecord.totalFeeAmount) : null}
                    amountPaid={record.feeRecord?.amountPaid ? Number(record.feeRecord.amountPaid) : null}
                  />

                  <div className="flex items-center gap-2">
                    <Link href={`/admissions/${record.id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                        <Eye className="w-3.5 h-3.5" /> Overview
                      </Button>
                    </Link>
                    <Link href={`/admissions/${record.id}/documents`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-emerald-300 text-emerald-800 hover:bg-emerald-50">
                        <FileText className="w-3.5 h-3.5" /> Verify Docs
                      </Button>
                    </Link>
                    <Link href={`/admissions/${record.id}/fee`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-blue-300 text-blue-800 hover:bg-blue-50">
                        <DollarSign className="w-3.5 h-3.5" /> Fee & Admit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => handleVerifyClick(record.id)}
                      disabled={verifyingId === record.id}
                      className="h-8 text-xs gap-1 bg-primary text-primary-foreground font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {verifyingId === record.id ? "Admitting..." : "Confirm Admission"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
