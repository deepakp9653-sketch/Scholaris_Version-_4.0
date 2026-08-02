"use client";

import { UseFormReturn } from "react-hook-form";
import { Form4Values } from "@/lib/forms/form4-affidavit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoFillBadge } from "@/components/wizard/auto-fill-badge";

interface Form4StepProps {
  form: UseFormReturn<Form4Values>;
  autoFilledFields: Set<string>;
}

import { useEffect } from "react";

export function Form4Step({ form, autoFilledFields }: Form4StepProps) {
  const { register, setValue } = form;

  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = String(today.getFullYear());

    setValue("declaredDay", dd);
    setValue("declaredMonth", mm);
    setValue("declaredYear", yyyy);

    setValue("verifiedDay", dd);
    setValue("verifiedMonth", mm);
    setValue("verifiedYear", yyyy);

    if (!form.getValues("verifiedAtPlace")) {
      setValue("verifiedAtPlace", "Pune");
    }
  }, [form, setValue]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Affidavit Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>
              Full Name (with Admission/Enrollment No.)
              <AutoFillBadge visible={autoFilledFields.has("fullNameWithEnrollmentNo")} />
            </Label>
            <Input {...register("fullNameWithEnrollmentNo")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>
              S/o · D/o Mr./Mrs./Ms.
              <AutoFillBadge visible={autoFilledFields.has("sonDaughterOf")} />
            </Label>
            <Input {...register("sonDaughterOf")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Admitted to (Institution)</Label>
            <Input {...register("admittedToInstitution")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Declaration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label>Day</Label><Input {...register("declaredDay")} placeholder="DD" /></div>
          <div className="space-y-2"><Label>Month</Label><Input {...register("declaredMonth")} placeholder="MM" /></div>
          <div className="space-y-2"><Label>Year</Label><Input {...register("declaredYear")} placeholder="YYYY" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Verified at (Place)</Label><Input {...register("verifiedAtPlace")} /></div>
          <div className="space-y-2"><Label>Day</Label><Input {...register("verifiedDay")} /></div>
          <div className="space-y-2"><Label>Month</Label><Input {...register("verifiedMonth")} /></div>
          <div className="space-y-2"><Label>Year</Label><Input {...register("verifiedYear")} /></div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-surface-muted p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Oath Commissioner Section</p>
        <p className="mt-1">This section is left blank for physical notarization on the printed copy.</p>
      </div>
    </div>
  );
}
