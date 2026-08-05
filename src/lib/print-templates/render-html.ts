import { PRINT_STYLES } from "./print-styles";
import { PrintFormData } from "./get-form-data";
import { isDocumentRequiredForCategory } from "../forms/form2-checklist";

/* ──────────────────── helpers ──────────────────── */

function v(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && "toFixed" in (val as any)) return String(val);
  return String(val);
}

function esc(val: unknown): string {
  return v(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(val: unknown): string {
  if (!val) return "";
  const d = new Date(String(val));
  if (isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function escDate(val: unknown): string {
  return esc(formatDate(val));
}

function formatPct(val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return (Math.round(num * 100) / 100).toFixed(2);
}

function formatAcademicYear(yearStartVal: unknown, yearEndVal: unknown) {
  let start = String(yearStartVal || "26").trim();
  if (start.length === 4) start = start.slice(2);

  const startNum = parseInt(start, 10) || 26;
  const startShort = String(startNum).padStart(2, "0");

  const endNum = (startNum + 1) % 100;
  const endShort = String(endNum).padStart(2, "0");

  return {
    start: startShort,
    end: endShort,
    text: `(Year 20${startShort} - 20${endShort})`,
    rawRange: `20${startShort} - 20${endShort}`,
  };
}

function formatQuota(quota: unknown): string {
  if (!quota) return "CAP (CET / JEE)";
  const str = String(quota);
  if (str === "CAP_CET_AIEEE" || str === "CAP_CET_JEE") return "CAP (CET / JEE)";
  if (str === "INSTITUTE_LEVEL") return "MGMT / Institute Level";
  if (str === "TFWS") return "TFWS";
  if (str === "EWS") return "EWS";
  return str.replace(/_/g, " ");
}

function formatAffidavitDateParts(dateVal: unknown) {
  const d = dateVal ? new Date(String(dateVal)) : new Date();
  const valid = !isNaN(d.getTime());
  const dateObj = valid ? d : new Date();

  const dayNum = dateObj.getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return {
    dayOrdinal: getOrdinal(dayNum),
    monthName,
    year: String(year),
  };
}

export interface MappedCategory {
  code: "OPEN" | "SC" | "ST" | "NT-A" | "NT-B" | "NT-C" | "NT-D" | "OBC" | "SBC" | "SEBC" | "EWS" | "OTHER";
  isNTA: boolean; // NT-A / VJ / DT-A
  isNTB: boolean; // NT-B / NT 1
  isNTC: boolean; // NT-C / NT 2
  isNTD: boolean; // NT-D / NT 3
  isReserved: boolean;
}

export function parseCategory(catVal: unknown): MappedCategory {
  const cat = String(catVal || "OPEN").toUpperCase().trim().replace(/_/g, " ");

  const isNTA = cat === "NT-A" || cat === "NTA" || cat === "NT A" || cat === "VJ" || cat === "VJ-A" || cat === "VJA" || cat === "DT-A" || cat === "DTA" || cat === "DT(A)" || cat === "DT A" || cat.startsWith("VJ");
  const isNTB = cat === "NT-B" || cat === "NTB" || cat === "NT B" || cat === "NT-1" || cat === "NT 1" || cat === "NT1" || cat === "NT(B)" || cat === "NT 1";
  const isNTC = cat === "NT-C" || cat === "NTC" || cat === "NT C" || cat === "NT-2" || cat === "NT 2" || cat === "NT2" || cat === "NT(C)" || cat === "NT 2";
  const isNTD = cat === "NT-D" || cat === "NTD" || cat === "NT D" || cat === "NT-3" || cat === "NT 3" || cat === "NT3" || cat === "NT(D)" || cat === "NT 3";

  const isSC = cat === "SC";
  const isST = cat === "ST";
  const isOBC = cat === "OBC";
  const isSBC = cat === "SBC";
  const isSEBC = cat === "SEBC";
  const isEWS = cat === "EWS";
  const isOPEN = cat === "OPEN" || cat === "GEN" || cat === "GENERAL";

  let code: MappedCategory["code"] = "OPEN";
  if (isNTA) code = "NT-A";
  else if (isNTB) code = "NT-B";
  else if (isNTC) code = "NT-C";
  else if (isNTD) code = "NT-D";
  else if (isSC) code = "SC";
  else if (isST) code = "ST";
  else if (isOBC) code = "OBC";
  else if (isSBC) code = "SBC";
  else if (isSEBC) code = "SEBC";
  else if (isEWS) code = "EWS";
  else if (!isOPEN) code = "OTHER";

  const isReserved = !isOPEN && code !== "OPEN";

  return { code, isNTA, isNTB, isNTC, isNTD, isReserved };
}

/* ════════════════════════════════════════════════════
   FORM 1 — APPLICATION FORM PAGE 1 & 2
   ════════════════════════════════════════════════════ */

function renderForm1(d: PrintFormData): string {
  const s = d.student;
  const f = d.form1;

  const surname = esc(s.fullNameSurname || "");
  const firstName = esc(s.fullNameFirst || "");
  const fatherFirst = esc(s.fullNameFather || s.fatherName || "");
  const motherFirst = esc(s.motherName || "");
  const branch = esc(s.branchCourse || "");
  const dob = escDate(s.dateOfBirth);
  const serialNo = esc(s.serialNumber || "001");

  const fatherFullName = fatherFirst ? (fatherFirst.toUpperCase().includes(surname.toUpperCase()) ? fatherFirst : `${fatherFirst} ${surname}`) : "";
  const motherFullName = motherFirst ? (motherFirst.toUpperCase().includes(surname.toUpperCase()) ? motherFirst : `${motherFirst} ${surname}`) : "";
  const candidateName = `${surname} ${firstName} ${fatherFirst}`.trim();

  const religionVal = esc(s.religionCaste || [f.religion, f.caste].filter(Boolean).join(" ") || f.religion || s.religion || "HINDU MARATHA");
  const emailVal = esc(String(s.email || "").toLowerCase());

  const ay = formatAcademicYear(s.admissionYearStart, s.admissionYearEnd);

  // Page 1
  const page1 = `<div class="page-container">
    <!-- Top Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <div style="width:80px;height:75px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <img src="/sangli.png" alt="Logo" style="width:75px;height:70px;object-fit:contain"/>
      </div>
      <div style="text-align:center;flex:1;padding:0 6px">
        <div style="font-size:11px;font-weight:bold">TSSM's</div>
        <div style="font-size:18px;font-weight:bold;letter-spacing:0.2px;line-height:1.15">
          Bhivrabai Sawant College of Engineering &amp; Research
        </div>
        <div style="font-size:10.5px;margin-top:1px">
          S.No. 12/1/2 and 12/2/2, Narhe, Taluka-Haveli, Pune-411041
        </div>
        <div style="font-size:10.5px;margin-top:1px">
          Phone No. 020-64703673, 4,5 Website : www.tssm.in
        </div>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <div style="font-size:24px;font-weight:900;letter-spacing:1px;color:#000">${serialNo}</div>
      </div>
    </div>

    <div style="border-bottom:2px solid #000;margin-bottom:8px"></div>

    <!-- Title Banner Capsule with Black Background & White Text -->
    <div style="text-align:center;margin:4px 0 10px">
      <div style="background-color:#000;color:#fff;padding:3px 28px;display:inline-block;font-weight:bold;font-size:14px;border-radius:14px;letter-spacing:1px;-webkit-print-color-adjust:exact;print-color-adjust:exact">
        APPLICATION FORM
      </div>
      <div style="margin-top:4px;font-size:13px;font-weight:bold">
        ${ay.text}
      </div>
    </div>

    <!-- Top Fields & Photo Box -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px">
      <div style="flex:1">
        <div class="form-row">
          <span class="form-label bold" style="width:130px">Branch/Course :</span>
          <span class="form-value">${branch}</span>
        </div>
        <div class="form-row mt-4">
          <span class="form-label bold" style="width:130px">Admission Quota :</span>
          <span style="font-size:11.5px;font-weight:bold;flex:1">${esc(formatQuota(f.admissionQuota))}</span>
        </div>
        <div class="form-row mt-4">
          <span class="form-label bold" style="width:130px">Admission Category :</span>
          <span style="font-size:11.5px;font-weight:bold;flex:1">${esc(s.category || f.admissionCategory || "Open / OBC / SBC / NT1 / NT2 / NT3 / SC / ST / DEF / PH")}</span>
        </div>
      </div>
      <div class="photo-box" style="width:115px;height:130px;border:1.5px solid #000"></div>
    </div>

    <!-- Candidate Personal Info (Items 1 - 11) -->
    <div style="margin-top:10px">
      <div class="form-row spaced" style="align-items:flex-start">
        <div style="min-width:160px">
          <div class="form-label bold">1. Name of the candidate :</div>
          <div style="font-size:10px;color:#000;margin-top:1px">(in block letters)</div>
        </div>
        <div style="flex:1">
          <div style="display:flex;gap:8px">
            <span class="form-value">${surname}</span>
            <span class="form-value">${firstName}</span>
            <span class="form-value">${fatherFirst}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#000;margin-top:1px;padding:0 10px">
            <span>(Surname)</span><span>(Name)</span><span>(Father's Name)</span>
          </div>
        </div>
      </div>

      <div class="form-row mt-4">
        <span class="form-label bold" style="min-width:135px">2. Father's Name :</span>
        <span class="form-value">${fatherFullName}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label bold" style="min-width:135px">3. Mother's Name :</span>
        <span class="form-value">${motherFullName}</span>
      </div>

      <div class="form-row mt-4">
        <span class="form-label bold" style="min-width:135px">4. Date of Birth :</span>
        <span class="form-value short">${dob}</span>
        <span class="form-label bold" style="margin-left:20px;min-width:110px">5. Blood Group :</span>
        <span class="form-value short">${esc(s.bloodGroup)}</span>
      </div>

      <div class="form-row mt-4">
        <span class="form-label bold" style="min-width:135px">6. Sex : Male / Female :</span>
        <span class="form-value short">${esc(s.gender)}</span>
        <span class="form-label bold" style="margin-left:20px;min-width:135px">7. Religion &amp; Caste :</span>
        <span class="form-value short">${religionVal}</span>
      </div>

      <div class="form-row mt-4">
        <span class="form-label bold" style="min-width:190px">8. Contact Tel.No.(with S.T.D.) :</span>
        <span class="form-value short">${esc(s.contactTelNo || f.stdCode || "")}</span>
        <span class="form-label bold" style="margin-left:12px">Mobile No. :</span>
        <span class="form-value medium">${esc(s.mobileNo)}</span>
      </div>

      <div class="form-row mt-4">
        <span class="form-label bold" style="min-width:135px">9. E-mail Address :</span>
        <span class="form-value lowercase">${emailVal}</span>
      </div>

      <div class="form-row mt-4">
        <span class="form-label bold" style="min-width:135px">10. Mother Tounge :</span>
        <span class="form-value medium">${esc(f.motherTongue)}</span>
        <span class="form-label bold" style="margin-left:15px;min-width:140px">11. Home University :</span>
        <span class="form-value">${esc(f.homeUniversity)}</span>
      </div>
    </div>

    <!-- 12. SSC Marks -->
    <div style="margin-top:10px">
      <div style="font-weight:bold;font-size:12.5px">12. a) S.S.C. Marks :</div>
      <table class="form-table mt-4">
        <thead><tr>
          <th style="width:120px"></th><th>English</th><th>Mathematics</th><th>Grand Total</th><th>Percentage</th>
        </tr></thead>
        <tbody>
          <tr>
            <td style="font-weight:bold">Obtained</td>
            <td><span class="val">${esc(f.sscMarksEnglishObtained)}</span></td>
            <td><span class="val">${esc(f.sscMarksMathsObtained)}</span></td>
            <td><span class="val">${esc(f.sscGrandTotalObtained)}</span></td>
            <td><span class="val" style="font-weight:900">${f.sscPercentage ? esc(formatPct(f.sscPercentage)) + "%" : ""}</span></td>
          </tr>
          <tr>
            <td style="font-weight:bold">Out of</td>
            <td><span class="val">${esc(f.sscMarksEnglishOutOf)}</span></td>
            <td><span class="val">${esc(f.sscMarksMathsOutOf)}</span></td>
            <td><span class="val">${esc(f.sscGrandTotalOutOf)}</span></td>
            <td><span class="val">100%</span></td>
          </tr>
        </tbody>
      </table>
      <div class="form-row mt-4">
        <span class="form-label bold">b) SSC Year of passing :</span>
        <span class="form-value short">${esc(f.sscYearOfPassing)}</span>
      </div>
    </div>

    <!-- 13. HSC Marks -->
    <div style="margin-top:10px">
      <div style="font-weight:bold;font-size:12.5px">13. a) H.S.C. Marks :</div>
      <table class="form-table mt-4">
        <thead><tr>
          <th style="width:120px"></th><th>Physics</th><th>${esc(f.hscChemistrySubjectName || "Chemistry")}</th><th>Mathematics</th><th>PCM Total</th><th>Grand Total</th>
        </tr></thead>
        <tbody>
          <tr>
            <td style="font-weight:bold">Obtained</td>
            <td><span class="val">${esc(f.hscPhysicsObtained)}</span></td>
            <td><span class="val">${esc(f.hscChemistryObtained)}</span></td>
            <td><span class="val">${esc(f.hscMathsObtained)}</span></td>
            <td><span class="val" style="font-weight:900">${esc(f.hscPcmTotalObtained)}</span></td>
            <td><span class="val">${esc(f.hscGrandTotalObtained)}</span></td>
          </tr>
          <tr>
            <td style="font-weight:bold">Out of</td>
            <td><span class="val">${esc(f.hscPhysicsOutOf)}</span></td>
            <td><span class="val">${esc(f.hscChemistryOutOf)}</span></td>
            <td><span class="val">${esc(f.hscMathsOutOf)}</span></td>
            <td><span class="val">${esc(f.hscPcmTotalOutOf)}</span></td>
            <td><span class="val">${esc(f.hscGrandTotalOutOf)}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="form-row mt-4">
        <span class="form-label bold">b) HSC Year of passing :</span>
        <span class="form-value short">${esc(f.hscYearOfPassing)}</span>
      </div>
    </div>

    <!-- 14. CET Marks -->
    <div style="margin-top:10px">
      <div style="font-weight:bold;font-size:12.5px">14. a) CET Marks :</div>
      <table class="form-table mt-4">
        <thead><tr>
          <th style="width:120px"></th><th>Physics</th><th>Chemistry</th><th>Mathematics</th><th>PCM Total</th>
        </tr></thead>
        <tbody>
          <tr>
            <td style="font-weight:bold">Obtained</td>
            <td><span class="val">${esc(f.cetPhysicsObtained)}</span></td>
            <td><span class="val">${esc(f.cetChemistryObtained)}</span></td>
            <td><span class="val">${esc(f.cetMathsObtained)}</span></td>
            <td><span class="val" style="font-weight:900">${esc(f.cetPcmTotalObtained)}</span></td>
          </tr>
          <tr>
            <td style="font-weight:bold">Out of</td>
            <td><span class="val">${esc(f.cetPhysicsOutOf)}</span></td>
            <td><span class="val">${esc(f.cetChemistryOutOf)}</span></td>
            <td><span class="val">${esc(f.cetMathsOutOf)}</span></td>
            <td><span class="val">${esc(f.cetPcmTotalOutOf)}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="form-row mt-4">
        <span class="form-label bold">b) CET Exam. Seat No.:</span>
        <span class="form-value medium">${esc(f.cetExamSeatNo)}</span>
        <span class="form-label bold" style="margin-left:15px">Merit No°.:</span>
        <span class="form-value medium">${esc(f.cetMeritNo)}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label bold">c) AIEEE Marks :</span>
        <span class="form-value medium">${esc(f.aieeeMarks)}</span>
      </div>
    </div>
  </div>`;

  // Page 2
  const page2 = `<div class="page-container">
    <!-- 15. Diploma Student -->
    <div style="margin-bottom:18px">
      <div style="font-weight:bold;font-size:13px">15. For Diploma Student :</div>
      <div style="margin-left:20px;margin-top:6px;margin-bottom:10px">
        <div style="font-weight:bold;font-size:12.5px;margin-bottom:6px">a) Marks at Final Year of Diploma</div>
        <div style="display:flex;gap:24px;margin-left:20px">
          <div style="text-align:center">
            <div style="width:110px;height:45px;border:1.5px solid #000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px">
              ${esc(f.diplomaMarksObtained)}
            </div>
            <div style="font-size:11px;margin-top:3px">(Marks obtained)</div>
          </div>
          <div style="text-align:center">
            <div style="width:110px;height:45px;border:1.5px solid #000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px">
              ${esc(f.diplomaMarksOutOf)}
            </div>
            <div style="font-size:11px;margin-top:3px">(Total Marks)</div>
          </div>
        </div>
      </div>

      <div class="form-row mt-8">
        <span class="form-label bold" style="margin-left:20px">b) Branch/Course at Diploma :</span>
        <span class="form-value">${esc(f.diplomaBranchCourse)}</span>
      </div>
      <div class="form-row mt-8" style="align-items:center;gap:12px;flex-wrap:nowrap">
        <span class="form-label bold" style="margin-left:20px;white-space:nowrap">c) B.T.E Enrollment No. :</span>
        <span style="border:1.5px solid #000;padding:0 8px;min-width:160px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:13px">${esc(f.diplomaBteEnrollmentNo)}</span>
        <span class="form-label bold" style="margin-left:15px;white-space:nowrap">d) Diploma Year of Passing :</span>
        <span style="border:1.5px solid #000;padding:0 8px;min-width:110px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:13px">${esc(f.diplomaYearOfPassing)}</span>
      </div>
    </div>

    <!-- 16. Correspondence Address -->
    <div style="margin-bottom:18px">
      <div class="form-row">
        <span class="form-label bold">16. Correspondence Address :</span>
        <span class="form-value full">${esc(s.correspondenceAddress)}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-value full"></span>
      </div>
      <div class="form-row mt-4">
        <span class="form-value" style="flex:1"></span>
        <span class="form-label bold" style="margin-left:15px">Pin Code :</span>
        <span class="form-value short">${esc(s.correspondencePin)}</span>
      </div>
      <div class="form-row mt-8">
        <span class="form-label bold">Contact Tel.No.(with STD) :</span>
        <span class="form-value medium">${esc(s.contactTelNo || "")}</span>
        <span class="form-label bold" style="margin-left:20px">Mobile No.</span>
        <span class="form-value medium">${esc(s.mobileNo)}</span>
      </div>
    </div>

    <!-- 17. Permanent Address -->
    <div style="margin-bottom:18px">
      <div class="form-row">
        <span class="form-label bold">17. Permanent Address :</span>
        <span class="form-value full">${esc(s.permanentAddress)}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-value full"></span>
      </div>
      <div class="form-row mt-4">
        <span class="form-value" style="flex:1"></span>
        <span class="form-label bold" style="margin-left:15px">Pin Code :</span>
        <span class="form-value short">${esc(s.permanentPin)}</span>
      </div>
      <div class="form-row mt-8">
        <span class="form-label bold">Contact Tel.No.(with STD) :</span>
        <span class="form-value medium">${esc(s.contactTelNo || "")}</span>
        <span class="form-label bold" style="margin-left:20px">Mobile No.</span>
        <span class="form-value medium">${esc(s.mobileNo)}</span>
      </div>
    </div>

    <!-- 18. Annual Income -->
    <div class="form-row spaced" style="margin-bottom:18px">
      <span class="form-label bold" style="font-size:13px">18. Annual income of Parent : Rs.</span>
      <span class="form-value medium">${esc(f.annualIncomeOfParent)}</span>
    </div>

    <!-- Date & Place -->
    <div style="margin-top:18px;margin-bottom:20px">
      <div class="form-row">
        <span class="form-label bold">Date :</span>
        <span class="form-value short">${escDate(f.dateField || new Date())}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label bold">Place :</span>
        <span class="form-value short">${esc(f.placeField || "NARHE")}</span>
      </div>
    </div>

    <!-- Signature Boxes -->
    <div style="display:flex;justify-content:space-between;margin:28px 20px 18px">
      <div style="text-align:center">
        <div style="width:210px;height:60px;border:1.5px solid #000"></div>
        <div style="font-size:12px;margin-top:4px">(Signature of Parent / Guardian)</div>
        <div style="font-size:11px;font-weight:bold;margin-top:2px">Mob: ${esc(s.parentsTelNo || s.parentMobileNo || s.fatherMobileNo || s.guardianMobileNo || (d.form5 && d.form5.parentsTelNo) || s.mobileNo || "")}</div>
      </div>
      <div style="text-align:center">
        <div style="width:210px;height:60px;border:1.5px solid #000"></div>
        <div style="font-size:12px;margin-top:4px">(Signature of Student)</div>
        <div style="font-size:11px;font-weight:bold;margin-top:2px">Mob: ${esc(s.mobileNo)}</div>
      </div>
    </div>

    <!-- For Office Use Section -->
    <div style="border-top:1.5px solid #000;padding-top:12px;margin-top:24px">
      <div style="text-align:center;font-weight:bold;font-size:13.5px;margin-bottom:10px">For office use only</div>
      <div style="font-size:12.5px;line-height:1.8">
        Applicant Mr/Miss. <span style="border-bottom:1.5px solid #000;padding:0 8px;font-weight:900;display:inline-block;min-width:320px">${candidateName}</span> is eligible for the First /Second Year Engineering course for the academic year 20<span style="font-weight:bold">${ay.start}</span> - 20<span style="font-weight:bold">${ay.end}</span><br/>
        Branch : <span style="border:1.5px solid #000;padding:2px 14px;display:inline-block;min-width:160px;font-weight:900">${branch}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:34px">
        <div style="font-size:12px;font-weight:bold">Civil / Comp / E &amp; TC / IT / Mech / Elect</div>
        <div style="font-size:15px;font-weight:bold;margin-right:20px">Principal</div>
      </div>
    </div>
  </div>`;

  return page1 + page2;
}

/* ════════════════════════════════════════════════════
   FORM 2 — DOCUMENT CHECKLIST (Page 3 - Untouched)
   ════════════════════════════════════════════════════ */

function renderForm2(d: PrintFormData): string {
  const s = d.student;
  const f = d.form2;
  const fullName = `${v(s.fullNameSurname)} ${v(s.fullNameFirst)} ${v(s.fullNameFather)}`.trim();
  const ay = formatAcademicYear(s.admissionYearStart, s.admissionYearEnd);
  const categoriesText = esc(s.category || f.admissionCategory || "");

  const DOC_ITEMS = [
    { id: "01", title: "Allotment Letter" },
    { id: "02", title: "Confirmation Letter" },
    { id: "03", title: "S.S.C Mark sheet" },
    { id: "04", title: "S.S.C Board Certificate" },
    { id: "05", title: "H.S.C. Mark sheet" },
    { id: "06", title: "H.S.C. Board Certificate" },
    { id: "07", title: "Leaving / TC Certificate" },
    { id: "08", title: "Migration Certificate (If Applicable)" },
    { id: "09", title: "Age, Nationality, Domicile / Birth Certificate" },
    { id: "10", title: "Cast Certificate (If Applicable)" },
    { id: "11", title: "Cast Validity Certificate (If Applicable)" },
    { id: "12", title: "Non Creamy-layer (If Applicable)" },
    { id: "13", title: "Income Certificate (If Applicable)" },
    { id: "14", title: "EWS Certificate (If Applicable)" },
    { id: "15", title: "Gap Certificate (If Applicable)" },
    { id: "16", title: "Aadhar Card Xerox" },
    { id: "17", title: "APAAR/ABC ID xerox" },
    { id: "18", title: "Passport Size 2 Photo" },
    { id: "19", title: "JEE Score Card" },
    { id: "20", title: "CET Score Card" },
  ];

  let rows = "";
  for (const item of DOC_ITEMS) {
    const dbItem = d.checklistItems.find(ci => ci.srNo === parseInt(item.id));
    const status = dbItem ? (dbItem.required ? "Yes (✓)" : "No (✗)") : "No (✗)";
    rows += `<tr>
      <td>${esc(item.id)}</td>
      <td style="text-align:left;padding-left:10px">${esc(item.title)}</td>
      <td>${status}</td>
    </tr>`;
  }

  return `<div class="page-container">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <div style="width:70px;height:70px;flex-shrink:0">
        <img src="/sangli.png" alt="Logo" style="width:65px;height:65px;object-fit:contain"/>
      </div>
      <div style="text-align:center;flex:1;padding:0 8px">
        <div style="font-size:13px;font-weight:bold">THE SHETKARI SHIKSHAN MANDAL'</div>
        <div style="font-size:17px;font-weight:bold">
          BHIVARABAI SAWANT COLLEGE OF ENGINEERING &amp; RESEARCH, NARHE.
        </div>
        <div style="font-size:11px;font-style:italic">
          (Approved by AICTE, New Delhi, Govt. of Maharashtra and affiliated to MSBTE Mumbai.)
        </div>
        <div style="font-size:11px">
          S.No.12/1/2 &amp; 12/2/2, Narhe, Pune-41 &nbsp;|&nbsp; Phone: +91-020-24608511
        </div>
        <div style="font-size:11px">Website: www.tssm.edu.in</div>
      </div>
    </div>

    <div style="border-bottom:2px solid #000;margin:6px 0 10px"></div>

    <div style="text-align:center;font-weight:bold;font-size:18px;margin:8px 0 12px">List of Documents</div>

    <div style="border:1px solid #000;padding:8px 12px;margin-bottom:12px;background:#fff">
      <div class="form-row">
        <span class="form-label bold">Name of the Student :</span>
        <span class="form-value" style="font-size:14px">${esc(fullName)}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label bold">Class :</span>
        <span class="form-value short">${esc(f.admissionType || "F.E.")}</span>
        <span class="form-label bold" style="margin-left:15px">Branch :</span>
        <span class="form-value medium">${esc(s.branchCourse)}</span>
        <span class="form-label bold" style="margin-left:15px">Admission year :</span>
        <span class="form-value short">${ay.rawRange}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label bold">Admission Type :</span>
        <span style="font-weight:bold;margin:0 8px">${esc(f.admissionType || "CAP")}</span>
        <span class="form-label bold" style="margin-left:20px">Cap ID :</span>
        <span class="form-value medium">${esc(f.capId)}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label bold">Student Mobile No :</span>
        <span class="form-value medium">${esc(s.mobileNo)}</span>
        <span class="form-label bold" style="margin-left:20px">Email ID :</span>
        <span class="form-value">${esc(s.email)}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label bold">Admission Category :</span>
        <span class="form-value" style="font-weight:900">${categoriesText}</span>
      </div>
    </div>

    <div style="font-weight:bold;font-size:13px;margin:8px 0">
      I have submitted following Original Documents in the college.
    </div>

    <table class="form-table">
      <thead><tr>
        <th style="width:55px">Sr. No.</th>
        <th style="text-align:left;padding-left:10px">List of Documents</th>
        <th style="width:160px">Received Documents<br/><span style="font-size:11px;font-weight:normal">Yes or No (✓ / ✗)</span></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px">
      <div class="signature-line">Staff Sign</div>
      <div class="signature-line" style="text-align:right">
        Student Sign<br/>
        <span style="font-size:11px;font-weight:bold">Mob: ${esc(s.mobileNo)}</span>
      </div>
    </div>

    <div class="form-row" style="margin-top:12px;justify-content:flex-start">
      <span class="form-label bold">Date :</span>
      <span class="form-value short">${escDate(f.checklistDate || new Date())}</span>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════════
   FORM 3 — SPPU ELIGIBILITY PAGE 4 & 5
   ════════════════════════════════════════════════════ */

function renderForm3(d: PrintFormData): string {
  const s = d.student;
  const f = d.form3;
  const fullName = `${v(s.fullNameSurname)} ${v(s.fullNameFirst)} ${v(s.fullNameFather)}`.trim();
  const aadhar = v(s.aadharNoDecrypted || s.aadharNo || "");
  const branch = v(s.branchCourse || f.courseName || "");
  const ay = formatAcademicYear(s.admissionYearStart, s.admissionYearEnd);
  const dob = formatDate(s.dateOfBirth);
  const dobParts = dob.split("/");
  const dobDay = dobParts[0] || "";
  const dobMonth = dobParts[1] || "";
  const dobYear = dobParts[2] || "";
  const rawCat = String(s.category || f.categoryTick || d.form1.admissionCategory || "");
  const catInfo = parseCategory(rawCat);

  const rollNoVal = esc(f.rollNo || s.rollNo || f.officeReceiptNo || "");
  const courseYear = String(f.courseYear || "1st").trim();

  const gapLastExamName = esc(f.gapLastExamName || "");
  const gapSeatNo = esc(f.gapSeatNo || "");
  const gapMonthYearPassing = esc(f.gapMonthYearPassing || "");
  const gapPercentage = f.gapPercentage ? `${formatPct(f.gapPercentage)}%` : "";
  const gapClassGrade = esc(f.gapClassGrade || "");

  const isMinority = f.minorityYn === true || (f.minorityYn !== false && Boolean(f.minorityLinguistic || f.minorityReligion));
  const isLinguistic = isMinority && Boolean(f.minorityLinguistic || String(f.minorityType || "").toLowerCase().includes("ling"));
  const isReligious = isMinority && Boolean(f.minorityReligion || String(f.minorityType || "").toLowerCase().includes("rel") || (isMinority && f.religion));
  const minorityReligionText = (isMinority && isReligious) ? esc(f.religion || "✓") : "";

  // Page 4
  const page4 = `<div class="page-container">
    <!-- Header -->
    <div style="text-align:center;position:relative;margin-bottom:6px">
      <div style="font-size:18px;font-weight:bold;letter-spacing:0.5px">SAVITRIBAI PHULE PUNE UNIVERSITY</div>
      <div style="margin:4px 0">
        <img src="/sppu.jpg" alt="SPPU Logo" style="height:55px;object-fit:contain"/>
      </div>
      <div style="font-size:15px;font-weight:bold">Application for Eligibility</div>
      <div style="font-size:11.5px;font-style:italic">(For Under Graduate Courses only)</div>

      <div style="position:absolute;left:0;bottom:10px;font-size:12px;font-weight:bold">
        Form fees: Rs. 50/-
      </div>
      <div style="position:absolute;right:0;top:0;border:1.5px solid #000;padding:4px 8px;text-align:center;font-size:10.5px;width:165px">
        <div style="font-weight:bold">Roll No./Admission No.</div>
        <div style="color:#333;font-size:9.5px">(for office use only)</div>
        <div style="font-weight:900;font-size:13px;margin-top:2px">${rollNoVal}</div>
      </div>
    </div>

    <div style="border-bottom:1.5px solid #000;margin:6px 0 8px"></div>

    <!-- Academic Year -->
    <div class="form-row spaced">
      <span class="form-label bold">I wish to apply for the Eligibility for the academic year :</span>
      <span style="margin-left:12px">20<span style="border-bottom:1px solid #000;padding:0 6px;font-weight:bold">${ay.start}</span> - 20<span style="border-bottom:1px solid #000;padding:0 6px;font-weight:bold">${ay.end}</span></span>
    </div>

    <!-- 1. Course & Year -->
    <div class="form-row">
      <span class="form-label bold">1. Name of the Course to which Admission is sought:</span>
      <span class="form-value" style="font-weight:900">${esc(branch)}</span>
      <span class="form-label bold" style="margin-left:10px">
        Year: ${['1st', '2nd', '3rd', '4th', '5th'].map(yr => (yr === "1st" || yr === courseYear) ? `<u><strong>${yr}</strong></u>` : yr).join(' / ')}
      </span>
    </div>

    <!-- 2. Applicant Name -->
    <div style="margin-top:6px">
      <div class="form-label bold">2. Name of the Applicant <em>(In English Capital Letters)</em></div>
      <div style="font-size:10.5px;color:#333;margin-bottom:2px">
        Name as per last Mark sheet should be mentioned. N.R.I. Student should write their name as it appears in their Passport.
      </div>
      <div class="form-value full" style="font-weight:900">${esc(fullName)}</div>
    </div>

    <div style="border-bottom:1.5px solid #000;margin:8px 0"></div>

    <!-- 3 to 12 Details Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px">
      <div class="form-row">
        <span class="form-label bold">3. Mother's Name:</span>
        <span class="form-value">${esc(s.motherName)}</span>
      </div>
      <div class="form-row">
        <span class="form-label bold">4. Aadhar No.:</span>
        <span class="form-value">${esc(aadhar)}</span>
      </div>
      <div class="form-row">
        <span class="form-label bold">5. Mobile No.:</span>
        <span class="form-value">${esc(s.mobileNo)}</span>
      </div>
      <div class="form-row">
        <span class="form-label bold">6. PAN No.:</span>
        <span class="form-value">${esc(s.panNo || "")}</span>
      </div>
      <div class="form-row">
        <span class="form-label bold">7. Email Id:</span>
        <span class="form-value lowercase">${esc(String(s.email || "").toLowerCase())}</span>
      </div>
      <div class="form-row">
        <span class="form-label bold">8. Type:</span>
        <span>${f.applicantType === "NON_MAHARASHTRIAN" ? "Maharashtrian / <u><strong>Non-Maharashtrian</strong></u>" : "<u><strong>Maharashtrian</strong></u> / Non-Maharashtrian"}</span>
      </div>
      <div class="form-row">
        <span class="form-label bold">9. Nationality:</span>
        <span class="form-value">${esc(f.nationality || "INDIAN")}</span>
      </div>
      <div class="form-row">
        <span class="form-label bold">10. Religion:</span>
        <span class="form-value">${esc(f.religion || s.religionCaste || "HINDU MARATHA")}</span>
      </div>
      <div class="form-row">
        <span class="form-label bold">11. Gender:</span>
        <span>${String(s.gender).toUpperCase() === "MALE" ? "<u><strong>Male</strong></u> / Female / Transgender" : String(s.gender).toUpperCase() === "FEMALE" ? "Male / <u><strong>Female</strong></u> / Transgender" : "Male / Female / Transgender"}</span>
      </div>
      <div class="form-row" style="align-items:center">
        <span class="form-label bold">12. Date of Birth:</span>
        <span style="border-bottom:1px solid #000;padding:0 4px;font-weight:bold">${dobDay}</span> /
        <span style="border-bottom:1px solid #000;padding:0 4px;font-weight:bold">${dobMonth}</span> /
        <span style="border-bottom:1px solid #000;padding:0 4px;font-weight:bold">${dobYear}</span>
        <span style="font-size:9.5px;color:#333;margin-left:6px">(DD MM YYYY)</span>
      </div>
    </div>

    <!-- 13. Category Grid Table -->
    <div style="margin-top:6px">
      <div class="form-label bold">13. Category (Tick mark √ in applicable box)</div>
      <table class="form-table" style="margin:3px 0">
        <thead><tr>
          <th>Open</th><th>SC</th><th>ST</th><th>DT(A)</th><th>NT(B)</th><th>NT(C)</th><th>NT(D)</th><th>OBC</th><th>SBC</th><th>SEBC</th><th>EWS</th>
        </tr></thead>
        <tbody><tr>
          <td>${catInfo.code === "OPEN" ? "✓" : ""}</td>
          <td>${catInfo.code === "SC" ? "✓" : ""}</td>
          <td>${catInfo.code === "ST" ? "✓" : ""}</td>
          <td>${catInfo.isNTA ? "✓" : ""}</td>
          <td>${catInfo.isNTB ? "✓" : ""}</td>
          <td>${catInfo.isNTC ? "✓" : ""}</td>
          <td>${catInfo.isNTD ? "✓" : ""}</td>
          <td>${catInfo.code === "OBC" ? "✓" : ""}</td>
          <td>${catInfo.code === "SBC" ? "✓" : ""}</td>
          <td>${catInfo.code === "SEBC" ? "✓" : ""}</td>
          <td>${catInfo.code === "EWS" ? "✓" : ""}</td>
        </tr></tbody>
      </table>
      <div style="font-size:10px;font-style:italic">(If you belong to ony of the Reserve category attach a certificate of a Competent Authority in Support of it.)</div>
      <div style="font-size:11px;margin-top:2px">
        <strong>1) Do you belong to DT(A), NT(B), NT(C), NT(D), OBC, SBC, SEBC or EWS?</strong> ${catInfo.isReserved ? "<u><strong>Yes</strong></u> / No" : "Yes / <u><strong>No</strong></u>"}<br/>
        <em>(If yes submit the Non-Creamy layer certificate of a Competent Authority in support of it.)</em>
      </div>
    </div>

    <!-- 14. Physically Disabled -->
    <div style="margin-top:4px">
      <span class="form-label bold">14. Are you Physically Disaibid?</span> ${f.physicallyDisabled === "Yes" ? "<u><strong>Yes</strong></u> / No" : "Yes / <u><strong>No</strong></u>"} ( If yes please specify type : <span class="form-value short">${esc(f.physicallyDisabledType || "_")}</span> )
    </div>

    <!-- 15. Qualifying Exam Box -->
    <div style="border:1.5px solid #000;padding:6px;margin-top:6px">
      <div style="font-weight:bold;font-size:12px;margin-bottom:3px">15. Particulars of the Qualifying Examination</div>
      <div class="form-row">
        <span class="form-label">1.Name of the Course:</span>
        <span class="form-value">${esc(f.qualCourseName || "HSC")}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label">2.Duration of the Course:</span>
        <span class="form-value short">${esc(f.qualDuration || "2 YEARS")}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label">3.Name of the University:</span>
        <span class="form-value">${esc(f.qualUniversity || "MAHARASHTRA BOARD")}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-label">4.Name of the College/Institute/University Dept::</span>
        <span class="form-value">${esc(f.qualCollegeDept || "")}</span>
      </div>

      <table class="form-table" style="margin-top:6px">
        <thead><tr><th>Seat No.</th><th>Month &amp; Year of Passing</th><th>Percentage</th><th>Class/Grade</th></tr></thead>
        <tbody><tr>
          <td><span class="val">${esc(f.qualSeatNo || f.cetExamSeatNo || "")}</span></td>
          <td><span class="val">${esc(f.qualMonthYearPassing || f.hscYearOfPassing || "")}</span></td>
          <td><span class="val">${esc(f.qualPercentage || f.hscPercentage || "")}%</span></td>
          <td><span class="val">${esc(f.qualClassGrade || "12TH")}</span></td>
        </tr></tbody>
      </table>

      <div style="font-weight:bold;font-size:11.5px;margin-top:6px">5. Please specify Educational gap details if any</div>
      <table class="form-table" style="margin-top:3px;width:100%">
        <thead><tr><th>Last Examination Name</th><th>Seat No.</th><th>Month &amp; Year of Passing</th><th>Percentage</th><th>Class/Grade</th></tr></thead>
        <tbody><tr style="height:26px">
          <td style="height:26px;min-height:26px">${gapLastExamName ? `<span class="val">${gapLastExamName}</span>` : "&nbsp;"}</td>
          <td style="height:26px;min-height:26px">${gapSeatNo ? `<span class="val">${gapSeatNo}</span>` : "&nbsp;"}</td>
          <td style="height:26px;min-height:26px">${gapMonthYearPassing ? `<span class="val">${gapMonthYearPassing}</span>` : "&nbsp;"}</td>
          <td style="height:26px;min-height:26px">${gapPercentage ? `<span class="val">${gapPercentage}</span>` : "&nbsp;"}</td>
          <td style="height:26px;min-height:26px">${gapClassGrade ? `<span class="val">${gapClassGrade}</span>` : "&nbsp;"}</td>
        </tr></tbody>
      </table>
    </div>

    <!-- 16. Minority -->
    <div style="margin-top:6px">
      <span class="form-label bold">16. Are you belong to the Minority ?</span> ${isMinority ? "<u><strong>Yes</strong></u> / No" : "Yes / <u><strong>No</strong></u>"} ( if yes please specify type which has given below)<br/>
      <div style="margin-left:200px;margin-top:2px;display:flex;gap:15px;align-items:center">
        <span>Linguistic:</span> <div style="width:30px;height:20px;border:1px solid #000;text-align:center;font-weight:bold;line-height:18px">${isLinguistic ? "✓" : ""}</div>
        <span>Religion:</span> <div style="width:30px;height:20px;border:1px solid #000;text-align:center;font-weight:bold;line-height:18px">${minorityReligionText}</div>
      </div>
    </div>

    <div style="text-align:right;margin-top:14px;font-weight:bold;font-size:13px">
      Signature of Candidate<br/>
      <span style="font-size:11px;font-weight:bold">Mob: ${esc(s.mobileNo)}</span>
    </div>
  </div>`;

  // Page 5
  const page5 = `<div class="page-container">
    <div style="font-size:12.5px;font-weight:bold;margin-bottom:8px">
      Copies of following attested certificates are annexed to application form :
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11.5px;line-height:1.5">
      <div>1. Statement of Marks of the qualifying examination</div>
      <div>5. Caste Certificate (For reserved category students)</div>
      <div>2. Educational Gap Certificate</div>
      <div>6. Caste Validity Certificate (For reserved category students)</div>
      <div>3. Affidavit for change in name</div>
      <div>7. Transfer Certificate</div>
      <div>4. Domicile Certificate</div>
      <div>8. Migration Certificate (If applicable)</div>
    </div>

    <div style="border-top:1.5px solid #000;margin:12px 0 8px"></div>

    <div style="border:1.5px solid #000;padding:8px 12px;margin:8px 0">
      <div style="text-align:center;font-weight:bold;font-size:13px;margin-bottom:8px">
        To be filled by College / Institute / University Department
      </div>
      <div class="form-row">
        <span class="form-label bold">Receipt No. :</span>
        <span class="form-value short">${esc(f.officeReceiptNo || "7769887")}</span>
        <span class="form-label bold" style="margin-left:20px">Date :</span>
        <span class="form-value short">${escDate(f.officeDate || new Date())}</span>
        <span class="form-label bold" style="margin-left:20px">Status :</span>
        <span style="font-weight:bold;color:green">Eligible</span> / <span>Not Eligible</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:24px;font-size:11.5px">
        <div>Asst.</div><div>Sr.Asst.</div><div>O.S./ Registrar / HOD</div>
      </div>
    </div>

    <div style="margin:12px 0">
      <div style="font-weight:bold;font-size:12.5px;margin-bottom:4px">*Physical Disabled Types:</div>
      <table class="form-table left-align" style="width:85%">
        <tbody>
          <tr><td style="width:45px;font-weight:bold">P1</td><td>Blind / Visually impaired / अंध / दृष्टीहीन</td></tr>
          <tr><td style="font-weight:bold">P2</td><td>Dumb and Deaf / मूकबधीर</td></tr>
          <tr><td style="font-weight:bold">P3</td><td>Orthopedically impaired / अस्थिव्यंग</td></tr>
          <tr><td style="font-weight:bold">P4</td><td>Mentally Challenged / मतिमंद / गतीमंद वगैरे</td></tr>
          <tr><td style="font-weight:bold">OT</td><td>Other Physical disabilities</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top:14px">
      <div style="text-align:center;font-weight:bold;font-size:13.5px;margin-bottom:6px">
        ANNEXURE 'A' ELIGIBILITY FEE
      </div>
      <div style="font-size:11.5px;margin-bottom:6px">
        1. Student passing qualifying examination and seeking admission First Time to First year of any Degree/Diploma/certificate (U.G./P.G.) the Eligibility Fee will be as under:
      </div>
      <table class="form-table">
        <thead>
          <tr>
            <th style="width:45px" rowspan="2">Sr.<br/>No.</th>
            <th rowspan="2" style="text-align:center">Particulars</th>
            <th colspan="2" style="text-align:center">Fees</th>
          </tr>
          <tr>
            <th style="width:110px;text-align:center">Non-<br/>Professional<br/><span style="font-weight:normal">Rs.</span></th>
            <th style="width:110px;text-align:center">Professional<br/><span style="font-weight:normal">Rs.</span></th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1.</td><td style="text-align:left">Within the State of Maharashtra</td><td>350</td><td><strong>600</strong></td></tr>
          <tr><td>2.</td><td style="text-align:left">From outside the State of Maharashtra</td><td>600</td><td>1100</td></tr>
          <tr><td>3.</td><td style="text-align:left">From any foreign country (Out of India) and<br/>(NRI/Foreign Citizen-Foreign National, P.I.O.)</td><td>600</td><td>1100</td></tr>
          <tr><td>4.</td><td style="text-align:left">Eligibility Form Fee</td><td>50</td><td>50</td></tr>
          <tr><td>5.</td><td style="text-align:left">Equivalence Fee (Per Candidate)</td><td>600</td><td>600</td></tr>
        </tbody>
      </table>

      <div style="font-size:11px;line-height:1.45;margin-top:12px;text-align:justify">
        <p style="margin-bottom:5px"><strong>2.</strong> Admission charges for the submission of required documents will be Rs. 350 for Non-Professional courses &amp; Rs. 600/- for Professional courses (Per Student) up to 30 day's from last date assessibed for submission of documents.</p>
        <p style="margin-bottom:5px"><strong>3.</strong> If an affiliated College admits students not eligible and who are migrating from other University/Board and allowing to fill in Examination Form without obtaining Eligibility Certificate, a penalty of Rs.10,000/-per student would be imposed on the College and the performance of Examination of such students will also be cancelled.</p>
        <p style="margin-bottom:5px"><strong>4.</strong> If any affiliated College admits any student not eligible for Under-Graduate or Post-Graduate Courses of this University and allows him/her to fill in the Examination Form, a penalty of Rs.5,000/- per student shall be imposed on the College and performance of the examination of such student shall be cancelled.</p>
        <p style="margin-bottom:5px"><strong>5.</strong> The same rule applies to the University Department, Centres/Schools. The Head of University department/Director of Recognise Institute will have to pay penalty as above in case not eligible candidate is allowed to fill in the University Examination form.</p>
      </div>
  </div>`;

  return page4 + page5;
}

/* ════════════════════════════════════════════════════
   FORM 4 — ANTI-RAGGING AFFIDAVIT (Matching New Image 1)
   ════════════════════════════════════════════════════ */

function renderForm4(d: PrintFormData): string {
  const s = d.student;
  const f = d.form4;
  const fullName = v(f.fullNameWithEnrollmentNo || `${v(s.fullNameSurname)} ${v(s.fullNameFirst)} ${v(s.fullNameFather)}`.trim());
  const studentName = fullName || "........................................................................................................................";
  const parentName = v(s.fullNameFather || s.fatherName || f.sonDaughterOf || "");
  const parentDisplay = parentName ? `Mr./Mrs./Ms. ${parentName}` : "Mr./Mrs./Ms................................................................";

  const affDateParts = formatAffidavitDateParts(f.declaredDay ? `${f.declaredYear || new Date().getFullYear()}-${f.declaredMonth || "01"}-${f.declaredDay}` : d.record.createdAt || Date.now());

  return `<div class="page-container">
    <!-- Header with Larger Title -->
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:18px;font-weight:bold">ANNEXURE I</div>
      <div style="font-size:22px;font-weight:bold;letter-spacing:0.5px;margin-top:4px">
        AFFIDAVIT BY THE STUDENT
      </div>
    </div>

    <!-- Clause 1 with Underlined College Name and Larger Body Text -->
    <div class="affidavit-clause" style="font-size:13.5px;line-height:1.75">
      <strong>1)</strong> I, <u style="padding:0 4px"><strong>${esc(studentName)}</strong></u><br/>
      <span style="font-size:11.5px;color:#333">(full name of student with admission/registration/enrolment number)</span><br/>
      S/o D/o <u style="padding:0 4px"><strong>${esc(parentDisplay)}</strong></u>, having been admitted to (name of the institution) <u style="padding:0 4px"><strong>Bhivarabai Sawant College of Engineering &amp; Research, Narhe, Pune-41</strong></u>, have received a copy of the UGC Regulations on Curbing the menace of Ragging in Higher Educational Institutions, 2009, (hereinafter called the "Regulations") carefully read and fully understood the provisions contained in the said Regulations.-
    </div>

    <!-- Clause 2 -->
    <div class="affidavit-clause" style="font-size:13.5px;line-height:1.75">
      <strong>2)</strong> I have, in particular, perused clause 3 of the Regulations and am aware as to what constitutes ragging.
    </div>

    <!-- Clause 3 -->
    <div class="affidavit-clause" style="font-size:13.5px;line-height:1.75">
      <strong>3)</strong> I have also, in particular, perused clause 7 and clause 9.1 of the Regulations and am fully aware of the penal and administrative action that is liable to be taken against me in case I am found guilty of or abetting ragging, actively or passively, or being part of a conspiracy to promote ragging.
    </div>

    <!-- Clause 4 -->
    <div class="affidavit-clause" style="font-size:13.5px;line-height:1.75">
      <strong>4)</strong> I hereby solemnly aver and undertake that
      <div style="margin-left:20px;margin-top:4px">
        a) I will not indulge in any behaviour or act that may be constituted as ragging under clause 3 of the Regulations.<br/>
        b) I will not participate in or abet or propagate through any act of commission or omission that may be constituted as ragging under clause 3 of the Regulations.
      </div>
    </div>

    <!-- Clause 5 -->
    <div class="affidavit-clause" style="font-size:13.5px;line-height:1.75">
      <strong>5)</strong> I hereby affirm that, if found guilty of ragging, I am liable punishment according to clause 9.1 of the Regulations, without prejudice to any other criminal action that may be taken against me under any penal law or any law for the time being in force.
    </div>

    <!-- Clause 6 -->
    <div class="affidavit-clause" style="font-size:13.5px;line-height:1.75;margin-bottom:18px">
      <strong>6)</strong> I hereby declare that I have not been expelled or debarred from admission in any institution in the country on account of being found guilty of,- abetting or being part of a conspiracy to promote, ragging, and further affirm that, in case the declaration is found to be untrue, I am aware that my admission is liable to be cancelled.
    </div>

    <!-- Declaration Date Fields Filled -->
    <div class="form-row" style="margin-top:16px;justify-content:flex-start;font-size:13px">
      <span class="form-label">Declared this</span>
      <span style="border-bottom:1.5px solid #000;padding:0 8px;font-weight:bold;min-width:60px;text-align:center">${affDateParts.dayOrdinal}</span>
      <span class="form-label" style="margin-left:6px">day of</span>
      <span style="border-bottom:1.5px solid #000;padding:0 8px;font-weight:bold;min-width:90px;text-align:center">${affDateParts.monthName}</span>
      <span class="form-label" style="margin-left:6px">Month of Year</span>
      <span style="border-bottom:1.5px solid #000;padding:0 8px;font-weight:bold;min-width:70px;text-align:center">${affDateParts.year}</span>,
    </div>

    <!-- Signature Pulled Down for Room to Sign -->
    <div style="text-align:right;margin-top:40px">
      <div class="signature-line" style="margin-left:auto">Signature of deponent</div>
      <div style="font-size:13px;font-weight:bold;margin-top:6px">Name: ${esc(studentName)}</div>
      <div style="font-size:11px;font-weight:bold;margin-top:2px">Mob: ${esc(s.mobileNo)}</div>
    </div>

    <!-- Verification Section -->
    <div style="margin-top:24px">
      <div style="text-align:center;font-weight:bold;font-size:15px;margin-bottom:6px">VERIFCATION</div>
      <div style="font-size:13px;line-height:1.65;text-align:justify">
        Verified that contents of this affidavit are true to best of my knowledge and no part of the affidavit is false and nothing has been concealed or misstated therein.
      </div>
    </div>

    <div class="form-row" style="margin-top:14px;font-size:13px">
      <span class="form-label">Verified at Place</span>
      <span style="border-bottom:1.5px solid #000;padding:0 8px;font-weight:bold;min-width:90px;text-align:center">${esc(f.verifiedAtPlace || "PUNE")}</span>
      <span class="form-label" style="margin-left:8px">on this</span>
      <span style="border-bottom:1.5px solid #000;padding:0 8px;font-weight:bold;min-width:60px;text-align:center">${affDateParts.dayOrdinal}</span>
      <span class="form-label" style="margin-left:6px">day of</span>
      <span style="border-bottom:1.5px solid #000;padding:0 8px;font-weight:bold;min-width:90px;text-align:center">${affDateParts.monthName}</span>
      <span class="form-label" style="margin-left:6px">Month of Year</span>
      <span style="border-bottom:1.5px solid #000;padding:0 8px;font-weight:bold;min-width:70px;text-align:center">${affDateParts.year}</span>,
    </div>

    <div style="text-align:right;margin-top:35px">
      <div class="signature-line" style="margin-left:auto">Signature of deponent</div>
      <div style="font-size:11px;font-weight:bold;margin-top:2px">Mob: ${esc(s.mobileNo)}</div>
    </div>

    <div style="margin-top:28px;font-size:12.5px;line-height:1.5">
      Solemnly affirmed and signed in my presence on this the day of month of year after reading the contents of this affidavit,
    </div>
    <div style="text-align:right;font-weight:bold;font-size:13.5px;margin-top:20px">
      OATH COMMISSIONER
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════════
   FORM 5 — LIBRARY + BANK (Matching New Images 3, 4, 5)
   ════════════════════════════════════════════════════ */

