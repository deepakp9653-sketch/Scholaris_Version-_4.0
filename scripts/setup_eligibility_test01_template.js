const fs = require("fs");
const path = require("path");

const srcExcel = "c:\\Users\\heena\\OneDrive\\Desktop\\Scholaris-Sabse_Jyada_main\\eligibility_test01.xlsx";

const webAppDir = path.resolve(__dirname, "..");
const templateDir = path.join(webAppDir, "public", "doc-lib-seed-files", "templates");
const criteriaDir = path.join(webAppDir, "public", "doc-lib-seed-files", "eligibility-criteria");

if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true });
if (!fs.existsSync(criteriaDir)) fs.mkdirSync(criteriaDir, { recursive: true });

if (fs.existsSync(srcExcel)) {
  console.log(`Found base template: ${srcExcel}`);
  
  // Copy to master template
  const masterPath = path.join(templateDir, "eligibility_test01_master.xlsx");
  fs.copyFileSync(srcExcel, masterPath);
  console.log(`Copied to master template: ${masterPath}`);

  const branches = ["civil", "computer", "electrical", "entc", "mechanical"];
  for (const branch of branches) {
    const branchMaster = path.join(templateDir, `${branch}_eligibility_master.xlsx`);
    fs.copyFileSync(srcExcel, branchMaster);

    const branchCriteriaXlsx = path.join(criteriaDir, `${branch}_eligibility.xlsx`);
    fs.copyFileSync(srcExcel, branchCriteriaXlsx);
  }
  console.log("Successfully setup eligibility_test01.xlsx for all 5 departments!");
} else {
  console.error(`Base template not found at: ${srcExcel}`);
}
