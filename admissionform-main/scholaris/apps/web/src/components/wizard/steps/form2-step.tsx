"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import { Form2Values, getForm2ChecklistForCategory } from "@/lib/forms/form2-checklist";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoFillBadge } from "@/components/wizard/auto-fill-badge";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface Form2StepProps {
  form: UseFormReturn<Form2Values>;
  autoFilledFields: Set<string>;
  candidateCategory?: string | null;
}

export function Form2Step({ form, autoFilledFields, candidateCategory = "Open" }: Form2StepProps) {
  const { register, control, setValue } = form;
  const items = useWatch({ control, name: "items" });
  const openSubCategory = useWatch({ control, name: "openSubCategory" }) || "Open";

  const isCategoryOpen = !candidateCategory || candidateCategory.toUpperCase() === "OPEN";

  const handleOpenSubCategoryChange = (val: "Open" | "Open (OMS)") => {
    setValue("openSubCategory", val);
    const isOpenOms = val === "Open (OMS)";
    const updatedItems = getForm2ChecklistForCategory(candidateCategory || "Open", isOpenOms);
    setValue("items", updatedItems);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Checklist Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Admission Type</Label>
            <select {...register("admissionType")} className="flex h-8.5 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="">Select...</option>
              <option value="FE">FE</option>
              <option value="DSE">DSE</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>
              Cap ID
              <AutoFillBadge visible={autoFilledFields.has("capId")} />
            </Label>
            <Input {...register("capId")} />
          </div>
        </CardContent>
      </Card>

      {/* Category & Open (OMS) Dropdown Block */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate Category:</span>
              <Badge variant="default" className="text-xs font-bold bg-primary text-primary-foreground">
                {candidateCategory || "Open"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Document checklist requirements are automatically configured according to the DTE EN6649 guidelines.
            </p>
          </div>

          {/* Specifically for Open category: Dropdown option */}
          {isCategoryOpen && (
            <div className="w-full sm:w-64 space-y-1.5 bg-background p-2.5 rounded-xl border border-border shadow-xs">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Open Category Variant</span>
                <span className="text-[10px] text-muted-foreground font-normal">(Select Type)</span>
              </Label>
              <select
                value={openSubCategory}
                onChange={(e) => handleOpenSubCategoryChange(e.target.value as "Open" | "Open (OMS)")}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="Open">Open (Maharashtra State - Default)</option>
                <option value="Open (OMS)">Open (OMS - Other Than Maharashtra)</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3.5 px-4 border-b">
          <CardTitle className="text-base font-semibold">Checklist (Tick documents received)</CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>Category: <strong>{isCategoryOpen ? openSubCategory : candidateCategory}</strong></span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-2 w-10">Sr.</th>
                <th className="text-left py-2 pr-2">Document Name</th>
                <th className="text-center py-2 w-24">Required</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item, i) => (
                <tr key={i} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${item.required ? "bg-amber-50/40" : ""}`}>
                  <td className="py-2.5 pr-2 font-mono text-xs text-muted-foreground">{item.srNo}</td>
                  <td className="py-2.5 pr-2">
                    <span className="font-medium text-foreground">{item.documentName}</span>
                    {item.required && (
                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                        Required
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    <Checkbox
                      checked={item.required}
                      onCheckedChange={(checked: any) =>
                        setValue(`items.${i}.required`, checked === true)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
