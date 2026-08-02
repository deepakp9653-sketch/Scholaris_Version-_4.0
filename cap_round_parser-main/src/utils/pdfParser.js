import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker using unpkg CDN
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
} catch (e) {
  console.warn("Could not set PDF worker URL:", e);
}

const SYMBOL_MAP = {
  '*': 'Betterment in Choice Code',
  '@': 'Betterment in Seat Type',
  '~': 'No Change',
  '^': 'Admitted to Institute',
  '&': 'Newly Allotted'
};

const KNOWN_SECTIONS = [
  "Home University Seats Allotted to Home University Candidates",
  "Home University Seats Allotted to Other Than Home University Candidates",
  "Other Than Home University Seats Allotted to Other Than Home University Candidates",
  "Other Than Home University Seats Allotted to Home University Candidates",
  "All India Seats Allotted to All India Candidature Candidates with JEE(Main) Score",
  "Economically Weaker Section Seats",
  "ORPHAN Seats",
  "State Level Seats",
  "Tuition Fee Waiver Seats"
];

const LEGEND_STRINGS = [
  "Legends for SeatType", "O-Other than Home", "University,", "S-State Level,", 
  "G-General,", "L-Ladies,", "AI-All India,", "PWDR :", "DEFR :", "MI-Minority", 
  "Merit No :", "Merit Score :", "Legends for ChoiceCode", "India,", "O-Other", "than Home"
];

/**
 * Parse an MHT-CET CAP Allotment PDF ArrayBuffer and extract clean metadata, departments, and table records.
 */