function renderForm5(d: PrintFormData): string {
  const s = d.student;
  const f = d.form5;
  const fullName = `${v(s.fullNameSurname)} ${v(s.fullNameFirst)} ${v(s.fullNameFather)}`.trim();
  const branch = v(f.branchDept || s.branchCourse || "");
  const dob = formatDate(s.dateOfBirth);
  const dobParts = dob.split("/");
  const dobDisplay = dobParts.length === 3 ? `${dobParts[0]}/${dobParts[1]}/${dobParts[2]}` : dob;
  const permanentAddr = v(f.permanentAddress || s.permanentAddress || s.correspondenceAddress || "");
  const localAddr = v(f.localAddress || s.correspondenceAddress || "");
  const permanentPin = v(f.permanentPin || s.permanentPin || s.correspondencePin || "");
  const localPin = v(s.correspondencePin || "");

  const classYear = String(f.yearLevel || "F.E.").toUpperCase();
  const hasDiplomaData = Boolean(
    (d.form1 && (d.form1.diplomaBranchCourse || d.form1.diplomaBteEnrollmentNo || d.form1.diplomaYearOfPassing)) ||
    String(s.admissionType) === "DSE" ||
    String(s.admissionType) === "DIPLOMA" ||
    String(f.yearLevel) === "DSY"
  );
  const diplomaType = hasDiplomaData ? (String(f.yearLevel) === "DSY" || String(s.admissionType) === "DSE" ? "DSY" : "FY") : "";
  const rawCat = String(f.castCategory || s.category || d.form1.admissionCategory || "");
  const catInfo = parseCategory(rawCat);

  // Page 7 — Library Membership Form (Exact Replica of New Image 3)
  const page7 = `<div class="page-container" style="padding:8mm 10mm">
    <div style="border:2px solid #000;padding:8mm 10mm;box-sizing:border-box;min-height:275mm">
      <!-- Center TSSM Logo Top -->
      <div style="text-align:center;margin-bottom:4px">
        <img src="/tssm-logo.png" alt="TSSM Logo" style="height:55px;object-fit:contain;margin:0 auto 2px;display:block"/>
        <div style="font-size:13px;font-weight:bold">The Shetkari Shikshan Mandal's</div>
        <div style="font-size:17px;font-weight:bold">Bhivarabai Sawant College of Engineering &amp; Research,</div>
        <div style="font-size:12px;font-weight:bold">Narhe, Pune – 41</div>
        <div style="font-size:15px;font-weight:bold;letter-spacing:0.5px;margin-top:3px">
          LIBRARY MEMBERSHIP FORM – STUDENT
        </div>
      </div>

      <div style="border-bottom:1.5px dashed #000;margin:6px 0 10px"></div>

      <!-- 1. Member Name -->
      <div class="form-row spaced">
        <span class="form-label bold" style="min-width:170px">1. Name of the Member:</span>
        <span class="form-value full" style="font-weight:900">${esc(fullName)}</span>
        <div style="font-size:10.5px;color:#000;width:100%;display:flex;justify-content:space-around;margin-top:1px">
          <span>(In CAPITAL)</span><span>(Surname)</span><span>(First name)</span><span>(Father name)</span>
        </div>
      </div>

      <!-- 2, 3, 4 -->
      <div class="form-row mt-8">
        <span class="form-label bold">2. Branch / Department:</span>
        <span class="form-value medium">${esc(branch)}</span>
        <span class="form-label bold" style="margin-left:10px">3. Year: F.E. / S.E. /M.E./Ph.D.</span>
        <span style="font-weight:bold;margin-left:4px"><u><strong>${esc(classYear)}</strong></u></span>
        <span class="form-label bold" style="margin-left:10px">4. Diploma (FY /DSY)</span>
        <span style="font-weight:bold;margin-left:4px">${diplomaType ? `<u><strong>${diplomaType}</strong></u>` : ""}</span>
      </div>

      <!-- 5. Permanent Address -->
      <div class="form-row mt-8">
        <span class="form-label bold">5. Permanent Address:</span>
        <span class="form-value">${esc(permanentAddr)}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-value" style="flex:1"></span>
        <span class="form-label bold" style="margin-left:15px">City:</span>
        <span class="form-value short">${esc(f.permanentCity || "PUNE")}</span>
        <span class="form-label bold" style="margin-left:20px">Pin Code:</span>
        <span class="form-value short">${esc(permanentPin)}</span>
      </div>

      <!-- 6. Local Address -->
      <div class="form-row mt-8">
        <span class="form-label bold">6. Local Address:</span>
        <span class="form-value">${esc(localAddr)}</span>
      </div>
      <div class="form-row mt-4">
        <span class="form-value" style="flex:1"></span>
        <span class="form-label bold" style="margin-left:15px">City:</span>
        <span class="form-value short">PUNE</span>
        <span class="form-label bold" style="margin-left:20px">Pin Code:</span>
        <span class="form-value short">${esc(localPin)}</span>
      </div>

      <!-- 7 -->
      <div class="form-row mt-8">
        <span class="form-label bold">7. E-Mail ID:</span>
        <span class="form-value lowercase">${esc(String(s.email || "").toLowerCase())}</span>
      </div>

      <!-- 8, 9, 10 -->
      <div class="form-row mt-8">
        <span class="form-label bold">8. Date of Birth:</span>
        <span style="font-weight:bold;margin:0 6px">${dobDisplay}</span>
        <span class="form-label bold" style="margin-left:15px">9. Gender: Male / Female</span>
        <span style="font-weight:bold;margin:0 4px"><u><strong>${esc(f.gender || s.gender || "")}</strong></u></span>
        <span class="form-label bold" style="margin-left:15px">10. Blood Group:</span>
        <span style="font-weight:bold;margin:0 6px">${esc(f.bloodGroup || s.bloodGroup || "")}</span>
      </div>

      <!-- 11 -->
      <div class="form-row mt-8">
        <span class="form-label bold">11. Student Mobile No:</span>
        <span class="form-value medium">${esc(f.studentMobileNo || s.mobileNo || "")}</span>
        <span class="form-label bold" style="margin-left:15px">Parents Tel. No:</span>
        <span class="form-value medium">${esc(f.parentsTelNo || (d.form5 && d.form5.parentsTelNo) || s.parentsTelNo || s.parentMobileNo || (d.form1 && (d.form1.contactTelNo || d.form1.permanentTelNo)) || s.correspondenceMobile || s.guardianMobileNo || s.fatherMobileNo || "")}</span>
      </div>

      <!-- 12. Cast Category Table with Tick (Matching New Image 3) -->
      <div style="margin-top:8px">
        <div class="form-label bold">12. Cast Category:</div>
        <table class="form-table" style="margin:4px 0">
          <thead><tr>
            <th>Open</th><th>SC</th><th>ST</th><th>VJ</th><th>NT 1</th><th>NT 2</th><th>NT 3</th><th>SBC</th><th>Other</th>
          </tr></thead>
          <tbody><tr>
            <td>${catInfo.code === "OPEN" ? "✓" : ""}</td>
            <td>${catInfo.code === "SC" ? "✓" : ""}</td>
            <td>${catInfo.code === "ST" ? "✓" : ""}</td>
            <td>${catInfo.isNTA ? "✓" : ""}</td>
            <td>${catInfo.isNTB ? "✓" : ""}</td>
            <td>${catInfo.isNTC ? "✓" : ""}</td>
            <td>${catInfo.isNTD ? "✓" : ""}</td>
            <td>${catInfo.code === "SBC" ? "✓" : ""}</td>
            <td>${!catInfo.isNTA && !catInfo.isNTB && !catInfo.isNTC && !catInfo.isNTD && catInfo.code !== "OPEN" && catInfo.code !== "SC" && catInfo.code !== "ST" && catInfo.code !== "SBC" ? "✓" : ""}</td>
          </tr></tbody>
        </table>
      </div>

      <!-- 13 & 14 -->
      <div class="form-row mt-8">
        <span class="form-label bold">13. Students Admission Receipt No.:</span>
        <span class="form-value medium">${esc(f.admissionReceiptNo || "")}</span>
        <span class="form-label bold" style="margin-left:20px">14. Admission Date:</span>
        <span class="form-value short">${escDate(f.admissionDate || d.record.createdAt)}</span>
      </div>

      <!-- Center Photo Box & Sign Box Below (Matching Image 3) -->
      <div style="margin:16px auto;text-align:center">
        <div style="width:160px;height:180px;border:2px solid #000;margin:0 auto;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:bold;font-size:12.5px;padding:10px">
          Passport size Colour Photograph
        </div>
        <div style="width:160px;height:42px;border:2px solid #000;margin:8px auto 0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:bold;font-size:11px">
          <span>Sign.</span>
          <span style="font-size:10px">Mob: ${esc(f.studentMobileNo || s.mobileNo || "")}</span>
        </div>
      </div>

      <!-- Bottom Row -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px">
        <div class="form-row">
          <span class="form-label bold">Date:</span>
          <span class="form-value short">${escDate(f.dateField || new Date())}</span>
        </div>
        <div style="font-weight:bold;font-size:12.5px">
          Admin. Officer / Accountant Sign. : ___________________
        </div>
      </div>

      <div style="border-bottom:1.5px dashed #000;margin:10px 0"></div>

      <!-- Library Use Box -->
      <div style="padding:4px 0">
        <div style="text-align:center;font-weight:bold;font-size:13px;margin-bottom:4px">*FOR LIBRARY USE ONLY*</div>
        <div class="form-row">
          <span class="form-label bold">(Library Membership / I-Card No.:</span>
          <span class="form-value medium" style="font-weight:900"></span>
          <span>)</span>
        </div>
        <div class="form-row mt-4" style="justify-content:space-between;align-items:flex-end">
          <div>
            <span class="form-label bold">::REMARK</span>
            <span class="form-value" style="width:280px"></span>
          </div>
          <div style="font-weight:bold;font-size:12.5px">Librarian Sign. : ___________________</div>
        </div>
      </div>
    </div>
  </div>`;

  // Page 8 — Library Rules & Regulations (Matching Reference Image 2)
  const page8 = `<div class="page-container" style="padding:8mm 10mm">
    <div style="border:2px solid #000;padding:8mm 10mm;box-sizing:border-box;min-height:275mm;display:flex;flex-direction:column;justify-content:space-between">
      <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div style="text-align:center;margin-bottom:18px">
            <div style="font-size:15px;font-weight:bold">The Shetkari Shikshan Mandal's</div>
            <div style="font-size:19.5px;font-weight:bold">Bhivarabai Sawant College of Engineering &amp; Research,</div>
            <div style="font-size:14px;font-weight:bold">Narhe, Pune – 41</div>
            <div style="font-size:17.5px;font-weight:bold;text-decoration:underline;margin-top:10px">
              LIBRARY RULES &amp; REGULATIONS FOR STUDENTS
            </div>
          </div>

          <div style="font-size:14.5px;line-height:1.7;color:#000;font-weight:500;margin-top:12px">
            <div class="rule-item" style="margin-bottom:7px"><strong>1.</strong> The library is primarily intended for the use by students and staff of this college.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>2.</strong> All the students are expected to maintain silence witile in the library.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>3.</strong> Personal belongings are not allowed inside stack room, reference section and digital library.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>4.</strong> Always consult the library staff for number of books can be issued on library card He / She will be responsible for the books borrowed on his/her card.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>5.</strong> Books will be issued only on production of borrower card. Card is not transferable. Books will be issued only to cardholder and not through anybody else.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>6.</strong> Students are not permitted to sit in library during their lecture and practical timing</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>7.</strong> Students should place the demand slips up to 4.00 pm and collect the books on same day.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>8.</strong> Books will be issued for one week (UG Student) &amp; two week (Poly and PG Student) at first instance. If the same book is required for longer period fresh demand slip will be filled up for renewal before the due date of return. The book may then reissue for another week if there is no demand from other students for the same book.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>9.</strong> A Fine of Rs. 1/-Per day and Per Book will be charged on expiry of return date.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>10.</strong> Current issues of journals/Magazines will not be issued to students outside the library. Back issues of certain Journals/Magazines may be issued for 3 days.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>11.</strong> Borrowers are requested to take every care of book &amp; will not write anything on the book.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>12.</strong> If during period of issue to a borrower any book is lost or damaged rendering it unserviceable, library staff can recover from the borrower a sum equal to the cost of obtaining another copy of book.</div>
            <div class="rule-item" style="margin-bottom:7px"><strong>13.</strong> In case of loss of library card duplicate library card can be issued but only once. There after no guarantee of issuing another library card &amp; student wouldn't have any objection.</div>
          </div>
        </div>

        <div>
          <div style="margin-top:24px;font-weight:bold;text-align:center;font-size:14.5px;line-height:1.6">
            I have read the rules and regulations and ready to follow the same.<br/>
            If any student lost the I-card then I-card will reissue with Rs. 200/- fine.
          </div>

          <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px">
            <div class="form-row" style="align-items:baseline;margin-bottom:0">
              <span class="form-label bold" style="font-size:14px">Date:</span>
              <span class="form-value short" style="font-size:14px;font-weight:900">${escDate(f.dateField || d.record.createdAt || new Date())}</span>
            </div>
            <div style="text-align:right">
              <span class="form-label bold" style="font-size:14px">Signature:________________________</span><br/>
              <span style="font-size:11.5px;font-weight:bold">Mob: ${esc(s.mobileNo)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // Page 9 — Bank Form
  const candidateName = v(s.fullNameFirst ? `${s.fullNameSurname || ""} ${s.fullNameFirst} ${s.fullNameFather || ""}`.trim() : fullName);
  const fatherName = v(s.fullNameFather || s.fatherName || "");
  const corrAddr = v(s.correspondenceAddress || "");
  const permAddr = v(s.permanentAddress || corrAddr);
  const gender = v(s.gender || "");
  const genderMarathi = gender === "MALE" ? "पुरुष" : gender === "FEMALE" ? "स्त्री" : gender;

  const page9 = `<div class="page-container marathi">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <div style="width:65px;height:65px;flex-shrink:0">
        <img src="/jayavant-bank.png" alt="Bank Logo" style="width:65px;height:65px;object-fit:contain" onerror="this.style.display='none'"/>
      </div>
      <div style="text-align:center;flex:1;padding:0 8px">
        <div style="font-size:20px;font-weight:bold;color:#000">जयवंत मल्टीस्टेट क्रेडिट को.ऑपरेटिव्ह सोसायटी लि.</div>
        <div style="font-size:11.5px;margin-top:2px">प्रधान कार्यालय- शिवाजीनगर, सोनारी-४१३५०५ ता. परंडा, जि उस्मानाबाद महाराष्ट्र</div>
        <div style="font-size:10.5px;color:#333">(नोंदणी क्रमांक एमएससीएस/ सीआर/५७५/२०१२)</div>
      </div>
      <div style="width:65px"></div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0 10px">
      <div style="border:2px solid #000;padding:3px 16px;background-color:#000;color:#fff;font-weight:bold;font-size:15px">
        नवीन खाते उघडण्याचा फॉर्म
      </div>
      <div style="border:1.5px solid #000;padding:3px 10px;font-size:12.5px;display:flex;align-items:center;gap:6px">
        <strong>खाते क्र.</strong>
        <span class="form-value short" style="text-align:center"></span>
      </div>
    </div>

    <div style="text-align:center;font-weight:bold;font-size:14px;margin:6px 0 10px">
      बचत / करंट / दैनंदिन ठेव / मुदत ठेव
    </div>

    <div class="form-row spaced">
      <span class="form-label bold">मा. व्यवस्थापक यांस, शाखा :</span>
      <span class="form-value medium" style="font-weight:bold"></span>
    </div>

    <div style="font-size:12px;line-height:1.6;text-align:justify;margin-bottom:10px">
      मी / आम्ही आपल्या बँकेत बचत / करंट / दैनंदिन ठेव / रिकरिंग / मुदत ठेव खाते उघडू इच्छितो, सदर खात्यात जमा होण्यासाठी मी / आम्ही या सोबत रक्कम रूपये
      <span class="form-value medium"></span> देत आहे / आहोत. मी / आम्ही सदर खात्याचे सर्व नियम वाचलेले असून ते नियम, त्यामध्ये होणाऱ्या दुरुस्त्यांसह माझ्यावर / आमच्यावर बंधनकारक राहतील.
    </div>

    <div style="border:1.5px solid #000;margin:10px 0">
      <div class="bank-applicant-row">
        <div class="form-row">
          <span class="form-label bold" style="width:140px">१) खातेदाराचे नाव :</span>
          <span class="form-value full" style="font-weight:900">${esc(candidateName)}</span>
        </div>
        <div class="form-row mt-4">
          <span class="form-label bold" style="width:140px">पत्ता-जवळच्या खुणेसह :</span>
          <span class="form-value full">${esc(corrAddr)}</span>
        </div>
        <div class="form-row mt-4">
          <span class="form-label bold" style="width:75px">PAN No. :</span>
          <span class="form-value medium">${esc(s.panNo || "")}</span>
          <span class="form-label bold" style="margin-left:25px;width:75px">फोन नं. :</span>
          <span class="form-value medium">${esc(s.mobileNo || "")}</span>
        </div>
      </div>

      <div class="bank-applicant-row">
        <div class="form-row">
          <span class="form-label bold" style="width:140px">२) खातेदाराचे नाव :</span>
          <span class="form-value full">${esc(fatherName)}</span>
        </div>
        <div class="form-row mt-4">
          <span class="form-label bold" style="width:140px">पत्ता-जवळच्या खुणेसह :</span>
          <span class="form-value full">${esc(permAddr)}</span>
        </div>
        <div class="form-row mt-4">
          <span class="form-label bold" style="width:75px">PAN No. :</span>
          <span class="form-value medium"></span>
          <span class="form-label bold" style="margin-left:25px;width:75px">फोन नं. :</span>
          <span class="form-value medium"></span>
        </div>
      </div>

      <div class="bank-applicant-row" style="border-bottom:none">
        <div class="form-row">
          <span class="form-label bold" style="width:140px">३) खातेदाराचे नाव :</span>
          <span class="form-value full"></span>
        </div>
        <div class="form-row mt-4">
          <span class="form-label bold" style="width:140px">पत्ता-जवळच्या खुणेसह :</span>
          <span class="form-value full"></span>
        </div>
        <div class="form-row mt-4">
          <span class="form-label bold" style="width:75px">PAN No. :</span>
          <span class="form-value medium"></span>
          <span class="form-label bold" style="margin-left:25px;width:75px">फोन नं. :</span>
          <span class="form-value medium"></span>
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-around;margin:16px 0">
      <div class="photo-box" style="width:95px;height:115px">१) फोटो (विद्यार्थी)</div>
      <div class="photo-box" style="width:95px;height:115px">२) फोटो (पालक)</div>
      <div class="photo-box" style="width:95px;height:115px;color:#666">३) फोटो</div>
    </div>

    <div style="display:flex;justify-content:space-around;align-items:center;margin-top:20px">
      <div style="text-align:center">
        <div class="signature-line">सही (१)</div>
        <div style="font-size:10px;font-weight:bold;margin-top:2px">Mob: ${esc(s.mobileNo)}</div>
      </div>
      <div style="text-align:center">
        <div class="signature-line">सही (२)</div>
        <div style="font-size:10px;font-weight:bold;margin-top:2px">Mob: ${esc(s.parentsTelNo || s.mobileNo)}</div>
      </div>
      <div style="width:140px;height:40px;border:1px solid #000;text-align:center;font-size:11px;padding-top:10px">सही (३)</div>
    </div>
  </div>`;

  // Page 10 — Bank Additional Details + Nominee Form
  const page10 = `<div class="page-container marathi">
    <div style="font-weight:bold;font-size:14px;margin-bottom:10px">खातेदाराची इतर माहिती :</div>

    <div class="form-row spaced">
      <span class="form-label bold">अ) व्यवसाय/धंदा :</span>
      <span class="form-value short">शिक्षण (STUDENT)</span>
      <span class="form-label bold" style="margin-left:25px">वार्षिक उत्पन्न रू. :</span>
      <span class="form-value medium">${esc(d.form1.annualIncomeOfParent || "")}</span>
    </div>

    <div class="form-row spaced">
      <span class="form-label bold">ब) व्यवसायाचा पूर्ण पत्ता :</span>
      <span class="form-value">${esc(corrAddr)}</span>
    </div>

    <div class="form-row spaced">
      <span class="form-label bold">क) जन्म तारीख :</span>
      <span style="font-weight:bold;margin:0 6px">${dobDisplay}</span>
      <span class="form-label bold" style="margin-left:15px">लिंग :</span>
      <span style="font-weight:bold;margin:0 6px">${genderMarathi}</span>
      <span class="form-label bold" style="margin-left:15px">नागरिकत्व :</span>
      <span style="font-weight:bold;margin:0 6px">${esc(f.nationality || d.form3.nationality || "INDIAN")}</span>
    </div>

    <div style="font-size:12px;line-height:1.5;margin:10px 0">
      <strong>ड) ओळख पत्राची कॉपी :</strong> आधारकार्ड [✓], पॅनकार्ड [✓], पासपोर्ट, ड्रायव्हिंग लायसन्स, मतदार ओळखपत्र, लाईटबील
    </div>

    <div style="border-bottom:1.5px solid #000;margin:16px 0"></div>

    <div style="border:1.5px solid #000;padding:10px 14px">
      <div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:6px">
        फॉर्म क्रमांक डीए १ (वारस नोंद फॉर्म)
      </div>
      <div style="font-size:12px;line-height:1.5;margin-bottom:10px">
        मी / आम्ही (नाव व पत्ता): <strong>${esc(candidateName)}</strong><br/>
        जयवंत मल्टीस्टेट क्रेडिट को.ऑपरेटिव्ह सोसायटी मर्यादित शाखेतील माझे/आमचे नावे असलेल्या ठेवीच्या रकमा माझे/आमचे मृत्युनंतर स्वीकारण्याचा अधिकार खालील नमूद केलेल्या व्यक्तींना हक्कधारक म्हणून देत आहोत.
      </div>

      <table class="form-table">
        <thead><tr>
          <th style="width:30%">नामनिर्देशित व्यक्तिचे नाव व पत्ता</th>
          <th style="width:25%">ठेवीदाराशी नाते</th>
          <th style="width:15%">वय</th>
          <th style="width:30%">अज्ञान असल्यास जन्मतारीख व पालक</th>
        </tr></thead>
        <tbody><tr>
          <td><span class="val">${esc(f.nomineeName || "")}</span></td>
          <td><span class="val">${esc(f.nomineeRelation || "")}</span></td>
          <td><span class="val">${esc(f.nomineeAge || "")}</span></td>
          <td><span class="val">${esc(f.nomineeGuardian || "")}</span></td>
        </tr></tbody>
      </table>

      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px">
        <div class="form-row">
          <span class="form-label bold">ठिकाण :</span>
          <span class="form-value short">पुणे</span>
          <span class="form-label bold" style="margin-left:12px">तारीख :</span>
          <span class="form-value short">${escDate(f.dateField || new Date())}</span>
        </div>
        <div class="signature-line">ठेवीदाराची सही / अंगठा</div>
      </div>
    </div>

    <div style="border:1.5px solid #000;padding:10px;margin-top:16px;display:flex;justify-content:space-around;text-align:center;font-size:12.5px;font-weight:bold">
      <div>
        खाते सुरू करावे.<br/>
        <span style="font-size:10.5px;font-weight:normal">व्यवस्थापक/ अकौंटंट</span>
      </div>
      <div>
        खाते उघडून घेतले.<br/>
        <span style="font-size:10.5px;font-weight:normal">व्यवस्थापक / अधिकारी</span>
      </div>
    </div>
  </div>`;

  return page7 + page8;
}

/* ════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════ */

export function renderPrintHtml(data: PrintFormData): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Scholaris — Admission Forms</title>
<style>${PRINT_STYLES}</style>
</head><body>
${renderForm1(data)}
${renderForm2(data)}
${renderForm3(data)}
${renderForm4(data)}
${renderForm5(data)}
</body></html>`;
}
