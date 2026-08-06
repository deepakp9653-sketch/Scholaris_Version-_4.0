import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { isDocumentRequiredForCategory } from "@/lib/forms/form2-checklist";

export async function GET(req: NextRequest) {
  await requireAuth();

  try {
    const { searchParams } = req.nextUrl;
    const selectedBranch = searchParams.get("branch") || "ALL";

    const rawRecords = await prisma.admissionRecord.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        studentProfile: true,
        form1Application: true,
        form3Eligibility: { include: { educationalGaps: true } },
        form5Library: true,
        capCandidate: true,
        feeRecord: true,
      },
    });

    // Filter branch-wise if specified
    const records = rawRecords.filter((r) => {
      if (selectedBranch === "ALL") return true;
      const b = (r.studentProfile?.branchCourse || "").toUpperCase();
      const target = selectedBranch.toUpperCase();

      if (target === "COMPUTER") {
        return b.includes("COMP") || b.includes("COMPUTER");
      }
      if (target === "ENTC" || target === "E&TC") {
        return b.includes("ELECTRONIC") || b.includes("ENTC") || b.includes("E&TC") || b.includes("ETC") || b.includes("TELECOM");
      }
      if (target === "ELECTRICAL") {
        return b.includes("ELECTRICAL") || b.includes("ELECT") || b.includes("ELECTRIC");
      }
      if (target === "MECHANICAL") {
        return b.includes("MECHANIC") || b.includes("MECH");
      }
      if (target === "CIVIL") {
        return b.includes("CIVIL");
      }
      return b.includes(target);
    });

    const workbook = new ExcelJS.Workbook();
    const sheetName = selectedBranch !== "ALL" ? `${selectedBranch} Admitted` : "Admitted Students";
    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: "frozen", ySplit: 10 }],
    });

    // Helper for dash fallback
    const fmt = (val: any): string => {
      if (val === null || val === undefined) return "-";
      const str = String(val).trim();
      return str === "" || str === "null" || str === "undefined" ? "-" : str;
    };

    // Calculate Summary Counts
    let maleCount = 0;
    let femaleCount = 0;
    let transCount = 0;
    let mhCount = 0;
    let nonMhCount = 0;

    records.forEach((r) => {
      const g = (r.studentProfile?.gender || r.capCandidate?.gender || "").toLowerCase();
      if (g.startsWith("m") || g === "male") maleCount++;
      else if (g.startsWith("f") || g === "female") femaleCount++;
      else if (g.startsWith("t") || g === "transgender") transCount++;

      const homeUniv = (r.form1Application?.homeUniversity || "").toLowerCase();
      const appType = (r.form3Eligibility?.applicantType || "").toLowerCase();
      if (appType.includes("maharashtrian") && !appType.includes("non") || homeUniv.includes("pune") || homeUniv.includes("maharashtra") || homeUniv.includes("solapur") || homeUniv.includes("mumbai")) {
        mhCount++;
      } else {
        nonMhCount++;
      }
    });

    // ---------------------------------------------------------
    // TOP SECTION: SUMMARY & LEGEND BOXES (Rows 1-7)
    // ---------------------------------------------------------

    // Left Summary Box (Cols B-C, Rows 1-6)
    sheet.mergeCells("B1:C1");
    sheet.getCell("B1").value = "Male Entry";
    sheet.getCell("D1").value = maleCount;

    sheet.mergeCells("B2:C2");
    sheet.getCell("B2").value = "Female Entry";
    sheet.getCell("D2").value = femaleCount;

    sheet.mergeCells("B3:C3");
    sheet.getCell("B3").value = "Transgender Entry";
    sheet.getCell("D3").value = transCount;

    sheet.mergeCells("B4:C4");
    sheet.getCell("B4").value = "Maharashtrian";
    sheet.getCell("D4").value = mhCount;

    sheet.mergeCells("B5:C5");
    sheet.getCell("B5").value = "Non-Maharashtrian";
    sheet.getCell("D5").value = nonMhCount;

    sheet.mergeCells("B6:C6");
    sheet.getCell("B6").value = "Total Entry";
    sheet.getCell("D6").value = records.length;

    // Style Left Summary Box
    for (let r = 1; r <= 6; r++) {
      const labelCell = sheet.getCell(`B${r}`);
      const valCell = sheet.getCell(`D${r}`);

      labelCell.font = { name: "Arial", size: 9, bold: true };
      labelCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: r <= 3 ? "D9E1F2" : r <= 5 ? "FCE4D6" : "E2EFDA" },
      };
      labelCell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };

      valCell.font = { name: "Arial", size: 9, bold: true };
      valCell.alignment = { horizontal: "center" };
      valCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: r <= 3 ? "D9E1F2" : r <= 5 ? "FCE4D6" : "E2EFDA" },
      };
      valCell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }

    // Yellow Notice Banner (Cols E-H, Rows 1-6)
    sheet.mergeCells("E1:I6");
    const noticeCell = sheet.getCell("E1");
    noticeCell.value =
      `Admitted Student Eligibility Excel (${selectedBranch !== "ALL" ? selectedBranch : "All Branches"}).\nMake sure all candidate records are verified correctly.`;
    noticeCell.font = { name: "Arial", size: 9, bold: true, color: { argb: "9C0006" } };
    noticeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF00" } };
    noticeCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    noticeCell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };

    // Legend Box 1: PHYSICALLY HANDICAPPED (Cols K-O, Rows 1-6)
    sheet.mergeCells("K1:O1");
    const phTitle = sheet.getCell("K1");
    phTitle.value = "PHYSICALLY HANDICAPPED";
    phTitle.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFF" } };
    phTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "006600" } };
    phTitle.alignment = { horizontal: "center" };

    const phLegends = [
      ["No", "No"],
      ["P1", "Blind / Visually Impaired / Low Vision"],
      ["P2", "Deaf and Hard Hearing"],
      ["P3", "Orthopedically Impaired / Ataxia"],
      ["P4", "Mentally Retarded / Intellectual Disability"],
      ["P5", "Other Physical Impairment"],
    ];

    phLegends.forEach(([code, desc], idx) => {
      const rowNum = idx + 2;
      sheet.getCell(`K${rowNum}`).value = code;
      sheet.mergeCells(`L${rowNum}:O${rowNum}`);
      sheet.getCell(`L${rowNum}`).value = desc;

      sheet.getCell(`K${rowNum}`).font = { name: "Arial", size: 8, bold: true, color: { argb: "9C0006" } };
      sheet.getCell(`K${rowNum}`).alignment = { horizontal: "center" };
      sheet.getCell(`L${rowNum}`).font = { name: "Arial", size: 8 };
    });

    // Legend Box 2: MINORITY TYPES (Cols Q-U, Rows 1-3)
    sheet.mergeCells("Q1:U1");
    const minTitle = sheet.getCell("Q1");
    minTitle.value = "MINORITY TYPES";
    minTitle.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFF" } };
    minTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "006600" } };
    minTitle.alignment = { horizontal: "center" };

    sheet.getCell("Q2").value = "No";
    sheet.mergeCells("R2:U2");
    sheet.getCell("R2").value = "No";

    sheet.getCell("Q3").value = "Linguistic";
    sheet.mergeCells("R3:U3");
    sheet.getCell("R3").value = "Linguistic Minority";

    sheet.getCell("Q4").value = "Religious";
    sheet.mergeCells("R4:U4");
    sheet.getCell("R4").value = "Religious Minority";

    [2, 3, 4].forEach((r) => {
      sheet.getCell(`Q${r}`).font = { name: "Arial", size: 8, bold: true, color: { argb: "9C0006" } };
      sheet.getCell(`R${r}`).font = { name: "Arial", size: 8 };
    });


    // ---------------------------------------------------------
    // ROW 8: SECTION HEADER BANNERS
    // ---------------------------------------------------------

    sheet.mergeCells("A8:I8");
    const sec1 = sheet.getCell("A8");
    sec1.value = "NON-MAHARASHTRA / OTHER CANDIDATES SHOULD ENTER THE NAME IN USUAL FORMAT (e.g. as per SSC or Equivalent Exam record)";
    sec1.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFF" } };
    sec1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "006600" } };
    sec1.alignment = { vertical: "middle", horizontal: "center" };

    sheet.mergeCells("J8:P8");
    const sec2 = sheet.getCell("J8");
    sec2.value = "QUALIFYING EXAM DETAILS";
    sec2.font = { name: "Arial", size: 9, bold: true, color: { argb: "000000" } };
    sec2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF00" } };
    sec2.alignment = { vertical: "middle", horizontal: "center" };

    sheet.mergeCells("Q8:U8");
    const sec3 = sheet.getCell("Q8");
    sec3.value = "SPECIAL CATEGORIES & CONTACT";
    sec3.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFF" } };
    sec3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "006600" } };
    sec3.alignment = { vertical: "middle", horizontal: "center" };

    sheet.mergeCells("V8:AG8");
    const sec4 = sheet.getCell("V8");
    sec4.value = "Optional";
    sec4.font = { name: "Arial", size: 9, bold: true, color: { argb: "000000" } };
    sec4.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF00" } };
    sec4.alignment = { vertical: "middle", horizontal: "center" };

    sheet.getRow(8).height = 24;


    // ---------------------------------------------------------
    // ROW 9: MAIN COLUMN LABELS
    // ---------------------------------------------------------

    const colTitles = [
      "Sr.No.",
      "Last Name",
      "First Name",
      "Middle Name",
      "Mother Name",
      "Birth Date",
      "Sex",
      "Category",
      "Non-creamy layer certificate status?",
      "Qualifying exam's Board / University Name in Full",
      "Qualifying Exam Name",
      "Qualifying Exam Seat No.",
      "Qualifying Exam Percentage / Grade",
      "Passing Year",
      "Is Maharashtrian ?",
      "Address",
      "Is Physically Handicapped ?",
      "Is Minority ? If yes specify type, else run No",
      "ABC ID",
      "Mobile No.",
      "Email ID",
      "Minority Details",
      "PRN for General Register Number",
      "Gap Details (Only If Applicable)",
      "Last exam's Board / University Name in Full",
      "Last Exam Name",
      "Last Exam Percentage / Result",
      "Last Exam Passing Year",
      "Aadhar No.",
      "Religion",
      "Are you Registered your Name in voter list?",
      "Do you have EPIC Card?",
      "If yes, EPIC Number",
    ];

    sheet.getRow(9).height = 42;
    colTitles.forEach((title, idx) => {
      const colCode = idx < 26 ? String.fromCharCode(65 + idx) : `A${String.fromCharCode(65 + (idx - 26))}`;
      const cell = sheet.getCell(`${colCode}9`);
      cell.value = title;
      cell.font = { name: "Arial", size: 8.5, bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      sheet.getColumn(colCode).width = Math.max(title.length > 25 ? 16 : title.length + 3, 12);
    });

    sheet.getColumn("A").width = 8;
    sheet.getColumn("B").width = 14;
    sheet.getColumn("C").width = 14;
    sheet.getColumn("D").width = 14;
    sheet.getColumn("E").width = 14;
    sheet.getColumn("F").width = 13;
    sheet.getColumn("G").width = 8;
    sheet.getColumn("H").width = 11;
    sheet.getColumn("P").width = 24;


    // ---------------------------------------------------------
    // ROW 10: SOLID BLACK INDEX BAR
    // ---------------------------------------------------------

    sheet.getRow(10).height = 18;
    for (let idx = 0; idx < 33; idx++) {
      const colCode = idx < 26 ? String.fromCharCode(65 + idx) : `A${String.fromCharCode(65 + (idx - 26))}`;
      const cell = sheet.getCell(`${colCode}10`);
      cell.value = idx + 1;
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "000000" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }


    // ---------------------------------------------------------
    // ROWS 11+: STUDENT DATA INJECTION
    // ---------------------------------------------------------

    records.forEach((r, idx) => {
      const sp = r.studentProfile;
      const f1 = r.form1Application;
      const f3 = r.form3Eligibility;
      const f5 = r.form5Library;
      const cap = r.capCandidate;

      // Gender (M / F / T)
      const rawGender = (sp?.gender || cap?.gender || "").toLowerCase();
      const sex = rawGender.startsWith("m") ? "M" : rawGender.startsWith("f") ? "F" : rawGender.startsWith("t") ? "T" : null;

      // Date of Birth (DD/MM/YYYY)
      const dob = sp?.dateOfBirth
        ? new Date(sp.dateOfBirth).toLocaleDateString("en-GB")
        : f1?.dateField
        ? new Date(f1.dateField).toLocaleDateString("en-GB")
        : null;

      // Maharashtrian (MH / OMS)
      const appType = (f3?.applicantType || "").toLowerCase();
      const homeUniv = (f1?.homeUniversity || "").toLowerCase();
      const isMh = appType.includes("maharashtrian") && !appType.includes("non") || homeUniv.includes("pune") || homeUniv.includes("maharashtra") || homeUniv.includes("solapur") || homeUniv.includes("mumbai") ? "MH" : "OMS";

      // Qualifying HSC Marks
      const phys = f1?.hscPhysicsObtained;
      const math = f1?.hscMathsObtained;
      const chem = f1?.hscChemistryObtained;
      const pcmSum = (phys != null && math != null && chem != null) ? (Number(phys) + Number(math) + Number(chem)) : null;

      const hscObt = f1?.hscGrandTotalObtained ?? f1?.hscPcmTotalObtained ?? pcmSum;
      const hscOut = f1?.hscGrandTotalOutOf ?? f1?.hscPcmTotalOutOf ?? (pcmSum != null ? 300 : 600);
      const hscPct = hscObt != null && hscOut ? ((Number(hscObt) / Number(hscOut)) * 100).toFixed(2) : null;
      const hscYear = f1?.hscYearOfPassing ? `Jun-${f1.hscYearOfPassing}` : null;

      // HSC / Qualifying Seat Number
      const hscSeatNo = f3?.qualSeatNo;

      // SSC Marks
      const sscObt = f1?.sscGrandTotalObtained;
      const sscOut = f1?.sscGrandTotalOutOf ?? 500;
      const sscPct = f1?.sscPercentage ? Number(f1.sscPercentage).toFixed(2) : (sscObt != null && sscOut ? ((Number(sscObt) / Number(sscOut)) * 100).toFixed(2) : null);

      // Category & Non-creamy layer certificate status
      const categoryVal = sp?.category || f1?.admissionCategory || cap?.category || "OPEN";
      const isNclRequired = isDocumentRequiredForCategory("Non Creamy-layer (If Applicable)", categoryVal);
      const nclStatus = isNclRequired ? "Yes" : "No";

      // Educational Gap
      const gaps = (f3 as any)?.educationalGaps;
      const gapDetailsStr = (Array.isArray(gaps) && gaps.length > 0 && gaps[0]?.lastExamName)
        ? `${gaps[0].lastExamName}${gaps[0].monthYearPassing ? ' (' + gaps[0].monthYearPassing + ')' : ''}`
        : f3?.qualCourseName?.includes("Gap")
        ? "1 Year Educational Gap"
        : null;

      // Handicapped & Minority
      const phStatus = f3?.physicallyDisabledYn ? (f3?.physicallyDisabledType ? "P1" : "P1") : "N";
      const minStatus = f3?.minorityYn ? "Linguistic" : "No";

      // Helper for OPTIONAL columns (22 to 33): Never output a dash if empty/null, return "" instead
      const optFmt = (val: any): string => {
        if (val === null || val === undefined || val === "" || val === "-") return "";
        return String(val);
      };

      const rowValues = [
        idx + 1,                                                 // 1. Sr. No.
        fmt(sp?.fullNameSurname),                                // 2. Last Name
        fmt(sp?.fullNameFirst),                                  // 3. First Name
        fmt(sp?.fullNameFather || sp?.fatherName),               // 4. Middle Name
        fmt(sp?.motherName),                                     // 5. Mother Name
        fmt(dob),                                                // 6. Birth Date
        fmt(sex),                                                // 7. Sex
        fmt(categoryVal),                                        // 8. Category
        nclStatus,                                               // 9. Non-creamy layer certificate status? (Yes if required for category, else No)
        fmt(f3?.qualUniversity || "Maharashtra State Board"),   // 10. Qualifying Board
        "H.S.C",                                                 // 11. Qualifying Exam Name
        fmt(hscSeatNo),                                          // 12. HSC Seat No. (Qualifying Seat No)
        fmt(hscPct),                                             // 13. Qualifying Exam %
        fmt(hscYear),                                            // 14. Passing Year
        isMh,                                                    // 15. Is Maharashtrian
        fmt(sp?.permanentAddress || f5?.localAddress),           // 16. Address
        phStatus,                                                // 17. Physically Handicapped
        minStatus,                                               // 18. Is Minority
        "",                                                      // 19. ABC ID (empty when not provided, no dash)
        fmt(sp?.mobileNo),                                       // 20. Mobile No
        fmt(sp?.email),                                          // 21. Email ID
        // --- OPTIONAL FIELDS (Cols 22 to 33): Completely EMPTY for all rows ---
        "",                                                      // 22. Minority Details
        "",                                                      // 23. PRN for General Register Number
        "",                                                      // 24. Gap Details (Only If Applicable)
        "",                                                      // 25. Last exam's Board / University Name in Full
        "",                                                      // 26. Last Exam Name
        "",                                                      // 27. Last Exam Percentage / Result
        "",                                                      // 28. Last Exam Passing Year
        "",                                                      // 29. Aadhar No.
        "",                                                      // 30. Religion
        "",                                                      // 31. Are you Registered your Name in voter list?
        "",                                                      // 32. Do you have EPIC Card?
        "",                                                      // 33. If yes, EPIC Number
      ];

      const rowNum = idx + 11;
      const row = sheet.getRow(rowNum);
      row.height = 20;

      rowValues.forEach((val, cIdx) => {
        const colCode = cIdx < 26 ? String.fromCharCode(65 + cIdx) : `A${String.fromCharCode(65 + (cIdx - 26))}`;
        const cell = sheet.getCell(`${colCode}${rowNum}`);
        cell.value = val;
        cell.font = { name: "Arial", size: 9 };
        cell.alignment = { vertical: "middle", horizontal: cIdx === 0 ? "center" : cIdx === 6 || cIdx === 14 || cIdx === 16 ? "center" : "left" };
        cell.border = { top: { style: "thin", color: { argb: "D1D5DB" } }, left: { style: "thin", color: { argb: "D1D5DB" } }, bottom: { style: "thin", color: { argb: "D1D5DB" } }, right: { style: "thin", color: { argb: "D1D5DB" } } };

        // Col 1 (Sr. No.) Yellow fill like official template
        if (cIdx === 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF00" } };
          cell.font = { name: "Arial", size: 9, bold: true };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Scholaris_Admitted_Candidates_${selectedBranch}_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Registry Excel export error:", error);
    return NextResponse.json({ error: error?.message || "Failed to export Excel" }, { status: 500 });
  }
}
