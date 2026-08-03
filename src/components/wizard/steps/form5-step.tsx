"use client";

import { UseFormReturn } from "react-hook-form";
import { Form5Values } from "@/lib/forms/form5-library";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoFillBadge } from "@/components/wizard/auto-fill-badge";

interface Form5StepProps {
  form: UseFormReturn<Form5Values>;
  autoFilledFields: Set<string>;
}

import { useEffect } from "react";

export function Form5Step({ form, autoFilledFields }: Form5StepProps) {
  const { register, setValue, watch, getValues } = form;

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (!getValues("admissionDate")) setValue("admissionDate", todayStr);
    if (!getValues("dateField")) setValue("dateField", todayStr);
    if (!getValues("permanentCity")) setValue("permanentCity", "Pune");
    if (!getValues("localCity")) setValue("localCity", "Pune");
  }, [getValues, setValue]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Member Details (IN CAPITAL)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Surname <AutoFillBadge visible={autoFilledFields.has("surname")} /></Label>
            <Input {...register("surname")} placeholder="SURNAME" style={{ textTransform: "uppercase" }} />
          </div>
          <div className="space-y-2">
            <Label>First Name <AutoFillBadge visible={autoFilledFields.has("firstName")} /></Label>
            <Input {...register("firstName")} placeholder="FIRST NAME" style={{ textTransform: "uppercase" }} />
          </div>
          <div className="space-y-2">
            <Label>Father Name <AutoFillBadge visible={autoFilledFields.has("fatherName")} /></Label>
            <Input {...register("fatherName")} placeholder="FATHER NAME" style={{ textTransform: "uppercase" }} />
          </div>
          <div className="space-y-2">
            <Label>Branch/Department <AutoFillBadge visible={autoFilledFields.has("branchDept")} /></Label>
            <Input {...register("branchDept")} />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <select {...register("yearLevel")} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Select...</option>
              <option value="FE">F.E.</option>
              <option value="SE">S.E.</option>
              <option value="ME">M.E.</option>
              <option value="PhD">Ph.D.</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Diploma <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <select {...register("diplomaFyDsy")} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Select (Optional)...</option>
              <option value="FY">FY</option>
              <option value="DSY">DSY</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Addresses</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Permanent Address <AutoFillBadge visible={autoFilledFields.has("permanentAddress")} /></Label><Input {...register("permanentAddress")} /></div>
          <div className="space-y-2"><Label>Local Address <AutoFillBadge visible={autoFilledFields.has("localAddress")} /></Label><Input {...register("localAddress")} /></div>
          <div className="space-y-2"><Label>Permanent City <AutoFillBadge visible={autoFilledFields.has("permanentCity")} /></Label><Input {...register("permanentCity")} /></div>
          <div className="space-y-2"><Label>Local City</Label><Input {...register("localCity")} /></div>
          <div className="space-y-2"><Label>Permanent Pin <AutoFillBadge visible={autoFilledFields.has("permanentPin")} /></Label><Input {...register("permanentPin")} /></div>
          <div className="space-y-2"><Label>Local Pin <AutoFillBadge visible={autoFilledFields.has("localPin")} /></Label><Input {...register("localPin")} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Email <AutoFillBadge visible={autoFilledFields.has("email")} /></Label>
            <Input
              type="email"
              {...register("email")}
              className="lowercase"
              onChange={(e) => setValue("email", e.target.value.toLowerCase())}
            />
          </div>
          <div className="space-y-2"><Label>Date of Birth <AutoFillBadge visible={autoFilledFields.has("dateOfBirth")} /></Label><Input type="date" {...register("dateOfBirth")} /></div>
          <div className="space-y-2">
            <Label>Gender <AutoFillBadge visible={autoFilledFields.has("gender")} /></Label>
            <select {...register("gender")} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="space-y-2"><Label>Blood Group <AutoFillBadge visible={autoFilledFields.has("bloodGroup")} /></Label><Input {...register("bloodGroup")} /></div>
          <div className="space-y-2"><Label>Student Mobile No. <AutoFillBadge visible={autoFilledFields.has("studentMobileNo")} /></Label><Input {...register("studentMobileNo")} /></div>
          <div className="space-y-2"><Label>Parents Tel. No. <AutoFillBadge visible={autoFilledFields.has("parentsTelNo")} /></Label><Input {...register("parentsTelNo")} /></div>
          <div className="space-y-2">
            <Label>Cast Category <AutoFillBadge visible={autoFilledFields.has("castCategory")} /></Label>
            <select {...register("castCategory")} className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Select...</option>
              {["Open","SC","ST","VJ","NT1","NT2","NT3","OBC","SBC","SEBC","Other"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2"><Label>Admission Receipt No. <AutoFillBadge visible={autoFilledFields.has("admissionReceiptNo")} /></Label><Input {...register("admissionReceiptNo")} /></div>
          <div className="space-y-2"><Label>Admission Date <AutoFillBadge visible={autoFilledFields.has("admissionDate")} /></Label><Input type="date" {...register("admissionDate")} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Library Use Only</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Library Membership/I-Card No.</Label><Input {...register("libraryMembershipIdCardNo")} /></div>
          <div className="space-y-2"><Label>Remark</Label><Input {...register("remark")} /></div>
          <div className="space-y-2"><Label>Date</Label><Input type="date" {...register("dateField")} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rules & Regulations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-border bg-surface-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Library Rules & Regulations:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Students must keep the library books and other reading materials neat and clean.</li>
              <li>Books issued must be returned on or before the due date.</li>
              <li>If a book is lost, the student must replace it or pay the cost.</li>
              <li>Library silence must be maintained.</li>
              <li>No food or drink inside the library.</li>
              <li>Students must produce their library card for borrowing books.</li>
              <li>Reference books are not to be taken out of the library.</li>
              <li>Periodicals and newspapers are for reading within the library only.</li>
              <li>Marking, underlining, or damaging library material is strictly prohibited.</li>
              <li>Borrowed books are subject to recall at any time.</li>
              <li>Library cards are non-transferable.</li>
              <li>Students must check the notice board regularly.</li>
              <li>Any violation of rules may result in cancellation of library membership.</li>
            </ol>
            <p className="mt-2">I have read the rules and regulations and ready to follow the same. If any student lost the I-card then I-card will reissue with Rs. 200/- fine.</p>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={!!watch("rulesAgreedYn")}
              onCheckedChange={(c: any) => setValue("rulesAgreedYn", c === true)}
            />
            <Label className="text-sm">I have read and agree to the Library Rules & Regulations</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
