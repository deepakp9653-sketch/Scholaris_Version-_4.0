import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

async function dumpRawLines() {
  const pdfPath = path.join(process.cwd(), 'CAPR-II_06649.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(pdfBuffer);

  const lines = pdfData.text.split('\n');
  console.log(`Total lines extracted by pdf-parse: ${lines.length}`);
  console.log(`--- Lines 50 to 120 ---`);
  lines.slice(50, 120).forEach((l: string, i: number) => {
    console.log(`${50 + i}: ${l}`);
  });
}

dumpRawLines().catch(console.error);
