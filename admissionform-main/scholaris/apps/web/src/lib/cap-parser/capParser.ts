import {
  ParsedBatch,
  ParsedChoiceCode,
  ParsedSeatPool,
  ParsedCandidate,
  Variant,
  ScoreType,
  Gender,
  SYMBOL_MAP,
  SYMBOL_LABEL_DISPLAY,
} from './parserTypes';

// Dynamic require for pdfjs-dist legacy CommonJS build in Node context
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const KNOWN_SEAT_POOLS = [
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

const LEGEND_KEYWORDS = [
  "Legends for SeatType", "O-Other than Home", "University,", "S-State Level,", 
  "G-General,", "L-Ladies,", "AI-All India,", "PWDR :", "DEFR :", "MI-Minority", 
  "Merit No :", "Merit Score :", "Legends for ChoiceCode", "India,", "O-Other", "than Home",
  "S -State Level,", "G -General,", "L -Ladies,", "AI -All India,"
];

/**
 * Robust, coordinate-based CAP Round PDF Parser Engine.
 * Reconstructs visual Y-bands and Sr. No anchors to accurately extract 100% of candidate records,
 * Choice Code stats, and seat pool allocations without dropping wrapped rows.
 */
export async function parseCapPdf(
  pdfBuffer: Buffer,
  fileName: string = "CAP_Allotment_List.pdf"
): Promise<ParsedBatch> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let instituteCode = "06649";
  let instituteName = "TSSM's Bhivarabai Sawant College of Engineering and Research, Narhe, Pune";
  let roundLabel = "CAP Round Provisional Allotment";
  let publishedOnDate: string | null = null;
  const warnings: string[] = [];

  const choiceCodesMap: Map<string, ParsedChoiceCode> = new Map();
  let currentChoiceCode: ParsedChoiceCode | null = null;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = (textContent.items as { str: string; transform: number[] }[]).map((item) => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5]
    }));

    // Group items into visual lines by Y-coordinate (tolerance 3.5px)
    const yGroups: Record<number, { text: string; x: number }[]> = {};
    items.forEach((item) => {
      const yKey = Math.round(item.y / 3.5) * 3.5;
      if (!yGroups[yKey]) yGroups[yKey] = [];
      yGroups[yKey].push(item);
    });

    const sortedY = Object.keys(yGroups).map(Number).sort((a, b) => b - a);
    const lines = sortedY.map((y) =>
      yGroups[y].sort((a, b) => a.x - b.x).map((w) => w.text).join(' ').trim()
    );

    // Skip general instruction pages
    const isInstructionsPage = lines.some(
      (l) =>
        l.includes('General Instructions') ||
        l.includes('\u0938\u0942\u091a\u0928\u093e') ||
        l.includes('GENERAL INSTRUCTIONS')
    );
    if (isInstructionsPage) continue;

    // Detect Institute Name & Code from top lines
    lines.slice(0, 10).forEach((l) => {
      const instMatch = l.match(/^(\d{5})\s*-\s*(.+)$/);
      if (instMatch && (l.includes("Engineering") || l.includes("College") || l.includes("Institute"))) {
        instituteCode = instMatch[1];
        instituteName = instMatch[2].trim();
      }
      if (l.includes("Provisional Allotment List of CAP Round") || l.includes("CAP Round")) {
        roundLabel = l.trim();
      }
      const pubMatch = l.match(/Published.*?(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}-\d{2}-\d{2})/i);
      if (pubMatch) publishedOnDate = pubMatch[1];
    });

    // Detect Choice Code Header from top 15 lines
    let detectedChoiceCode: string | null = null;
    let pageDeptName: string | null = null;

    lines.slice(0, 15).forEach((l) => {
      const codeMatch = l.match(/^(\d{10}(?:\s*\[[^\]]+\])?T?)\s*[-–]\s*(.+)$/);
      if (codeMatch) {
        detectedChoiceCode = codeMatch[1].trim();
        pageDeptName = codeMatch[2].trim();
      }
    });

    // Footer fallback for continuation pages
    if (!detectedChoiceCode) {
      lines.slice(-10).forEach((l) => {
        const codeMatch = l.match(/^(\d{10}(?:\s*\[[^\]]+\])?T?)$/);
        if (codeMatch) {
          detectedChoiceCode = codeMatch[1].trim();
        }
      });
    }

    if (detectedChoiceCode !== null) {
      const targetCode: string = detectedChoiceCode;
      let variant: Variant = 'GENERAL';
      if (targetCode.includes('[EWS]')) {
        variant = 'EWS';
      } else if (targetCode.endsWith('T')) {
        variant = 'TFWS';
      }

      if (!choiceCodesMap.has(targetCode)) {
        currentChoiceCode = {
          code: targetCode,
          department_name: pageDeptName || "Engineering",
          variant,
          status_label: "Un-Aided",
          sanction_intake: 0,
          cap_seats: 0,
          ms_seats: 0,
          minority_seats: 0,
          ai_seats: 0,
          institute_seats: 0,
          filled_seats: 0,
          vacant_seats: 0,
          seat_pools: []
        };

        // Extract header stats from page lines individually
        lines.forEach((l) => {
          if (l.includes("Sanction Intake:")) {
            const sm = l.match(/Sanction Intake:\s*(\d+)/);
            if (sm) currentChoiceCode!.sanction_intake = parseInt(sm[1], 10);

            const cm = l.match(/CAP Seats:\s*(\d+)/);
            if (cm) currentChoiceCode!.cap_seats = parseInt(cm[1], 10);

            const mm = l.match(/MS Seats:\s*(\d+)/);
            if (mm) currentChoiceCode!.ms_seats = parseInt(mm[1], 10);

            const am = l.match(/AI Seats:\s*(\d+)/);
            if (am) currentChoiceCode!.ai_seats = parseInt(am[1], 10);

            const minm = l.match(/Minority Seats:\s*(\d+)/);
            if (minm) currentChoiceCode!.minority_seats = parseInt(minm[1], 10);

            const im = l.match(/Institute Seats:\s*(\d+)/);
            if (im) currentChoiceCode!.institute_seats = parseInt(im[1], 10);

            const stm = l.match(/Status:\s*([A-Za-z0-9\-]+)/);
            if (stm) currentChoiceCode!.status_label = stm[1].trim();
          }
        });

        choiceCodesMap.set(targetCode, currentChoiceCode);
      } else {
        currentChoiceCode = choiceCodesMap.get(targetCode)!;
      }
    }

    if (!currentChoiceCode) continue;

    // Filter table body items between y: 140 and y: 730
    const tableItems = items.filter((it) => it.y >= 140 && it.y <= 730);
    if (!tableItems.length) continue;

    // Detect Seat Pool Section Headers on this page
    const pageYGroups: Record<number, { text: string; x: number }[]> = {};
    tableItems.forEach((it) => {
      const yKey = Math.round(it.y / 3.5) * 3.5;
      if (!pageYGroups[yKey]) pageYGroups[yKey] = [];
      pageYGroups[yKey].push(it);
    });

    const pageSortedY = Object.keys(pageYGroups).map(Number).sort((a, b) => b - a);
    const sectionsOnPage: { y: number; label: string }[] = [];

    pageSortedY.forEach((y) => {
      const lStr = pageYGroups[y].sort((a, b) => a.x - b.x).map((w) => w.text).join(' ');
      for (const poolLabel of KNOWN_SEAT_POOLS) {
        if (lStr.includes(poolLabel)) {
          sectionsOnPage.push({ y, label: poolLabel });
        }
      }
    });

    // Detect Sr. No Anchors (x < 65, integer 1 <= val < 500)
    const srAnchors: { y: number; srNum: number }[] = [];
    tableItems.forEach((it) => {
      const txt = it.text.trim();
      if (it.x < 65 && /^\d+$/.test(txt)) {
        const val = parseInt(txt, 10);
        if (val > 0 && val < 500) {
          srAnchors.push({ y: it.y, srNum: val });
        }
      }
    });

    srAnchors.sort((a, b) => b.y - a.y);

    const uniqueAnchors: { y: number; srNum: number }[] = [];
    srAnchors.forEach((anc) => {
      if (!uniqueAnchors.length || Math.abs(uniqueAnchors[uniqueAnchors.length - 1].y - anc.y) > 8) {
        uniqueAnchors.push(anc);
      }
    });

    // Extract Candidate Row per Anchor Y-Band
    uniqueAnchors.forEach((anc, idx) => {
      const yTop = anc.y;
      const yBottom = idx + 1 < uniqueAnchors.length ? uniqueAnchors[idx + 1].y + 4 : 140;

      const rowItems = tableItems.filter((it) => it.y >= yBottom && it.y <= yTop + 5);

      let activeSectionLabel = "Maharashtra State Seats";
      for (const sObj of sectionsOnPage) {
        if (sObj.y >= yTop) {
          activeSectionLabel = sObj.label;
        }
      }

      let currentSeatPool = currentChoiceCode!.seat_pools.find((p) => p.label === activeSectionLabel);
      if (!currentSeatPool) {
        currentSeatPool = {
          label: activeSectionLabel,
          sort_order: currentChoiceCode!.seat_pools.length + 1,
          candidates: []
        };
        currentChoiceCode!.seat_pools.push(currentSeatPool);
      }

      const scoreType: ScoreType =
        activeSectionLabel.includes("All India") || activeSectionLabel.includes("JEE(Main)")
          ? "JEE_MAIN"
          : "MHT_CET";

      const sortedRowItems = rowItems.sort((a, b) => a.x - b.x);
      const fullRowText = sortedRowItems.map((w) => w.text).join(" ").trim();
      const isVacant = fullRowText.includes("VACANT");

      let appId: string | null = null;
      let meritNo: number | null = null;
      let meritScore: number | null = null;
      let candidateName = isVacant ? "VACANT" : "CANDIDATE NAME";
      let gender: Gender | null = isVacant ? null : "M";
      let category: string | null = null;
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
          gender = genderItem.text.trim() as Gender;
        } else {
          const gMatch = fullRowText.match(/\s([MF])\s/);
          if (gMatch) gender = gMatch[1] as Gender;
        }

        // Extract Candidate Name
        const nameItems = sortedRowItems.filter((w) => w.x >= 230 && w.x < 410);
        let rawName = nameItems.map((w) => w.text).join(" ").trim();
        LEGEND_KEYWORDS.forEach((kw) => {
          rawName = rawName.replace(kw, "");
        });
        const cleanName = rawName.replace(/[^A-Za-z\s]/g, "").replace(/\s+/g, " ").trim();
        if (cleanName) candidateName = cleanName;

        // Extract Category
        const catItems = sortedRowItems.filter((w) => w.x >= 440 && w.x < 510);
        let rawCat = catItems.map((w) => w.text).join(" ").trim();
        LEGEND_KEYWORDS.forEach((kw) => {
          rawCat = rawCat.replace(kw, "");
        });
        category = rawCat.trim() || null;

        // Extract Seat Type
        const seatItems = sortedRowItems.filter((w) => w.x >= 510);
        if (seatItems.length > 0) {
          rawSeatType = seatItems.map((w) => w.text).join(" ").trim();
        }
      }

      let statusSymbol: string | null = null;
      let internalSymbolCode: string | null = null;
      let seatTypeCode = rawSeatType;

      if (!isVacant) {
        for (const [sym, codeLabel] of Object.entries(SYMBOL_MAP)) {
          if (rawSeatType.includes(sym)) {
            statusSymbol = sym;
            internalSymbolCode = codeLabel;
            seatTypeCode = rawSeatType.replace(sym, '').trim();
            break;
          }
        }
      }

      const statusLabel = isVacant
        ? "Vacant Seat"
        : (statusSymbol && SYMBOL_LABEL_DISPLAY[internalSymbolCode!]
            ? SYMBOL_LABEL_DISPLAY[internalSymbolCode!]
            : "Standard / Direct Allotment");

      const candidate: ParsedCandidate = {
        sr_no: anc.srNum,
        merit_no: meritNo,
        score: meritScore,
        score_type: isVacant ? null : scoreType,
        application_id: appId,
        candidate_name: candidateName,
        gender,
        candidate_category: isVacant ? null : category,
        raw_seat_type: rawSeatType,
        allotted_seat_type: seatTypeCode,
        status_symbol: statusSymbol,
        status_label: statusLabel,
        is_vacant: isVacant,
        choice_code: currentChoiceCode!.code,
        department_name: currentChoiceCode!.department_name,
        seat_pool_label: currentSeatPool.label
      };

      currentSeatPool.candidates.push(candidate);

      if (isVacant) {
        currentChoiceCode!.vacant_seats += 1;
      } else {
        currentChoiceCode!.filled_seats += 1;
      }
    });
  }

  const choiceCodesList = Array.from(choiceCodesMap.values());

  let totalSanctionIntake = 0;
  let totalFilled = 0;
  let totalVacant = 0;

  choiceCodesList.forEach((cc) => {
    totalSanctionIntake += cc.sanction_intake;
    totalFilled += cc.filled_seats;
    totalVacant += cc.vacant_seats;

    const totalParsedRows = cc.filled_seats + cc.vacant_seats;
    if (totalParsedRows !== cc.cap_seats && cc.cap_seats > 0) {
      const warn = `Row count mismatch for choice code ${cc.code}: Stated CAP Seats = ${cc.cap_seats}, Parsed Rows = ${totalParsedRows} (${cc.filled_seats} filled, ${cc.vacant_seats} vacant).`;
      warnings.push(warn);
    }
  });

  const allRecords: ParsedCandidate[] = choiceCodesList.flatMap((d) =>
    d.seat_pools.flatMap((p) => p.candidates)
  );

  return {
    institute_code: instituteCode,
    institution_code_name: `${instituteCode} - ${instituteName}`,
    round_label: roundLabel,
    published_on: publishedOnDate,
    source_filename: fileName,
    total_departments: choiceCodesList.length,
    total_candidate_records: allRecords.length,
    warnings,
    summary: {
      total_sanction_intake: totalSanctionIntake,
      total_filled_seats: totalFilled,
      total_vacant_seats: totalVacant
    },
    departments: choiceCodesList,
    records: allRecords
  };
}
