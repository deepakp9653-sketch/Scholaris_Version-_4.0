"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { ReviewModal } from "@/components/wizard/review-modal";
import { PasswordGateModal } from "@/components/wizard/password-gate-modal";
import { Form1Step } from "@/components/wizard/steps/form1-step";
import { Form2Step } from "@/components/wizard/steps/form2-step";
import { Form3Step } from "@/components/wizard/steps/form3-step";
import { Form4Step } from "@/components/wizard/steps/form4-step";
import { Form5Step } from "@/components/wizard/steps/form5-step";
import { form1Schema, Form1Values, FORM1_DEFAULT_VALUES } from "@/lib/forms/form1-application";
import { form2Schema, Form2Values, createForm2DefaultValues, getForm2ChecklistForCategory } from "@/lib/forms/form2-checklist";
import { form3Schema, Form3Values, FORM3_DEFAULT_VALUES } from "@/lib/forms/form3-eligibility";
import { form4Schema, Form4Values, FORM4_DEFAULT_VALUES } from "@/lib/forms/form4-affidavit";
import { form5Schema, Form5Values, FORM5_DEFAULT_VALUES } from "@/lib/forms/form5-library";
import { FORM_LABELS } from "@/lib/forms";
import { createAdmissionRecord, saveFormData, saveChecklistItems, verifyFormsPassword, updateStudentProfile } from "@/lib/actions/admission";
import { AutoFillBadge } from "@/components/wizard/auto-fill-badge";
import { getCapCandidateById, searchCapCandidates } from "@/lib/actions/cap";
import { parseCapCandidateNameSync, mapCapCategorySync } from "@/lib/cap-parser/capNameCategoryUtils";
import { Search, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FormData {
  form1: Form1Values;
  form2: Form2Values;
  form3: Form3Values;
  form4: Form4Values;
  form5: Form5Values;
}

interface WizardClientProps {
  capCandidateId?: string;
  capImportBanner?: {
    name: string;
    department: string;
    category: string | null;
  };
  initialRecord?: any;
}

export function WizardClient({ capCandidateId, capImportBanner, initialRecord }: WizardClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [recordId, setRecordId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [studentProfile, setStudentProfile] = useState<Record<string, unknown>>({});

  // CAP search state
  const [capQuery, setCapQuery] = useState("");
  const [capResults, setCapResults] = useState<any[]>([]);
  const [searchingCap, setSearchingCap] = useState(false);
  const [selectedCapId, setSelectedCapId] = useState<string | null>(null);

  const formDataRef = useRef<FormData>({
    form1: FORM1_DEFAULT_VALUES,
    form2: createForm2DefaultValues(),
    form3: FORM3_DEFAULT_VALUES,
    form4: FORM4_DEFAULT_VALUES,
    form5: FORM5_DEFAULT_VALUES,
  });

  const form1 = useForm<Form1Values>({
    resolver: zodResolver(form1Schema),
    defaultValues: FORM1_DEFAULT_VALUES,
  });

  const form2 = useForm<Form2Values>({
    resolver: zodResolver(form2Schema) as any,
    defaultValues: createForm2DefaultValues(),
  });

  const form3 = useForm<Form3Values>({
    resolver: zodResolver(form3Schema),
    defaultValues: FORM3_DEFAULT_VALUES,
  });

  const form4 = useForm<Form4Values>({
    resolver: zodResolver(form4Schema),
    defaultValues: FORM4_DEFAULT_VALUES,
  });

  const form5 = useForm<Form5Values>({
    resolver: zodResolver(form5Schema),
    defaultValues: FORM5_DEFAULT_VALUES,
  });

  const [nameOrderFormat, setNameOrderFormat] = useState<"SURNAME_FIRST" | "FIRST_NAME_FIRST">("SURNAME_FIRST");

  const autoFillFromCapCandidate = useCallback((candidate: any, overrideMode?: "SURNAME_FIRST" | "FIRST_NAME_FIRST") => {
    if (!candidate) return;

    const mode = overrideMode || nameOrderFormat;
    const { surname, firstName, fatherInName, fatherFullName } = parseCapCandidateNameSync(candidate.candidateName, mode);
    const mappedCategory = mapCapCategorySync(candidate.category) ?? "Open";

    const deptName = candidate.choiceCode?.department?.name
      || candidate.choiceCode?.courseName
      || candidate.department
      || candidate.branchCourse
      || "Computer Engineering";

    // Form 1
    const f1Values: any = {
      admissionQuota: "CAP_CET_AIEEE",
      admissionCategory: mappedCategory,
      branchCourse: deptName,
      fullNameSurname: surname,
      fullNameFirst: firstName,
      fullNameFather: fatherInName,
      fatherName: fatherFullName,
      gender: candidate.gender === "M" ? "Male" : candidate.gender === "F" ? "Female" : candidate.gender === "O" ? "Transgender" : null,
      cetMeritNo: candidate.meritNo ? String(candidate.meritNo) : null,
      officeUseBranch: deptName.includes("Civil") ? "Civil" : deptName.includes("Comp") ? "Comp" : deptName.includes("Electronics") || deptName.includes("ETC") ? "ETC" : deptName.includes("Information") || deptName.includes("IT") ? "IT" : deptName.includes("Mech") ? "Mech" : deptName.includes("Elect") ? "Elect" : "Comp",
    };

    const isJeeScore =
      candidate.scoreType === "JEE_MAIN" ||
      Boolean(candidate.seatTypeCode && (candidate.seatTypeCode.includes("AI") || candidate.seatTypeCode.toUpperCase().includes("JEE")));

    if (isJeeScore) {
      f1Values.aieeeMarks = candidate.score ? String(candidate.score) : null;
      f1Values.cetPcmTotalObtained = null;
    } else {
      f1Values.cetPcmTotalObtained = candidate.score ? Number(candidate.score) : null;
    }

    form1.reset({ ...FORM1_DEFAULT_VALUES, ...f1Values });

    // Form 2
    const defaultF2 = createForm2DefaultValues();
    const f2Values: any = {
      admissionType: "FE",
      capId: candidate.applicationId ?? null,
      branch: candidate.choiceCode.department.name,
      admissionCategory: mappedCategory,
      openSubCategory: "Open",
      items: getForm2ChecklistForCategory(mappedCategory, false),
    };
    form2.reset({ ...defaultF2, ...f2Values });

    // Form 3
    const f3Values: any = {
      courseName: candidate.choiceCode.department.name,
      courseYear: "st",
      applicantType: "Maharashtrian",
      nationality: "Indian",
      gender: candidate.gender === "M" ? "Male" : candidate.gender === "F" ? "Female" : candidate.gender === "O" ? "Transgender" : null,
      categoryTick: ["Open", "SC", "ST", "DT_A_", "NT_B_", "NT_C_", "NT_D_", "OBC", "SBC", "SEBC", "EWS"].includes(mappedCategory)
        ? mappedCategory as any
        : mappedCategory === "NT1" ? "NT_B_" : mappedCategory === "NT2" ? "NT_C_" : mappedCategory === "NT3" ? "NT_D_" : mappedCategory === "VJ" ? "DT_A_" : "Open",
      belongsToReservedYn: mappedCategory !== "Open",
    };
    form3.reset({ ...FORM3_DEFAULT_VALUES, ...f3Values });

    // Form 4
    const cleanCapName = [firstName, fatherInName || (fatherFullName ? fatherFullName.split(" ")[0] : ""), surname].filter(Boolean).join(" ");
    const f4Values: any = {
      fullNameWithEnrollmentNo: cleanCapName || candidate.candidateName,
      sonDaughterOf: fatherFullName || fatherInName || null,
      admittedToInstitution: "TSSM's Bhivarabai Sawant College of Engineering & Research, Narhe, Pune",
    };
    form4.reset({ ...FORM4_DEFAULT_VALUES, ...f4Values });

    // Form 5
    const f5Values: any = {
      surname: surname,
      firstName: firstName,
      fatherName: fatherFullName || fatherInName || null,
      gender: candidate.gender === "M" ? "Male" : candidate.gender === "F" ? "Female" : null,
      castCategory: ["Open", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "SBC", "Other"].includes(mappedCategory)
        ? mappedCategory as any
        : "Other",
      branchDept: candidate.choiceCode.department.name,
      yearLevel: "FE",
      permanentAddress: f1Values.permanentAddress || null,
      permanentPin: f1Values.permanentPin || null,
      permanentCity: "Pune",
      localAddress: f1Values.correspondenceAddress || null,
      localPin: f1Values.correspondencePin || null,
      localCity: "Pune",
      email: f1Values.email || null,
      dateOfBirth: f1Values.dateOfBirth || null,
      bloodGroup: f1Values.bloodGroup || null,
      studentMobileNo: f1Values.mobileNo || null,
      parentsTelNo: f1Values.contactTelNo || f1Values.permanentTelNo || null,
    };
    form5.reset({ ...FORM5_DEFAULT_VALUES, ...f5Values });

    const fieldsToMark = [
      "fullNameSurname", "fullNameFirst", "fullNameFather", "fatherName", "motherName",
      "branchCourse", "admissionCategory", "admissionQuota", "gender", "cetMeritNo",
      "cetPcmTotalObtained", "aieeeMarks", "capId", "branch", "admissionType",
      "courseName", "courseYear", "applicantType", "nationality", "categoryTick",
      "belongsToReservedYn", "fullNameWithEnrollmentNo", "sonDaughterOf",
      "admittedToInstitution", "surname", "firstName", "castCategory", "branchDept", "yearLevel",
      "permanentAddress", "localAddress", "permanentPin", "localPin", "permanentCity", "localCity",
      "email", "dateOfBirth", "studentMobileNo", "parentsTelNo", "bloodGroup", "religionCaste",
      "contactTelNo", "mobileNo", "aadharNo", "panNo"
    ];
    setAutoFilledFields(new Set(fieldsToMark));
  }, [form1, form2, form3, form4, form5]);

  const handleNameFormatToggle = (newMode: "SURNAME_FIRST" | "FIRST_NAME_FIRST") => {
    setNameOrderFormat(newMode);

    if (selectedCapId && capResults.length > 0) {
      const candidate = capResults.find((c) => c.id === selectedCapId);
      if (candidate) {
        autoFillFromCapCandidate(candidate, newMode);
        return;
      }
    }

    const currentSurname = form1.getValues("fullNameSurname") || "";
    const currentFirst = form1.getValues("fullNameFirst") || "";
    const currentFather = form1.getValues("fullNameFather") || form1.getValues("fatherName") || "";
    const fullText = [currentSurname, currentFirst, currentFather].filter(Boolean).join(" ");

    if (fullText) {
      const { surname, firstName, fatherInName, fatherFullName } = parseCapCandidateNameSync(fullText, newMode);
      if (surname) form1.setValue("fullNameSurname", surname);
      if (firstName) form1.setValue("fullNameFirst", firstName);
      if (fatherInName) form1.setValue("fullNameFather", fatherInName);
      if (fatherFullName) form1.setValue("fatherName", fatherFullName);
    }
  };

  const syncForm1ToAllForms = useCallback(() => {
    const f1 = form1.getValues();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const surname = (f1.fullNameSurname || "").trim();
    const firstName = (f1.fullNameFirst || "").trim();
    let fatherName = (f1.fatherName || f1.fullNameFather || "").trim();
    if (surname && fatherName.toUpperCase().endsWith(surname.toUpperCase())) {
      fatherName = fatherName.substring(0, fatherName.length - surname.length).trim();
    }
    const candidateParts = [firstName, fatherName, surname].filter(Boolean);
    const candidateWords: string[] = [];
    candidateParts.join(" ").split(/\s+/).forEach((w) => {
      if (candidateWords.length === 0 || candidateWords[candidateWords.length - 1].toUpperCase() !== w.toUpperCase()) {
        candidateWords.push(w);
      }
    });
    const candidateFullName = candidateWords.join(" ");
    const mappedCategory = f1.admissionCategory || "Open";
    const branchCourse = f1.branchCourse || "";

    // Sync to Form 2 (Checklist)
    if (f1.cetExamSeatNo && !form2.getValues("capId")) {
      form2.setValue("capId", f1.cetExamSeatNo);
    }
    form2.setValue("admissionType", f1.officeUseEligibleFor === "Second Year" ? "DSE" : "FE");

    // Sync to Form 3 (Eligibility)
    if (branchCourse) form3.setValue("courseName", branchCourse);
    form3.setValue("courseYear", f1.officeUseEligibleFor === "Second Year" ? "nd" : "st");
    if (f1.religionCaste) form3.setValue("religion", f1.religionCaste);
    if (mappedCategory) {
      const catTick = ["Open", "SC", "ST", "DT_A_", "NT_B_", "NT_C_", "NT_D_", "OBC", "SBC", "SEBC", "EWS"].includes(mappedCategory)
        ? mappedCategory as any
        : mappedCategory === "NT1" ? "NT_B_" : mappedCategory === "NT2" ? "NT_C_" : mappedCategory === "NT3" ? "NT_D_" : mappedCategory === "VJ" ? "DT_A_" : "Open";
      form3.setValue("categoryTick", catTick);
      form3.setValue("belongsToReservedYn", mappedCategory !== "Open");
    }

    // Sync to Form 4 (Anti-Ragging Affidavit)
    if (candidateFullName) form4.setValue("fullNameWithEnrollmentNo", candidateFullName);
    if (fatherName) form4.setValue("sonDaughterOf", fatherName);
    form4.setValue("admittedToInstitution", "TSSM's Bhivarabai Sawant College of Engineering & Research, Narhe, Pune");
    form4.setValue("declaredDay", dd);
    form4.setValue("declaredMonth", mm);
    form4.setValue("declaredYear", String(yyyy));
    form4.setValue("verifiedDay", dd);
    form4.setValue("verifiedMonth", mm);
    form4.setValue("verifiedYear", String(yyyy));
    if (!form4.getValues("verifiedAtPlace")) {
      form4.setValue("verifiedAtPlace", "Pune");
    }

    // Sync to Form 5 (Library Membership Form)
    if (surname) form5.setValue("surname", surname);
    if (firstName) form5.setValue("firstName", firstName);
    if (fatherName) form5.setValue("fatherName", fatherName);
    if (branchCourse) form5.setValue("branchDept", branchCourse);
    form5.setValue("yearLevel", f1.officeUseEligibleFor === "Second Year" ? "SE" : "FE");

    if (f1.permanentAddress) form5.setValue("permanentAddress", f1.permanentAddress);
    if (f1.permanentPin) form5.setValue("permanentPin", f1.permanentPin);
    if (!form5.getValues("permanentCity")) form5.setValue("permanentCity", "Pune");

    if (f1.correspondenceAddress) form5.setValue("localAddress", f1.correspondenceAddress);
    if (f1.correspondencePin) form5.setValue("localPin", f1.correspondencePin);
    if (!form5.getValues("localCity")) form5.setValue("localCity", "Pune");

    if (f1.email) form5.setValue("email", f1.email);
    if (f1.dateOfBirth) form5.setValue("dateOfBirth", f1.dateOfBirth);
    if (f1.gender) form5.setValue("gender", f1.gender as any);
    if (f1.bloodGroup) form5.setValue("bloodGroup", f1.bloodGroup);
    if (f1.mobileNo) form5.setValue("studentMobileNo", f1.mobileNo);
    if (f1.contactTelNo || f1.permanentTelNo) {
      form5.setValue("parentsTelNo", f1.contactTelNo || f1.permanentTelNo || "");
    }

    if (mappedCategory) {
      const castCat = ["Open", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "SBC", "Other"].includes(mappedCategory)
        ? mappedCategory as any
        : "Other";
      form5.setValue("castCategory", castCat);
    }

    if (!form5.getValues("admissionDate")) {
      form5.setValue("admissionDate", todayStr);
    }

    const fieldsToMark = [
      "surname", "firstName", "fatherName", "branchDept", "yearLevel",
      "permanentAddress", "permanentPin", "permanentCity", "localAddress", "localPin", "localCity",
      "email", "dateOfBirth", "gender", "bloodGroup", "studentMobileNo", "parentsTelNo", "castCategory",
      "fullNameWithEnrollmentNo", "sonDaughterOf", "declaredDay", "declaredMonth", "declaredYear"
    ];
    setAutoFilledFields((prev) => {
      const next = new Set(prev);
      fieldsToMark.forEach((f) => next.add(f));
      return next;
    });
  }, [form1, form2, form3, form4, form5]);

  // Sync Form 1 changes to subsequent forms whenever step or form values change
  useEffect(() => {
    syncForm1ToAllForms();
  }, [currentStep, syncForm1ToAllForms]);

  // Load candidate from capCandidateId if provided on mount
  useEffect(() => {
    if (!capCandidateId || initialRecord) return;
    
    setPending(true);
    getCapCandidateById(capCandidateId).then((candidate) => {
      if (candidate) {
        autoFillFromCapCandidate(candidate);
      }
      setPending(false);
    });
  }, [capCandidateId, initialRecord, autoFillFromCapCandidate]);

  // Load existing record values if provided
  useEffect(() => {
    if (!initialRecord) return;

    setRecordId(initialRecord.id);

    if (initialRecord.studentProfile) {
      const sp = initialRecord.studentProfile;
      form1.setValue("fullNameSurname", sp.fullNameSurname ?? "");
      form1.setValue("fullNameFirst", sp.fullNameFirst ?? "");
      form1.setValue("fullNameFather", sp.fullNameFather ?? "");
      form1.setValue("fatherName", sp.fatherName ?? "");
      form1.setValue("motherName", sp.motherName ?? "");
      form1.setValue("dateOfBirth", sp.dateOfBirth ? new Date(sp.dateOfBirth).toISOString().split('T')[0] : "");
      form1.setValue("gender", sp.gender as any);
      form1.setValue("bloodGroup", sp.bloodGroup ?? "");
      form1.setValue("religionCaste", sp.religionCaste ?? "");
      form1.setValue("contactTelNo", sp.contactTelNo ?? "");
      form1.setValue("mobileNo", sp.mobileNo ?? "");
      form1.setValue("email", sp.email ?? "");
      form1.setValue("aadharNo", sp.aadharNo ?? "");
      form1.setValue("panNo", sp.panNo ?? "");
      form1.setValue("permanentAddress", sp.permanentAddress ?? "");
      form1.setValue("permanentPin", sp.permanentPin ?? "");
      form1.setValue("correspondenceAddress", sp.correspondenceAddress ?? "");
      form1.setValue("correspondencePin", sp.correspondencePin ?? "");

      const filledFields = [
        "fullNameSurname", "fullNameFirst", "fullNameFather", "fatherName", "motherName",
        "dateOfBirth", "gender", "bloodGroup", "religionCaste", "contactTelNo", "mobileNo",
        "email", "aadharNo", "panNo", "permanentAddress", "correspondenceAddress"
      ];
      setAutoFilledFields((prev) => {
        const next = new Set(prev);
        filledFields.forEach((f) => {
          if ((sp as any)[f]) next.add(f);
        });
        return next;
      });
    }

    if (initialRecord.form1Application || initialRecord.studentProfile) {
      const f1 = initialRecord.form1Application || {};
      const sp = initialRecord.studentProfile || {};
      const currentValues = form1.getValues();
      form1.reset({
        ...currentValues,
        fullNameSurname: sp.fullNameSurname ?? currentValues.fullNameSurname ?? null,
        fullNameFirst: sp.fullNameFirst ?? currentValues.fullNameFirst ?? null,
        fullNameFather: sp.fullNameFather ?? currentValues.fullNameFather ?? null,
        fatherName: sp.fatherName ?? currentValues.fatherName ?? null,
        motherName: sp.motherName ?? currentValues.motherName ?? null,
        dateOfBirth: sp.dateOfBirth ? new Date(sp.dateOfBirth).toISOString().split('T')[0] : (currentValues.dateOfBirth ?? null),
        gender: (sp.gender as any) ?? currentValues.gender ?? null,
        bloodGroup: sp.bloodGroup ?? currentValues.bloodGroup ?? null,
        religionCaste: sp.religionCaste ?? currentValues.religionCaste ?? null,
        contactTelNo: sp.contactTelNo ?? currentValues.contactTelNo ?? null,
        mobileNo: sp.mobileNo ?? currentValues.mobileNo ?? null,
        email: sp.email ?? currentValues.email ?? null,
        aadharNo: sp.aadharNo ?? currentValues.aadharNo ?? null,
        panNo: sp.panNo ?? currentValues.panNo ?? null,
        permanentAddress: sp.permanentAddress ?? currentValues.permanentAddress ?? null,
        permanentPin: sp.permanentPin ?? currentValues.permanentPin ?? null,
        correspondenceAddress: sp.correspondenceAddress ?? currentValues.correspondenceAddress ?? null,
        correspondencePin: sp.correspondencePin ?? currentValues.correspondencePin ?? null,
        branchCourse: sp.branchCourse ?? currentValues.branchCourse ?? f1.officeUseBranch ?? "Computer Engineering",
        admissionQuota: f1.admissionQuota ?? currentValues.admissionQuota ?? null,
        admissionCategory: f1.admissionCategory ?? sp.category ?? currentValues.admissionCategory ?? null,
        homeUniversity: f1.homeUniversity ?? currentValues.homeUniversity ?? null,
        motherTongue: f1.motherTongue ?? currentValues.motherTongue ?? null,
        sscMarksEnglishObtained: f1.sscMarksEnglishObtained ? Number(f1.sscMarksEnglishObtained) : null,
        sscMarksEnglishOutOf: f1.sscMarksEnglishOutOf ? Number(f1.sscMarksEnglishOutOf) : null,
        sscMarksMathsObtained: f1.sscMarksMathsObtained ? Number(f1.sscMarksMathsObtained) : null,
        sscMarksMathsOutOf: f1.sscMarksMathsOutOf ? Number(f1.sscMarksMathsOutOf) : null,
        sscGrandTotalObtained: f1.sscGrandTotalObtained ? Number(f1.sscGrandTotalObtained) : null,
        sscGrandTotalOutOf: f1.sscGrandTotalOutOf ? Number(f1.sscGrandTotalOutOf) : null,
        sscPercentage: f1.sscPercentage ? Number(f1.sscPercentage) : null,
        sscYearOfPassing: f1.sscYearOfPassing ?? null,
        hscPhysicsObtained: f1.hscPhysicsObtained ? Number(f1.hscPhysicsObtained) : null,
        hscPhysicsOutOf: f1.hscPhysicsOutOf ? Number(f1.hscPhysicsOutOf) : null,
        hscChemistrySubjectName: f1.hscChemistrySubjectName || "Chemistry",
        hscChemistryObtained: f1.hscChemistryObtained ? Number(f1.hscChemistryObtained) : null,
        hscChemistryOutOf: f1.hscChemistryOutOf ? Number(f1.hscChemistryOutOf) : null,
        hscMathsObtained: f1.hscMathsObtained ? Number(f1.hscMathsObtained) : null,
        hscMathsOutOf: f1.hscMathsOutOf ? Number(f1.hscMathsOutOf) : null,
        hscPcmTotalObtained: f1.hscPcmTotalObtained ? Number(f1.hscPcmTotalObtained) : null,
        hscPcmTotalOutOf: f1.hscPcmTotalOutOf ? Number(f1.hscPcmTotalOutOf) : null,
        hscGrandTotalObtained: f1.hscGrandTotalObtained ? Number(f1.hscGrandTotalObtained) : null,
        hscGrandTotalOutOf: f1.hscGrandTotalOutOf ? Number(f1.hscGrandTotalOutOf) : null,
        hscYearOfPassing: f1.hscYearOfPassing ?? null,
        cetPhysicsObtained: f1.cetPhysicsObtained ? Number(f1.cetPhysicsObtained) : null,
        cetPhysicsOutOf: f1.cetPhysicsOutOf ? Number(f1.cetPhysicsOutOf) : null,
        cetChemistryObtained: f1.cetChemistryObtained ? Number(f1.cetChemistryObtained) : null,
        cetChemistryOutOf: f1.cetChemistryOutOf ? Number(f1.cetChemistryOutOf) : null,
        cetMathsObtained: f1.cetMathsObtained ? Number(f1.cetMathsObtained) : null,
        cetMathsOutOf: f1.cetMathsOutOf ? Number(f1.cetMathsOutOf) : null,
        cetPcmTotalObtained: f1.cetPcmTotalObtained ? Number(f1.cetPcmTotalObtained) : null,
        cetPcmTotalOutOf: f1.cetPcmTotalOutOf ? Number(f1.cetPcmTotalOutOf) : null,
        cetExamSeatNo: f1.cetExamSeatNo ?? null,
        cetMeritNo: f1.cetMeritNo ?? null,
        aieeeMarks: f1.aieeeMarks ?? null,
        diplomaMarksObtained: f1.diplomaMarksObtained ? Number(f1.diplomaMarksObtained) : null,
        diplomaMarksOutOf: f1.diplomaMarksOutOf ? Number(f1.diplomaMarksOutOf) : null,
        diplomaBranchCourse: f1.diplomaBranchCourse ?? null,
        diplomaBteEnrollmentNo: f1.diplomaBteEnrollmentNo ?? null,
        diplomaYearOfPassing: f1.diplomaYearOfPassing ?? null,
        annualIncomeOfParent: f1.annualIncomeOfParent ? Number(f1.annualIncomeOfParent) : null,
        dateField: f1.dateField ? new Date(f1.dateField).toISOString().split('T')[0] : null,
        placeField: f1.placeField ?? null,
        signatureStudentRef: f1.signatureStudentRef ?? null,
        signatureParentRef: f1.signatureParentRef ?? null,
        officeUseEligibleFor: f1.officeUseEligibleFor ?? null,
        officeUseBranch: f1.officeUseBranch ?? null,
      });
    }

    if (initialRecord.form2Checklist) {
      const f2 = initialRecord.form2Checklist;
      form2.reset({
        admissionType: f2.admissionType ?? null,
        capId: f2.capId ?? null,
        staffSignRef: f2.staffSignRef ?? null,
        studentSignRef: f2.studentSignRef ?? null,
        checklistDate: f2.checklistDate ? new Date(f2.checklistDate).toISOString().split('T')[0] : null,
        items: f2.items.map((item: any) => ({
          srNo: item.srNo,
          documentName: item.documentName,
          required: item.required,
        })),
      });
    }

    if (initialRecord.form3Eligibility) {
      const f3 = initialRecord.form3Eligibility;
      const gap = f3.educationalGaps?.[0] || null;
      form3.reset({
        courseName: f3.courseName ?? null,
        courseYear: f3.courseYear ?? null,
        applicantType: f3.applicantType ?? null,
        nationality: f3.nationality ?? null,
        religion: f3.religion ?? null,
        categoryTick: f3.categoryTick ?? null,
        belongsToReservedYn: f3.belongsToReservedYn ?? null,
        physicallyDisabledYn: f3.physicallyDisabledYn ?? null,
        physicallyDisabledType: f3.physicallyDisabledType ?? null,
        qualCourseName: f3.qualCourseName ?? null,
        qualDuration: f3.qualDuration ?? null,
        qualUniversity: f3.qualUniversity ?? null,
        qualCollegeDept: f3.qualCollegeDept ?? null,
        qualSeatNo: f3.qualSeatNo ?? null,
        qualMonthYearPassing: f3.qualMonthYearPassing ?? null,
        qualPercentage: f3.qualPercentage ? Number(f3.qualPercentage) : null,
        qualClassGrade: f3.qualClassGrade ?? null,
        gapLastExamName: gap?.lastExamName ?? null,
        gapSeatNo: gap?.seatNo ?? null,
        gapMonthYearPassing: gap?.monthYearPassing ?? null,
        gapPercentage: gap?.percentage ? Number(gap?.percentage) : null,
        gapClassGrade: gap?.classGrade ?? null,
        minorityYn: f3.minorityYn ?? null,
        minorityLinguistic: f3.minorityLinguistic ?? null,
        minorityReligion: f3.minorityReligion ?? null,
        signatureCandidateRef: f3.signatureCandidateRef ?? null,
        officeReceiptNo: f3.officeReceiptNo ?? null,
        officeDate: f3.officeDate ? new Date(f3.officeDate).toISOString().split('T')[0] : null,
        officeEligibleStatus: f3.officeEligibleStatus ?? null,
        officeAsst: f3.officeAsst ?? null,
        officeSrAsst: f3.officeSrAsst ?? null,
        officeOsRegistrarHod: f3.officeOsRegistrarHod ?? null,
      });
    }

    if (initialRecord.form4Affidavit) {
      const f4 = initialRecord.form4Affidavit;
      form4.reset({
        fullNameWithEnrollmentNo: f4.fullNameWithEnrollmentNo ?? null,
        sonDaughterOf: f4.sonDaughterOf ?? null,
        admittedToInstitution: f4.admittedToInstitution ?? null,
        declaredDay: f4.declaredDay ?? null,
        declaredMonth: f4.declaredMonth ?? null,
        declaredYear: f4.declaredYear ?? null,
        signatureDeponentRef: f4.signatureDeponentRef ?? null,
        verifiedAtPlace: f4.verifiedAtPlace ?? null,
        verifiedDay: f4.verifiedDay ?? null,
        verifiedMonth: f4.verifiedMonth ?? null,
        verifiedYear: f4.verifiedYear ?? null,
        signatureDeponentVerificationRef: f4.signatureDeponentVerificationRef ?? null,
      });
    }

    if (initialRecord.form5Library) {
      const f5 = initialRecord.form5Library;
      form5.reset({
        surname: f5.surname ?? null,
        firstName: f5.firstName ?? null,
        fatherName: f5.fatherName ?? null,
        branchDept: f5.branchDept ?? null,
        yearLevel: f5.yearLevel ?? null,
        diplomaFyDsy: f5.diplomaFyDsy ?? null,
        permanentAddress: f5.permanentAddress ?? null,
        permanentCity: f5.permanentCity ?? null,
        permanentPin: f5.permanentPin ?? null,
        localAddress: f5.localAddress ?? null,
        localCity: f5.localCity ?? null,
        localPin: f5.localPin ?? null,
        email: f5.email ?? null,
        dateOfBirth: f5.dateOfBirth ? new Date(f5.dateOfBirth).toISOString().split('T')[0] : null,
        gender: f5.gender ?? null,
        bloodGroup: f5.bloodGroup ?? null,
        studentMobileNo: f5.studentMobileNo ?? null,
        parentsTelNo: f5.parentsTelNo ?? null,
        castCategory: f5.castCategory ?? null,
        admissionReceiptNo: f5.admissionReceiptNo ?? null,
        admissionDate: f5.admissionDate ? new Date(f5.admissionDate).toISOString().split('T')[0] : null,
        photoFileRef: f5.photoFileRef ?? null,
        signatureRef: f5.signatureRef ?? null,
        dateField: f5.dateField ? new Date(f5.dateField).toISOString().split('T')[0] : null,
        adminOfficerAccountantSignRef: f5.adminOfficerAccountantSignRef ?? null,
        libraryMembershipIdCardNo: f5.libraryMembershipIdCardNo ?? null,
        remark: f5.remark ?? null,
        librarianSignRef: f5.librarianSignRef ?? null,
        rulesAgreedYn: f5.rulesAgreedYn ?? null,
        rulesAgreedAt: f5.rulesAgreedAt ? new Date(f5.rulesAgreedAt).toISOString().split('T')[0] : null,
      });
    }
  }, [initialRecord]);

  // CAP search trigger effect
  useEffect(() => {
    if (!capQuery) {
      setCapResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearchingCap(true);
      searchCapCandidates(capQuery).then((results) => {
        setCapResults(results);
        setSearchingCap(false);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [capQuery]);
  const forms = [form1, form2 as any, form3, form4, form5];

  const updateAutoFill = useCallback((formKey: string, values: Record<string, unknown>) => {
    const newAutoFilled = new Set(autoFilledFields);
    for (const [field, value] of Object.entries(values)) {
      if (value !== null && value !== undefined && value !== "") {
        newAutoFilled.add(field);
      }
    }
    setAutoFilledFields(newAutoFilled);
  }, [autoFilledFields]);

  const handleFieldChange = useCallback(async (formKey: string, fieldName: string, value: unknown) => {
    if (!recordId) return;
    const profileFields: Record<string, string> = {
      fullNameSurname: "fullNameSurname",
      fullNameFirst: "fullNameFirst",
      fullNameFather: "fullNameFather",
      fatherName: "fatherName",
      motherName: "motherName",
      dateOfBirth: "dateOfBirth",
      gender: "gender",
      bloodGroup: "bloodGroup",
      mobileNo: "mobileNo",
      email: "email",
      religionCaste: "religionCaste",
      category: "category",
      branchCourse: "branchCourse",
      contactTelNo: "contactTelNo",
      correspondenceTelNo: "correspondenceTelNo",
      permanentTelNo: "permanentTelNo",
      correspondenceAddress: "correspondenceAddress",
      correspondencePin: "correspondencePin",
      permanentAddress: "permanentAddress",
      permanentPin: "permanentPin",
      permanentCity: "permanentCity",
      admissionReceiptNo: "admissionReceiptNo",
      admissionDate: "admissionDate",
    };

    const profileField = profileFields[fieldName];
    if (profileField && value !== null && value !== undefined && value !== "") {
      const newProfile = { ...studentProfile, [profileField]: value };
      setStudentProfile(newProfile);
      await updateStudentProfile(recordId, newProfile);
    }
  }, [recordId, studentProfile]);

  async function handleReviewConfirm() {
    setErrorMessage(null);
    setPending(true);

    try {
      const currentForm = forms[currentStep];
      const isValid = await currentForm.trigger();
      if (!isValid) {
        const errors = currentForm.formState.errors;
        const errorDetails = Object.entries(errors)
          .map(([field, err]) => `${field}: ${(err as any)?.message || "Required"}`)
          .join("; ");
        console.warn("Validation trigger failure details:", errors);
        setErrorMessage(errorDetails ? `Please fix: ${errorDetails}` : "Please complete all required fields on this form before proceeding.");
        setPending(false);
        return;
      }

      const values = currentForm.getValues();
      const formKey = `form${currentStep + 1}` as "form1" | "form2" | "form3" | "form4" | "form5";
      formDataRef.current[formKey] = values as any;

      let activeId = recordId;
      if (!activeId) {
        const result = await createAdmissionRecord();
        activeId = result.id;
        setRecordId(result.id);
      }

      let saveResult: { success: boolean; error?: string };

      if (formKey === "form2") {
        saveResult = await saveChecklistItems(activeId, (values as Form2Values).items.map((item, i) => ({
          srNo: i + 1,
          documentName: item.documentName,
          required: item.required,
        })));

        if (saveResult.success) {
          saveResult = await saveFormData(activeId, "form2", {
            admissionType: (values as Form2Values).admissionType,
            capId: (values as Form2Values).capId,
            staffSignRef: (values as Form2Values).staffSignRef,
            studentSignRef: (values as Form2Values).studentSignRef,
            checklistDate: (values as Form2Values).checklistDate,
          });
        }
      } else {
        saveResult = await saveFormData(activeId, formKey, values as Record<string, unknown>);
      }

      if (!saveResult.success) {
        setErrorMessage(saveResult.error || "Failed to save form data");
        setPending(false);
        return;
      }

      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep);
      setCompletedSteps(newCompleted);

      setShowReview(false);

      if (currentStep === 4) {
        setShowPasswordGate(true);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (err: any) {
      console.error("Error in handleReviewConfirm:", err);
      setErrorMessage(err.message || "An error occurred while saving form data");
    } finally {
      setPending(false);
    }
  }

  async function handlePasswordVerify(password: string): Promise<boolean> {
    if (!recordId) return false;
    const form5Values = form5.getValues();
    await saveFormData(recordId, "form5", form5Values as Record<string, unknown>);
    const result = await verifyFormsPassword(recordId, password);
    return result.success;
  }

  function handlePasswordSuccess() {
    setShowPasswordGate(false);
    if (recordId) {
      router.push(`/admissions/${recordId}/preview`);
    } else {
      router.push("/admissions");
    }
    router.refresh();
  }

  function handleReviewForm() {
    setErrorMessage(null);
    forms[currentStep].trigger().then((isValid: boolean) => {
      if (isValid) setShowReview(true);
    });
  }

  const renderReviewContent = () => {
    const values = forms[currentStep].getValues();
    const label = FORM_LABELS[currentStep];

    return (
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground">{label}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(values as Record<string, unknown>).map(([key, val]) => {
            if (typeof val === "object") return null;
            if (val === null || val === undefined || val === "") return null;
            return (
              <div key={key} className="col-span-1">
                <span className="text-muted-foreground text-xs block">{key}</span>
                <span className="font-medium">{String(val)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          {initialRecord ? "Edit Admission Record" : "New Admission"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Form {currentStep + 1} of 5 — {FORM_LABELS[currentStep]}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* CAP Allotment Search-Select Auto-Fetch Block */}
      {!initialRecord && currentStep === 0 && (
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Auto-Fetch CAP Candidate Data
            </CardTitle>
            <p className="text-xs text-muted-foreground">Search and select a candidate from CAP allotment to auto-fill all forms with one click</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by candidate name or application ID…"
                className="pl-9 text-sm focus-visible:ring-primary"
                value={capQuery}
                onChange={(e) => setCapQuery(e.target.value)}
              />
              {searchingCap && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {capResults.length > 0 && (
              <div className="rounded-xl border border-border divide-y divide-border/60 max-h-40 overflow-y-auto bg-surface shadow-sm">
                {capResults.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className="w-full text-left p-2.5 hover:bg-accent/40 text-xs flex justify-between items-center transition-colors"
                    onClick={() => {
                      autoFillFromCapCandidate(candidate);
                      setSelectedCapId(candidate.id);
                      setCapQuery("");
                      setCapResults([]);
                    }}
                  >
                    <div>
                      <p className="font-semibold text-foreground">{candidate.candidateName}</p>
                      <p className="text-[10px] text-muted-foreground">{candidate.choiceCode.department.name} · {candidate.category}</p>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-muted-foreground">
                      {candidate.applicationId}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            {selectedCapId && (
              <div className="flex items-center justify-between text-xs bg-green-50 border border-green-200 text-green-800 p-2.5 rounded-xl">
                <span>Selected Candidate Auto-Filled: <strong>{(form1.getValues() as any).fullNameSurname}, {(form1.getValues() as any).fullNameFirst}</strong></span>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  className="h-6 text-[10px] px-2 text-green-700 hover:text-green-800 hover:bg-green-100"
                  onClick={() => {
                    setSelectedCapId(null);
                    form1.reset(FORM1_DEFAULT_VALUES);
                    form2.reset(createForm2DefaultValues());
                    form3.reset(FORM3_DEFAULT_VALUES);
                    form4.reset(FORM4_DEFAULT_VALUES);
                    form5.reset(FORM5_DEFAULT_VALUES);
                    setAutoFilledFields(new Set());
                  }}
                >
                  Clear Info
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CAP Import Banner */}
      {capImportBanner && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Auto-filled from CAP Allotment</p>
            <p className="text-xs text-muted-foreground">
              {capImportBanner.name} · {capImportBanner.department}
              {capImportBanner.category && ` · ${capImportBanner.category}`}
            </p>
          </div>
        </div>
      )}

      <WizardStepper currentStep={currentStep} completedSteps={completedSteps} />


      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{FORM_LABELS[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Candidate Name Ingestion Order Format
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Select how candidate names are parsed into Surname, First Name, and Father's Name across all forms.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant={nameOrderFormat === "SURNAME_FIRST" ? "default" : "outline"}
                    onClick={() => handleNameFormatToggle("SURNAME_FIRST")}
                    className="text-xs h-7 px-2.5 font-medium"
                  >
                    Option 1 (Default): [Surname] [First] [Father]
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={nameOrderFormat === "FIRST_NAME_FIRST" ? "default" : "outline"}
                    onClick={() => handleNameFormatToggle("FIRST_NAME_FIRST")}
                    className="text-xs h-7 px-2.5 font-medium"
                  >
                    Option 2: [First] [Father] [Surname]
                  </Button>
                </div>
              </div>
              <Form1Step form={form1} autoFilledFields={autoFilledFields} />
            </div>
          )}
          {currentStep === 1 && (
            <Form2Step
              form={form2}
              autoFilledFields={autoFilledFields}
              candidateCategory={(form1.getValues() as any).admissionCategory || "Open"}
            />
          )}
          {currentStep === 2 && <Form3Step form={form3} autoFilledFields={autoFilledFields} />}
          {currentStep === 3 && <Form4Step form={form4} autoFilledFields={autoFilledFields} />}
          {currentStep === 4 && <Form5Step form={form5} autoFilledFields={autoFilledFields} />}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => { setErrorMessage(null); setCurrentStep(Math.max(0, currentStep - 1)); }}
          disabled={currentStep === 0 || pending}
        >
          Previous
        </Button>
        <Button onClick={handleReviewForm} disabled={pending}>
          {currentStep === 4 ? "Review & Complete" : "Review this form"}
        </Button>
      </div>

      <ReviewModal
        open={showReview}
        onOpenChange={setShowReview}
        onConfirm={handleReviewConfirm}
        title={`Review: ${FORM_LABELS[currentStep]}`}
      >
        {renderReviewContent()}
      </ReviewModal>

      <PasswordGateModal
        open={showPasswordGate}
        onOpenChange={setShowPasswordGate}
        title="Complete Admission Record"
        description="Enter the Admin Password to save this Admission Record and advance to Document Upload."
        onVerify={handlePasswordVerify}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
}
