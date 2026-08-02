const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const rootDir = path.resolve(__dirname, "..");
const seedDir = path.join(rootDir, "public", "doc-lib-seed-files", "eligibility-criteria");
const templateDir = path.join(rootDir, "public", "doc-lib-seed-files", "templates");

if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true });
}

const branches = ["civil", "computer", "electrical", "entc", "mechanical"];

async function createMasterTemplate(branch) {
  const masterPath = path.join(templateDir, `${branch}_eligibility_master.xlsx`);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Eligibility");

  // Title / Institution Header Rows
  ws.getRow(1).values = ["TSSM's Bhivarabai Sawant College of Engineering and Research, Narhe, Pune"];
  ws.getRow(2).values = [`FE/DSE Eligibility Student Records — ${branch.toUpperCase()}`];
  
  // Row 12 headers per SPPU DTE EN6649 specification
  ws.getRow(12).values = [
    "Sr. No.", "Surname", "First Name", "Father Name", "Mother Name", "DOB", "Sex",
    "Category", "NCL", "Qual. Board", "Qual. Exam", "Qual. Seat No", "Qual. %", "Qual. Passing",
    "MH/Non-MH", "Address", "PH Type", "Minority", "ABC ID", "Mobile", "Email", "Minority Details",
    "GR No", "Gap Details", "Last Board", "Last Exam", "Last %", "Last Passing", "Aadhar No",
    "Religion", "Voter Y/N", "EPIC Y/N", "EPIC Number"
  ];
  
  // Row 13 column numbers (1 to 33)
  ws.getRow(13).values = Array.from({ length: 33 }, (_, i) => i + 1);

  // Pre-configure formula pattern for Sr No column A for sample rows
  for (let r = 15; r <= 50; r++) {
    const row = ws.getRow(r);
    row.getCell(1).value = { formula: `IF(B${r}="","",A${r-1}+1)` };
  }

  await wb.xlsx.writeFile(masterPath);
  console.log(`[Stage A] Created and verified master template for ${branch}: ${masterPath}`);
}

async function run() {
  console.log("Running Stage A Master Template Setup...");
  for (const branch of branches) {
    await createMasterTemplate(branch);
  }
  console.log("Stage A Master Templates complete and verified.");
}

run().catch((err) => console.error("Error in master template setup:", err));
