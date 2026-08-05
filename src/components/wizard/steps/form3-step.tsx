"use client";

import { UseFormReturn } from "react-hook-form";
import { Form3Values } from "@/lib/forms/form3-eligibility";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoFillBadge } from "@/components/wizard/auto-fill-badge";

interface Form3StepProps {
  form: UseFormReturn<Form3Values>;
  autoFilledFields: Set<string>;
}

export function Form3Step({ form, autoFilledFields }: Form3StepProps) {
  const { register, setValue, watch } = form;
  const categoryTick = watch("categoryTick");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course & Applicant Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>
              Course Name
              <AutoFillBadge visible={autoFilledFields.has("courseName")} />
            </Label>
            <Input {...register("courseName")} />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <select {...register("courseYear")} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Select...</option>
              <option value="st">1st</option>
              <option value="nd">2nd</option>
              <option value="rd">3rd</option>
              <option value="th4">4th</option>
              <option value="th5">5th</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select {...register("applicantType")} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Select...</option>
              <option value="Maharashtrian">Maharashtrian</option>
              <option value="Non_Maharashtrian">Non-Maharashtrian</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Nationality</Label>
            <Input {...register("nationality")} />
          </div>
          <div className="space-y-2">
            <Label>
              Religion
              <AutoFillBadge visible={autoFilledFields.has("religion")} />
            </Label>
            <Input {...register("religion")} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={categoryTick ?? ""}
              onChange={(e) => setValue("categoryTick", e.target.value as any)}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Select...</option>
              {[
                { val: "Open", label: "Open" },
                { val: "SC", label: "SC" },
                { val: "ST", label: "ST" },
                { val: "DT_A_", label: "DT(A)" },
                { val: "NT_B_", label: "NT(B)" },
                { val: "NT_C_", label: "NT(C)" },
                { val: "NT_D_", label: "NT(D)" },
                { val: "OBC", label: "OBC" },
                { val: "SBC", label: "SBC" },
                { val: "SEBC", label: "SEBC" },
                { val: "EWS", label: "EWS" }
              ].map(({ val, label }) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={!!watch("belongsToReservedYn")}
              onCheckedChange={(c: any) => setValue("belongsToReservedYn", c === true)}
            />
            <Label className="text-sm">Belongs to DT(A)/NT(B)/NT(C)/NT(D)/OBC/SBC/SEBC/EWS?</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={!!watch("physicallyDisabledYn")}
              onCheckedChange={(c: any) => setValue("physicallyDisabledYn", c === true)}
            />
            <Label className="text-sm">Physically Disabled?</Label>
          </div>
          {watch("physicallyDisabledYn") && (
            <div className="space-y-2">
              <Label>Disability Type</Label>
              <select {...register("physicallyDisabledType")} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                <option value="">Select...</option>
                <option value="P1">P1 - Blind/Visually Impaired</option>
                <option value="P2">P2 - Dumb & Deaf</option>
                <option value="P3">P3 - Orthopedically Impaired</option>
                <option value="P4">P4 - Mentally Challenged</option>
                <option value="OT">OT - Other</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qualifying Examination</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Course Name</Label><Input {...register("qualCourseName")} /></div>
          <div className="space-y-2"><Label>Duration</Label><Input {...register("qualDuration")} /></div>
          <div className="space-y-2"><Label>University</Label><Input {...register("qualUniversity")} /></div>
          <div className="space-y-2"><Label>College/Dept</Label><Input {...register("qualCollegeDept")} /></div>
          <div className="space-y-2"><Label>Seat No.</Label><Input {...register("qualSeatNo")} /></div>
          <div className="space-y-2"><Label>Month & Year of Passing</Label><Input {...register("qualMonthYearPassing")} /></div>
          <div className="space-y-2"><Label>Percentage</Label><Input type="number" step="0.01" {...register("qualPercentage")} /></div>
          <div className="space-y-2"><Label>Class/Grade</Label><Input {...register("qualClassGrade")} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Educational Gap (if any)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Last Exam Name</Label><Input {...register("gapLastExamName")} /></div>
          <div className="space-y-2"><Label>Seat No.</Label><Input {...register("gapSeatNo")} /></div>
          <div className="space-y-2"><Label>Month & Year of Passing</Label><Input {...register("gapMonthYearPassing")} /></div>
          <div className="space-y-2"><Label>Percentage</Label><Input type="number" step="0.01" {...register("gapPercentage")} /></div>
          <div className="space-y-2"><Label>Class/Grade</Label><Input {...register("gapClassGrade")} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Minority & Office Use</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={!!watch("minorityYn")} 
              onCheckedChange={(c: any) => {
                const isChecked = c === true;
                setValue("minorityYn", isChecked);
                if (!isChecked) {
                  setValue("minorityLinguistic", false);
                  setValue("minorityReligion", false);
                }
              }} 
            />
            <Label className="text-sm">Minority?</Label>
          </div>
          {watch("minorityYn") && (
            <>
              <div className="flex items-center gap-3">
                <Checkbox checked={!!watch("minorityLinguistic")} onCheckedChange={(c: any) => setValue("minorityLinguistic", c === true)} />
                <Label className="text-sm">Linguistic</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={!!watch("minorityReligion")} onCheckedChange={(c: any) => setValue("minorityReligion", c === true)} />
                <Label className="text-sm">Religion</Label>
              </div>
            </>
          )}
          <div className="space-y-2"><Label>Receipt No. (Office)</Label><Input {...register("officeReceiptNo")} /></div>
          <div className="space-y-2"><Label>Date (Office)</Label><Input type="date" {...register("officeDate")} /></div>
          <div className="space-y-2"><Label>Eligible Status (Office)</Label><Input {...register("officeEligibleStatus")} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