export async function parseCapPdfArrayBuffer(arrayBuffer, fileName = "Uploaded_Allotment_List.pdf") {
  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });
  
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let pageMeta = [];
  let deptMap = {};
  let currentChoiceCode = null;
  let currentDeptName = null;
  let instCodeName = "06649 - TSSM's Bhivarabai Sawant College of Engineering and Research, Narhe, Pune";

  // First Pass: Extract Page Text & Choice Code Header Blocks
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const items = textContent.items.map(item => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5]
    }));

    const yGroups = {};
    items.forEach(item => {
      const yKey = Math.round(item.y / 4.0) * 4.0;
      if (!yGroups[yKey]) yGroups[yKey] = [];
      yGroups[yKey].push(item);
    });

    const sortedY = Object.keys(yGroups).map(Number).sort((a, b) => b - a);
    const lines = sortedY.map(y => yGroups[y].sort((a, b) => a.x - b.x).map(w => w.text).join(' '));

    lines.slice(0, 10).forEach(l => {
      if (l.match(/\d{5}\s*-\s*.+ Engineering/i) || l.includes("College of Engineering") || l.includes("Institute")) {
        if (!l.match(/^(06649[0-9T]+)/)) {
          instCodeName = l.trim();
        }
      }
    });

    let headerCode = null;
    let headerName = null;
    lines.slice(0, 15).forEach(l => {
      const m = l.match(/^(06649[0-9T]+(?:\s*\[[^\]]+\])?)\s*-\s*(.+)$/);
      if (m) {
        headerCode = m[1].trim();
        headerName = m[2].trim();
      }
    });

    let footerCode = null;
    lines.slice(-10).forEach(l => {
      const m = l.match(/^(06649[0-9T]+(?:\s*\[[^\]]+\])?)$/);
      if (m) {
        footerCode = m[1].trim();
      }
    });

    if (headerCode) {
      currentChoiceCode = headerCode;
      currentDeptName = headerName;
    } else if (footerCode) {
      currentChoiceCode = footerCode;
    }

    if (headerCode && !deptMap[headerCode]) {
      let sanctionIntake = 60;
      let capSeats = 60;
      let msSeats = 51;
      let aiSeats = 9;
      let minoritySeats = 0;
      let instSeats = 0;
      let status = "Un-Aided";

      lines.forEach((l) => {
        if (l.includes("Sanction Intake:")) {
          const m = l.match(/Sanction Intake:\s*(\d+)/);
          if (m) sanctionIntake = parseInt(m[1], 10);
        }
        if (l.includes("Status:")) {
          status = l.replace("Status:", "").trim();
        }
      });

      lines.forEach((l, idx) => {
        if (l.includes("Sanction Intake:")) {
          const nums = [];
          for (let offset = 1; offset <= 12; offset++) {
            if (idx + offset < lines.length) {
              const val = lines[idx + offset].trim();
              if (/^\d+$/.test(val)) nums.push(parseInt(val, 10));
            }
          }
          if (nums.length >= 5) {
            capSeats = nums[0];
            msSeats = nums[1];
            aiSeats = nums[2];
            minoritySeats = nums[3];
            instSeats = nums[4];
          }
        }
      });

      deptMap[headerCode] = {
        institute_code_name: instCodeName,
        department_name: currentDeptName,
        choice_code: headerCode,
        status,
        sanction_intake: sanctionIntake,
        cap_seats: capSeats,
        ms_seats: msSeats,
        minority_seats: minoritySeats,
        ai_seats: aiSeats,
        institute_seats: instSeats,
        total_filled_seats: 0,
        total_vacant_seats: 0,
        status_breakdown: {
          "Betterment in Choice Code": 0,
          "Betterment in Seat Type": 0,
          "No Change": 0,
          "Admitted to Institute": 0,
          "Newly Allotted": 0,
          "Standard / Direct Allotment": 0,
          "Vacant": 0
        }
      };
    }

    pageMeta.push({
      pageNum,
      choiceCode: currentChoiceCode,
      deptName: currentDeptName,
      items
    });
  }

  // Second Pass: Candidate Table Row Extraction
  let candidateRecords = [];

  for (let pMeta of pageMeta) {
    const { pageNum, choiceCode, deptName, items } = pMeta;
    const deptObj = deptMap[choiceCode];

    // Filter table items inside boundaries (y >= 140 and y <= 730)
    const tableItems = items.filter(it => it.y >= 140 && it.y <= 730);
    if (!tableItems.length) continue;

    const yLinesMap = {};
    tableItems.forEach(it => {
      const yKey = Math.round(it.y / 3.0) * 3.0;
      if (!yLinesMap[yKey]) yLinesMap[yKey] = [];
      yLinesMap[yKey].push(it);
    });

    const sortedY = Object.keys(yLinesMap).map(Number).sort((a, b) => b - a);
    const sectionsOnPage = [];

    sortedY.forEach(y => {
      const lStr = yLinesMap[y].sort((a, b) => a.x - b.x).map(w => w.text).join(' ');
      for (let sec of KNOWN_SECTIONS) {
        if (lStr.includes(sec)) {
          sectionsOnPage.push({ y, sec });
        }
      }
    });

    const srAnchors = [];
    tableItems.forEach(it => {
      if (it.x < 65 && /^\d+$/.test(it.text.trim())) {
        srAnchors.push({ y: it.y, srNum: parseInt(it.text.trim(), 10) });
      }
    });

    srAnchors.sort((a, b) => b.y - a.y);

    const uniqueAnchors = [];
    srAnchors.forEach(anc => {
      if (!uniqueAnchors.length || Math.abs(uniqueAnchors[uniqueAnchors.length - 1].y - anc.y) > 8) {
        uniqueAnchors.push(anc);
      }
    });

    uniqueAnchors.forEach((anc, idx) => {
      const yTop = anc.y;
      const yBottom = idx + 1 < uniqueAnchors.length ? uniqueAnchors[idx + 1].y + 4 : 140;

      const rowItems = tableItems.filter(it => it.y >= yBottom && it.y <= yTop + 5);

      let activeSection = "Maharashtra State Seats";
      for (let sObj of sectionsOnPage) {
        if (sObj.y >= yTop) {
          activeSection = sObj.sec;
        }
      }

      const sortedRowItems = rowItems.sort((a, b) => a.x - b.x);
      const fullRowText = sortedRowItems.map((w) => w.text).join(" ").trim();
      const isVacant = fullRowText.includes("VACANT");

      let appId = isVacant ? "VACANT" : "VACANT";
      let meritNo = null;
      let meritScore = null;
      let candidateName = isVacant ? "VACANT" : "CANDIDATE NAME";
      let gender = isVacant ? null : "M";
      let category = null;
      let rawSeatType = isVacant ? "VACANT" : "GOPENH";

      if (!isVacant) {
        // Extract Application ID (e.g. EN26326199)
        const appMatch = fullRowText.match(/\b([A-Z]{2}\d{8}|EN\d+|DSE\d+|MB\d+|MC\d+)\b/i);
        if (appMatch) {
          appId = appMatch[1].toUpperCase();
        }

        // Extract Score (e.g. 80.4716144)
        const scoreMatch = fullRowText.match(/\b(\d{1,3}\.\d{4,})\b/);
        if (scoreMatch) {
          meritScore = parseFloat(scoreMatch[1]);
        } else {
          const fallbackScoreMatch = fullRowText.match(/\b(\d{2,3}\.\d+)\b/);
          if (fallbackScoreMatch) meritScore = parseFloat(fallbackScoreMatch[1]);
        }

        // Extract Merit No (Integer e.g. 81340)
        const numbers = fullRowText.match(/\b\d+\b/g) || [];
        for (const numStr of numbers) {
          const val = parseInt(numStr, 10);
          if (
            val !== anc.srNum &&
            val > 0 &&
            val < 500000 &&
            !fullRowText.includes(`.${numStr}`) &&
            (!appId || !appId.includes(numStr))
          ) {
            meritNo = val;
            break;
          }
        }

        // Extract Gender ('F' or 'M')
        const genderItem = sortedRowItems.find(
          (w) => w.x >= 400 && w.x <= 450 && (w.text.trim() === "F" || w.text.trim() === "M")
        );
        if (genderItem) {
          gender = genderItem.text.trim();
        } else {
          const gMatch = fullRowText.match(/\s([MF])\s/);
          if (gMatch) gender = gMatch[1];
        }

        // Extract Candidate Name
        const nameItems = sortedRowItems.filter((w) => w.x >= 230 && w.x < 410);
        let rawName = nameItems.map((w) => w.text).join(" ").trim();
        LEGEND_STRINGS.forEach((kw) => {
          rawName = rawName.replace(kw, "");
        });
        const cleanName = rawName.replace(/[^A-Za-z\s]/g, "").replace(/\s+/g, " ").trim();
        if (cleanName) candidateName = cleanName;

        // Extract Category
        const catItems = sortedRowItems.filter((w) => w.x >= 440 && w.x < 510);
        let rawCat = catItems.map((w) => w.text).join(" ").trim();
        LEGEND_STRINGS.forEach((kw) => {
          rawCat = rawCat.replace(kw, "");
        });
        category = rawCat.trim() || null;

        // Extract Seat Type
        const seatItems = sortedRowItems.filter((w) => w.x >= 510);
        if (seatItems.length > 0) {
          rawSeatType = seatItems.map((w) => w.text).join(" ").trim();
        }
      }

      let statusSymbol = null;
      let statusLabel = isVacant ? "Vacant" : "Standard / Direct Allotment";
      let allottedSeatType = rawSeatType;

      if (!isVacant) {
        for (let [sym, lbl] of Object.entries(SYMBOL_MAP)) {
          if (rawSeatType.includes(sym)) {
            statusSymbol = sym;
            statusLabel = lbl;
            allottedSeatType = rawSeatType.replace(sym, '').trim();
            break;
          }
        }
      }

      const scoreType = (activeSection.includes("JEE(Main)") || activeSection.includes("All India")) ? "JEE(Main)" : "MHT-CET";

      const record = {
        department_name: deptObj ? deptObj.department_name : (deptName || "Engineering"),
        choice_code: choiceCode || "0664919110",
        section_type: activeSection,
        sr_no: anc.srNum,
        merit_no: meritNo,
        score_type: scoreType,
        merit_score: meritScore,
        application_id: appId,
        candidate_name: candidateName,
        gender,
        candidate_category: category,
        raw_seat_type: rawSeatType,
        allotted_seat_type: allottedSeatType,
        status_symbol: statusSymbol,
        status_label: statusLabel,
        is_vacant: isVacant
      };

      candidateRecords.push(record);

      if (deptObj) {
        if (isVacant) {
          deptObj.status_breakdown["Vacant"] = (deptObj.status_breakdown["Vacant"] || 0) + 1;
        } else {
          deptObj.total_filled_seats += 1;
          deptObj.status_breakdown[statusLabel] = (deptObj.status_breakdown[statusLabel] || 0) + 1;
        }
      }
    });
  }

  const departmentsList = Object.values(deptMap);
  departmentsList.forEach(d => {
    d.total_vacant_seats = Math.max(0, d.sanction_intake - d.total_filled_seats);
  });

  const totalSanctionIntake = departmentsList.reduce((acc, d) => acc + d.sanction_intake, 0);
  const totalFilledSeats = departmentsList.reduce((acc, d) => acc + d.total_filled_seats, 0);
  const totalVacantSeats = departmentsList.reduce((acc, d) => acc + d.total_vacant_seats, 0);

  return {
    metadata: {
      institution_code_name: instCodeName,
      document_title: fileName,
      parsed_date: new Date().toISOString().split('T')[0],
      total_departments: departmentsList.length,
      total_candidate_records: candidateRecords.length,
      summary: {
        total_sanction_intake: totalSanctionIntake,
        total_filled_seats: totalFilledSeats,
        total_vacant_seats: totalVacantSeats
      }
    },
    departments: departmentsList,
    records: candidateRecords
  };
}
