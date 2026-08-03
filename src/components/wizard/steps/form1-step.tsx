"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Form1Values } from "@/lib/forms/form1-application";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoFillBadge } from "@/components/wizard/auto-fill-badge";
import { Calculator } from "lucide-react";

interface Form1StepProps {
  form: UseFormReturn<Form1Values>;
  autoFilledFields: Set<string>;
}

export function Form1Step({ form, autoFilledFields }: Form1StepProps) {
  const { register, setValue, watch, getValues } = form;
  const admissionQuota = watch("admissionQuota");
  const gender = watch("gender");
  const bloodGroup = watch("bloodGroup");
  const officeUseEligibleFor = watch("officeUseEligibleFor");

  // Watch fields for mathematical calculations
  const sscGrandObtained = watch("sscGrandTotalObtained");
  const sscGrandOutOf = watch("sscGrandTotalOutOf");

  const hscPhys = watch("hscPhysicsObtained");
  const hscChem = watch("hscChemistryObtained");
  const hscMath = watch("hscMathsObtained");

  // 1. Fixed Academic Year 2026 - 2027
  useEffect(() => {
    setValue("admissionYearStart", 2026);
    setValue("admissionYearEnd", 2027);
  }, [setValue]);

  // 2. S.S.C. Percentage Auto-calculation
  useEffect(() => {
    setValue("sscMarksEnglishOutOf", 100);
    setValue("sscMarksMathsOutOf", 100);
    setValue("sscGrandTotalOutOf", 500);

    const obt = Number(sscGrandObtained);
    const out = Number(sscGrandOutOf) || 500;
    if (!isNaN(obt) && !isNaN(out) && out > 0) {
      const pct = Math.round((obt / out) * 10000) / 100;
      setValue("sscPercentage", pct, { shouldValidate: true });
    }
  }, [sscGrandObtained, sscGrandOutOf, setValue]);

  // 3. H.S.C. PCM Total Auto-calculation
  useEffect(() => {
    setValue("hscPhysicsOutOf", 100);
    setValue("hscChemistryOutOf", 100);
    setValue("hscMathsOutOf", 100);
    setValue("hscPcmTotalOutOf", 300);
    setValue("hscGrandTotalOutOf", 600);

    const pObt = Number(hscPhys) || 0;
    const cObt = Number(hscChem) || 0;
    const mObt = Number(hscMath) || 0;
    if (hscPhys !== undefined || hscChem !== undefined || hscMath !== undefined) {
      const pcmTotal = pObt + cObt + mObt;
      setValue("hscPcmTotalObtained", pcmTotal, { shouldValidate: true });
    }
  }, [hscPhys, hscChem, hscMath, setValue]);

  // 4. Fixed Out-Of values for CET Percentile (NO calculation logic to overwrite fetched percentile)
  useEffect(() => {
    setValue("cetPhysicsOutOf", 100);
    setValue("cetChemistryOutOf", 100);
    setValue("cetMathsOutOf", 100);
    setValue("cetPcmTotalOutOf", 100);
  }, [setValue]);

  return (
    <div className="space-y-6">
      {/* ── Student Personal Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidate Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>
              Surname <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("fullNameSurname")} />
            </Label>
            <Input {...register("fullNameSurname")} placeholder="Surname (Block Letters)" />
          </div>

          <div className="space-y-2">
            <Label>
              First Name <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("fullNameFirst")} />
            </Label>
            <Input {...register("fullNameFirst")} placeholder="First Name" />
          </div>

          <div className="space-y-2">
            <Label>
              Father&apos;s Name (in name)
              <AutoFillBadge visible={autoFilledFields.has("fullNameFather")} />
            </Label>
            <Input {...register("fullNameFather")} placeholder="Father's Name" />
          </div>

          <div className="space-y-2">
            <Label>
              Father&apos;s Name <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("fatherName")} />
            </Label>
            <Input {...register("fatherName")} placeholder="Father's Full Name" />
          </div>

          <div className="space-y-2">
            <Label>
              Mother&apos;s Name <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("motherName")} />
            </Label>
            <Input {...register("motherName")} placeholder="Mother's Full Name" />
          </div>

          <div className="space-y-2">
            <Label>
              Date of Birth <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("dateOfBirth")} />
            </Label>
            <Input type="date" {...register("dateOfBirth")} />
          </div>

          {/* Blood Group Dropdown */}
          <div className="space-y-2">
            <Label>
              Blood Group
              <AutoFillBadge visible={autoFilledFields.has("bloodGroup")} />
            </Label>
            <Select
              value={bloodGroup ?? ""}
              onValueChange={(v: string) => setValue("bloodGroup", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Blood Group" />
              </SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Sex <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("gender")} />
            </Label>
            <Select value={gender ?? ""} onValueChange={(v: string) => setValue("gender", v as any)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Transgender">Transgender</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Religion &amp; Caste
              <AutoFillBadge visible={autoFilledFields.has("religionCaste")} />
            </Label>
            <Input {...register("religionCaste")} placeholder="Religion & Caste" />
          </div>

          {/* Contact Tel. No. (STD) - Optional */}
          <div className="space-y-2">
            <Label>
              Contact Tel. No. (STD) <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              <AutoFillBadge visible={autoFilledFields.has("contactTelNo")} />
            </Label>
            <Input
              {...register("contactTelNo")}
              placeholder="STD Code + Number"
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d-]/g, "");
                setValue("contactTelNo", val);
              }}
            />
          </div>

          {/* Mobile No - Numeric only, max 10 digits */}
          <div className="space-y-2">
            <Label>
              Mobile No. <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("mobileNo")} />
            </Label>
            <Input
              {...register("mobileNo")}
              placeholder="10-digit mobile number"
              maxLength={10}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setValue("mobileNo", val);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Email Address <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("email")} />
            </Label>
            <Input type="email" {...register("email")} placeholder="student@email.com" />
          </div>

          {/* Aadhar No - Numeric only, max 12 digits */}
          <div className="space-y-2">
            <Label>
              Aadhar No. <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("aadharNo")} />
            </Label>
            <Input
              {...register("aadharNo")}
              placeholder="12-digit Aadhar number"
              maxLength={12}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                setValue("aadharNo", val);
              }}
            />
          </div>

          {/* PAN No - Optional */}
          <div className="space-y-2">
            <Label>
              PAN No. <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              <AutoFillBadge visible={autoFilledFields.has("panNo")} />
            </Label>
            <Input
              {...register("panNo")}
              placeholder="10-character PAN number (Optional)"
              maxLength={10}
              className="uppercase"
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
                setValue("panNo", val);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Address Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>
              Correspondence Address <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("correspondenceAddress")} />
            </Label>
            <Input {...register("correspondenceAddress")} placeholder="Correspondence / Current Address" />
          </div>

          <div className="space-y-2">
            <Label>Pin Code (Correspondence) <span className="text-red-500 font-bold">*</span></Label>
            <Input
              {...register("correspondencePin")}
              placeholder="6-digit Pin Code"
              maxLength={6}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setValue("correspondencePin", val);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Tel. No. (STD – Correspondence) <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              {...register("correspondenceTelNo")}
              placeholder="STD Code + Number"
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d-]/g, "");
                setValue("correspondenceTelNo", val);
              }}
            />
          </div>

          {/* Checkbox: Permanent address same as correspondence address */}
          <div className="flex items-center gap-2.5 sm:col-span-2 py-1.5 px-3 rounded-lg border border-amber-200/80 bg-amber-50/50">
            <input
              type="checkbox"
              id="sameAsCorrespondence"
              className="h-4 w-4 rounded border-amber-300 text-primary focus:ring-primary cursor-pointer"
              onChange={(e) => {
                if (e.target.checked) {
                  const corrAddr = getValues("correspondenceAddress");
                  const corrPin = getValues("correspondencePin");
                  const corrTel = getValues("correspondenceTelNo");
                  if (corrAddr) setValue("permanentAddress", corrAddr);
                  if (corrPin) setValue("permanentPin", corrPin);
                  if (corrTel) setValue("permanentTelNo", corrTel);
                }
              }}
            />
            <Label htmlFor="sameAsCorrespondence" className="cursor-pointer text-xs font-semibold text-slate-800">
              Permanent address same as correspondence address
            </Label>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>
              Permanent Address <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("permanentAddress")} />
            </Label>
            <Input {...register("permanentAddress")} placeholder="Permanent Address" />
          </div>

          <div className="space-y-2">
            <Label>Pin Code (Permanent) <span className="text-red-500 font-bold">*</span></Label>
            <Input
              {...register("permanentPin")}
              placeholder="6-digit Pin Code"
              maxLength={6}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setValue("permanentPin", val);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Tel. No. (STD – Permanent) <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              {...register("permanentTelNo")}
              placeholder="STD Code + Number"
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d-]/g, "");
                setValue("permanentTelNo", val);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Admission Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admission Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>
              Branch / Course <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("branchCourse")} />
            </Label>
            <Input {...register("branchCourse")} placeholder="e.g. Computer Engineering" />
          </div>

          <div className="space-y-2">
            <Label>
              Admission Quota <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("admissionQuota")} />
            </Label>
            <Select
              value={admissionQuota ?? ""}
              onValueChange={(v: string) => setValue("admissionQuota", v as any)}
            >
              <SelectTrigger><SelectValue placeholder="Select quota" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CAP_CET_AIEEE">CAP (CET/AIEEE)</SelectItem>
                <SelectItem value="JK">J&K</SelectItem>
                <SelectItem value="MGMT">MGMT</SelectItem>
                <SelectItem value="AGAINST_CAP">AGAINST CAP</SelectItem>
                <SelectItem value="TFWS">TFWS</SelectItem>
                <SelectItem value="EWS">EWS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Admission Category <span className="text-red-500 font-bold">*</span>
              <AutoFillBadge visible={autoFilledFields.has("admissionCategory")} />
            </Label>
            <select
              {...register("admissionCategory")}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Select...</option>
              {["Open","OBC","SBC","SEBC","EWS","VJ","NT1","NT2","NT3","SC","ST","DEF","PH"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Academic Year - Fully Editable */}
          <div className="space-y-2">
            <Label>Academic Year (Start)</Label>
            <Input type="number" {...register("admissionYearStart", { valueAsNumber: true })} className="font-mono font-semibold" />
          </div>

          <div className="space-y-2">
            <Label>Academic Year (End)</Label>
            <Input type="number" {...register("admissionYearEnd", { valueAsNumber: true })} className="font-mono font-semibold" />
          </div>

          <div className="space-y-2">
            <Label>Home University</Label>
            <Input {...register("homeUniversity")} />
          </div>

          <div className="space-y-2">
            <Label>Mother Tongue</Label>
            <Input {...register("motherTongue")} />
          </div>
        </CardContent>
      </Card>

      {/* ── S.S.C. Marks ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">S.S.C. Marks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>English Obtained</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              max={100}
              {...register("sscMarksEnglishObtained")}
              placeholder="Obtained"
            />
          </div>
          <div className="space-y-2">
            <Label>English Out Of</Label>
            <Input type="number" step="0.01" {...register("sscMarksEnglishOutOf")} className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label>Maths Obtained</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              max={100}
              {...register("sscMarksMathsObtained")}
              placeholder="Obtained"
            />
          </div>
          <div className="space-y-2">
            <Label>Maths Out Of</Label>
            <Input type="number" step="0.01" {...register("sscMarksMathsOutOf")} className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label>Grand Total Obtained</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              max={500}
              {...register("sscGrandTotalObtained")}
              placeholder="Obtained"
            />
          </div>
          <div className="space-y-2">
            <Label>Grand Total Out Of</Label>
            <Input type="number" step="0.01" {...register("sscGrandTotalOutOf")} className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              Percentage (%)
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                <Calculator className="w-3 h-3" /> Auto
              </span>
            </Label>
            <Input type="number" step="0.01" min={0} max={100} {...register("sscPercentage")} placeholder="Auto %" />
          </div>

          <div className="space-y-2">
            <Label>Year of Passing</Label>
            <Input
              type="number"
              {...register("sscYearOfPassing")}
              placeholder="e.g. 2023"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setValue("sscYearOfPassing", val ? Number(val) : null);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── H.S.C. Marks ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">H.S.C. Marks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2"><Label>Physics Obtained</Label><Input type="number" step="0.01" min={0} max={100} {...register("hscPhysicsObtained")} placeholder="Obtained" /></div>
          <div className="space-y-2"><Label>Physics Out Of</Label><Input type="number" step="0.01" {...register("hscPhysicsOutOf")} className="font-mono" /></div>

          <div className="space-y-2"><Label>Chemistry Obtained</Label><Input type="number" step="0.01" min={0} max={100} {...register("hscChemistryObtained")} placeholder="Obtained" /></div>
          <div className="space-y-2"><Label>Chemistry Out Of</Label><Input type="number" step="0.01" {...register("hscChemistryOutOf")} className="font-mono" /></div>

          <div className="space-y-2"><Label>Maths Obtained</Label><Input type="number" step="0.01" min={0} max={100} {...register("hscMathsObtained")} placeholder="Obtained" /></div>
          <div className="space-y-2"><Label>Maths Out Of</Label><Input type="number" step="0.01" {...register("hscMathsOutOf")} className="font-mono" /></div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              PCM Total Obtained
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                <Calculator className="w-3 h-3" /> Auto
              </span>
            </Label>
            <Input type="number" step="0.01" min={0} max={300} {...register("hscPcmTotalObtained")} placeholder="Auto P+C+M" />
          </div>

          <div className="space-y-2">
            <Label>PCM Total Out Of</Label>
            <Input type="number" step="0.01" {...register("hscPcmTotalOutOf")} className="font-mono" />
          </div>

          <div className="space-y-2"><Label>Grand Total Obtained</Label><Input type="number" step="0.01" min={0} max={600} {...register("hscGrandTotalObtained")} placeholder="Obtained" /></div>
          <div className="space-y-2"><Label>Grand Total Out Of</Label><Input type="number" step="0.01" {...register("hscGrandTotalOutOf")} className="font-mono" /></div>

          <div className="space-y-2">
            <Label>Year of Passing</Label>
            <Input
              type="number"
              {...register("hscYearOfPassing")}
              placeholder="e.g. 2025"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setValue("hscYearOfPassing", val ? Number(val) : null);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── CET PERCENTILE ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CET PERCENTILE</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2"><Label>Physics Obtained</Label><Input type="number" step="0.01" min={0} max={100} {...register("cetPhysicsObtained")} placeholder="Obtained" /></div>
          <div className="space-y-2"><Label>Physics Out Of</Label><Input type="number" step="0.01" {...register("cetPhysicsOutOf")} className="font-mono" /></div>

          <div className="space-y-2"><Label>Chemistry Obtained</Label><Input type="number" step="0.01" min={0} max={100} {...register("cetChemistryObtained")} placeholder="Obtained" /></div>
          <div className="space-y-2"><Label>Chemistry Out Of</Label><Input type="number" step="0.01" {...register("cetChemistryOutOf")} className="font-mono" /></div>

          <div className="space-y-2"><Label>Maths Obtained</Label><Input type="number" step="0.01" min={0} max={100} {...register("cetMathsObtained")} placeholder="Obtained" /></div>
          <div className="space-y-2"><Label>Maths Out Of</Label><Input type="number" step="0.01" {...register("cetMathsOutOf")} className="font-mono" /></div>

          {/* CET Percentile - Fully Editable */}
          <div className="space-y-2">
            <Label>PCM Total Percentile</Label>
            <Input type="number" step="0.0000001" min={0} max={100} {...register("cetPcmTotalObtained")} placeholder="Percentile" className="font-mono font-semibold text-primary" />
          </div>

          <div className="space-y-2">
            <Label>PCM Total Out Of</Label>
            <Input type="number" step="0.01" {...register("cetPcmTotalOutOf")} className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label>Exam Seat No.</Label>
            <Input
              {...register("cetExamSeatNo")}
              className="uppercase"
              onChange={(e) => setValue("cetExamSeatNo", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            />
          </div>

          <div className="space-y-2">
            <Label>Merit No.</Label>
            <Input
              {...register("cetMeritNo")}
              onChange={(e) => setValue("cetMeritNo", e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <div className="space-y-2">
            <Label>AIEEE Marks</Label>
            <Input
              {...register("aieeeMarks")}
              type="number"
              step="0.01"
              min={0}
              max={360}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Diploma (if applicable) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diploma (if applicable)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label>Obtained</Label><Input type="number" step="0.01" min={0} max={1000} {...register("diplomaMarksObtained")} /></div>
          <div className="space-y-2"><Label>Out Of</Label><Input type="number" step="0.01" min={0} max={1000} {...register("diplomaMarksOutOf")} /></div>
          <div className="space-y-2"><Label>Branch/Course</Label><Input {...register("diplomaBranchCourse")} /></div>
          <div className="space-y-2"><Label>B.T.E. Enrollment No.</Label><Input {...register("diplomaBteEnrollmentNo")} /></div>
          <div className="space-y-2"><Label>Year of Passing</Label><Input type="number" {...register("diplomaYearOfPassing")} /></div>
        </CardContent>
      </Card>

      {/* ── Additional Info ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Annual Income of Parent (Rs.)</Label><Input type="number" step="0.01" min={0} {...register("annualIncomeOfParent")} /></div>
          <div className="space-y-2"><Label>Date</Label><Input type="date" {...register("dateField")} /></div>
          <div className="space-y-2"><Label>Place</Label><Input {...register("placeField")} /></div>
        </CardContent>
      </Card>

      {/* ── For Office Use Only ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">For Office Use Only</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Dropdown menu for "Eligible for" */}
          <div className="space-y-2">
            <Label>Eligible For</Label>
            <select
              {...register("officeUseEligibleFor")}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm font-medium"
            >
              <option value="">Select Year...</option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Branch</Label>
            <select {...register("officeUseBranch")} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm font-medium">
              <option value="">Select Branch...</option>
              {["Civil","Comp","ETC","IT","Mech","Elect"].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
