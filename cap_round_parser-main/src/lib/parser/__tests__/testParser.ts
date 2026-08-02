import fs from 'fs';
import path from 'path';
import { parseCapPdf } from '../capParser';

async function runParserTest() {
  console.log("=== Testing CAP PDF Parser Module against CAPR-II_06649.pdf ===");

  const pdfPath = path.join(process.cwd(), 'CAPR-II_06649.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: Sample PDF not found at ${pdfPath}`);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const result = await parseCapPdf(pdfBuffer, 'CAPR-II_06649.pdf');

  console.log(`\n--- Parser Summary ---`);
  console.log(`Institute Code: ${result.instituteCode}`);
  console.log(`Institute Name: ${result.instituteName}`);
  console.log(`Round Label: ${result.roundLabel}`);
  console.log(`Total Choice Codes Extracted: ${result.totalChoiceCodes}`);
  console.log(`Total Candidate Rows: ${result.totalCandidates}`);
  console.log(`Total Filled Seats: ${result.totalFilledSeats}`);
  console.log(`Total Vacant Seats: ${result.totalVacantSeats}`);
  console.log(`Reconciliation Warnings: ${result.warnings.length}`);

  if (result.warnings.length > 0) {
    console.log(`Warnings:`);
    result.warnings.forEach(w => console.warn(`  - ${w}`));
  }

  console.log(`\n--- Extracted Choice Codes ---`);
  result.choiceCodes.forEach(cc => {
    console.log(`Choice Code ${cc.code} (${cc.departmentName} - ${cc.variant}):`);
    console.log(`  CAP Seats: ${cc.capSeats} | Filled: ${cc.filledSeats} | Vacant: ${cc.vacantSeats} | Reconciled: ${cc.reconciled}`);
  });

  // Verify candidate row sample
  const sampleCand = result.choiceCodes[0]?.candidates.find(c => !c.isVacant);
  if (sampleCand) {
    console.log(`\n--- Sample Candidate Record ---`);
    console.log(JSON.stringify(sampleCand, null, 2));
  }

  // Verify target candidate record EN25310243
  let targetCand = null;
  for (const cc of result.choiceCodes) {
    const found = cc.candidates.find(c => c.applicationId === 'EN25310243');
    if (found) {
      targetCand = found;
      break;
    }
  }

  if (targetCand) {
    console.log(`\n--- Verified Target Record EN25310243 ---`);
    console.log(JSON.stringify(targetCand, null, 2));
  }
}

runParserTest().catch(console.error);
