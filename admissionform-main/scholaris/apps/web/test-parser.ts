import fs from 'fs';
import path from 'path';
import { parseCapPdf } from './src/lib/cap-parser/capParser';

async function runParserTest() {
  console.log("=== Testing CAP PDF Parser in web app against CAP Allotment PDFs ===");

  const candidatePaths = [
    `C:\\Users\\Prateek pandey\\Desktop\\Scholaris Doc full\\cap_round_parser-main\\CAPR-II_06649.pdf`,
    `C:\\Users\\Prateek pandey\\Desktop\\Scholaris Doc full\\CAPR-IV_06649.pdf`,
    `C:\\Users\\Prateek pandey\\Desktop\\Scholaris Doc full\\CAPR-II_01002.pdf`
  ];

  let finalPath = '';
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      finalPath = p;
      break;
    }
  }

  if (!finalPath) {
    console.error(`Error: Sample PDF not found`);
    process.exit(1);
  }

  console.log(`Using PDF at: ${finalPath}`);
  const pdfBuffer = fs.readFileSync(finalPath);
  const result = await parseCapPdf(pdfBuffer, path.basename(finalPath));

  console.log(`\n--- Parser Summary ---`);
  console.log(`Institute Code: ${result.institute_code}`);
  console.log(`Institution Code Name: ${result.institution_code_name}`);
  console.log(`Round Label: ${result.round_label}`);
  console.log(`Total Choice Codes / Departments Extracted: ${result.total_departments}`);
  console.log(`Total Candidate Records: ${result.total_candidate_records}`);
  console.log(`Total Filled Seats: ${result.summary.total_filled_seats}`);
  console.log(`Total Vacant Seats: ${result.summary.total_vacant_seats}`);
  console.log(`Reconciliation Warnings: ${result.warnings.length}`);

  if (result.warnings.length > 0) {
    console.log(`Warnings:`);
    result.warnings.forEach(w => console.warn(`  - ${w}`));
  }

  console.log(`\n--- Extracted Choice Codes / Departments ---`);
  result.departments.forEach(cc => {
    console.log(`Choice Code ${cc.code} (${cc.department_name} - ${cc.variant}):`);
    console.log(`  CAP Seats: ${cc.cap_seats} | Filled: ${cc.filled_seats} | Vacant: ${cc.vacant_seats}`);
  });

  // Verify target candidate record EN25310243 if present
  const targetCand = result.records.find(c => c.application_id === 'EN25310243');
  if (targetCand) {
    console.log(`\n--- Verified Target Record EN25310243 ---`);
    console.log(JSON.stringify(targetCand, null, 2));
  } else {
    console.log(`\nSample Candidate Record:`);
    console.log(JSON.stringify(result.records[0], null, 2));
  }
}

runParserTest().catch(console.error);
