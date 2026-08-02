"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FeeStatusBadge } from "@/components/fee/fee-status-badge";
import { saveFeeRecord, confirmAdmissionAndSetAdmitted, addInstallment, voidInstallment, type FeeRecordResponse } from "@/lib/actions/fee";
import { verifyFormsPassword } from "@/lib/actions/admission";
import { PasswordGateModal } from "@/components/wizard/password-gate-modal";
import { CheckCircle2 } from "lucide-react";
import { formatClientDate } from "@/lib/utils";

interface FeeClientProps {
  recordId: string;
  initialFeeRecord: FeeRecordResponse | null;
}

export function FeeClient({ recordId, initialFeeRecord }: FeeClientProps) {
  const router = useRouter();
  const [feeRecord, setFeeRecord] = useState<FeeRecordResponse | null>(initialFeeRecord);
  const [totalFee, setTotalFee] = useState(feeRecord?.totalFeeAmount?.toString() ?? "");
  const [amountPaid, setAmountPaid] = useState(feeRecord?.amountPaid?.toString() ?? "");
  const [modeOfPayment, setModeOfPayment] = useState(feeRecord?.modeOfPayment ?? "");
  const [installmentEnabled, setInstallmentEnabled] = useState(feeRecord?.installmentEnabled ?? false);
  const [pending, setPending] = useState(false);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [instAmount, setInstAmount] = useState("");
  const [instMode, setInstMode] = useState("");
  const [instDate, setInstDate] = useState("");

  const totalFeeNum = parseFloat(totalFee) || 0;
  const amountPaidNum = parseFloat(amountPaid) || 0;
  const remaining = totalFeeNum - amountPaidNum;

  const displayFeeStatus = totalFeeNum <= 0 ? "No Fee"
    : amountPaidNum >= totalFeeNum ? "Fully_Paid"
    : amountPaidNum <= 0 ? "Unpaid"
    : "Partially_Paid";

  async function handlePasswordVerify(password: string): Promise<boolean> {
    try {
      const valid = await verifyFormsPassword(recordId, password);
      if (!valid.success) return false;

      await saveFeeRecord(recordId, {
        totalFeeAmount: totalFeeNum,
        amountPaid: amountPaidNum,
        modeOfPayment: modeOfPayment || "Cash",
        installmentEnabled,
      });

      await confirmAdmissionAndSetAdmitted(recordId);
      return true;
    } catch (err) {
      console.error("Fee verification error:", err);
      return false;
    }
  }

  function handlePasswordSuccess() {
    setShowPasswordGate(false);
    router.push("/admissions");
    router.refresh();
  }

  async function handleAddInstallment() {
    if (!instAmount) return;
    setPending(true);
    await addInstallment(recordId, {
      amount: parseFloat(instAmount),
      modeOfPayment: instMode || modeOfPayment,
      date: instDate,
    });
    const updated = await import("@/lib/actions/fee").then(m => m.getFeeRecord(recordId));
    setFeeRecord(updated as any);
    setInstAmount("");
    setInstDate("");
    setPending(false);
  }

  async function handleVoidInstallment(installmentId: string) {
    await voidInstallment(installmentId, recordId);
    const updated = await import("@/lib/actions/fee").then(m => m.getFeeRecord(recordId));
    setFeeRecord(updated as any);
  }

  const installments = feeRecord?.installments ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Fee Entry
          </h1>
          <p className="text-sm text-muted-foreground">
            Record payment status for this admission.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-surface-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Fee</p>
              <p className="text-xl font-bold text-foreground">
                ₹{totalFeeNum.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="text-xl font-bold text-success">
                ₹{amountPaidNum.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className={`text-xl font-bold ${remaining > 0 ? 'text-pending' : 'text-success'}`}>
                ₹{remaining.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <FeeStatusBadge
              feeStatus={displayFeeStatus}
              totalFee={totalFeeNum}
              amountPaid={amountPaidNum}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalFee">Total Fee Amount (₹)</Label>
              <Input
                id="totalFee"
                type="number"
                step="0.01"
                value={totalFee}
                onChange={(e) => setTotalFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modeOfPayment">Mode of Payment</Label>
              <select
                id="modeOfPayment"
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="">Select...</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank_to_Bank">Bank to Bank</option>
                <option value="RTGS">RTGS</option>
                <option value="DD">DD</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={installmentEnabled}
                  onChange={(e) => setInstallmentEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                Enable Installment Plan
              </label>
            </div>
          </div>

          <Button onClick={() => setShowPasswordGate(true)} disabled={pending} className="gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            {pending ? "Confirming..." : "Save Fee & Confirm Admission"}
          </Button>
        </CardContent>
      </Card>

      {installmentEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Installments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {installments.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-2">#</th>
                    <th className="text-left py-2 pr-2">Amount</th>
                    <th className="text-left py-2 pr-2">Mode</th>
                    <th className="text-left py-2 pr-2">Date</th>
                    <th className="text-left py-2 pr-2">Remaining</th>
                    <th className="text-center py-2 w-16">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((inst) => (
                    <tr key={inst.id} className={`border-b border-border/50 ${inst.voided ? 'opacity-50' : ''}`}>
                      <td className="py-1.5 pr-2">{inst.installmentNo}</td>
                      <td className="py-1.5 pr-2">₹{inst.amount?.toLocaleString() ?? "-"}</td>
                      <td className="py-1.5 pr-2">{inst.modeOfPayment ?? "-"}</td>
                      <td className="py-1.5 pr-2" suppressHydrationWarning>{formatClientDate(inst.date)}</td>
                      <td className="py-1.5 pr-2">₹{inst.remainingAfter?.toLocaleString() ?? "-"}</td>
                      <td className="py-1.5 text-center">
                        {inst.voided ? (
                          <span className="text-xs text-destructive">Voided</span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-destructive hover:underline"
                            onClick={() => handleVoidInstallment(inst.id)}
                          >
                            Void
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <Separator />

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={instAmount}
                  onChange={(e) => setInstAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mode</Label>
                <select
                  value={instMode}
                  onChange={(e) => setInstMode(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  <option value="">Same as above</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank_to_Bank">Bank to Bank</option>
                  <option value="RTGS">RTGS</option>
                  <option value="DD">DD</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={instDate} onChange={(e) => setInstDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button size="sm" onClick={handleAddInstallment} disabled={pending || !instAmount}>
                  Add Installment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <PasswordGateModal
        open={showPasswordGate}
        onOpenChange={setShowPasswordGate}
        title="Confirm Student Admission"
        description="Enter operator password to confirm fee details and officially admit this student."
        onVerify={handlePasswordVerify}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
}
