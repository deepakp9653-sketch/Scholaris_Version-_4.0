const ExcelJS = require("exceljs");
const path = require("path");

async function inspect() {
  const filePath = "c:\\Users\\heena\\OneDrive\\Desktop\\Scholaris-Sabse_Jyada_main\\eligibility_test01.xlsx";
  console.log("Reading:", filePath);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  wb.worksheets.forEach((ws, idx) => {
    console.log(`\n--- Sheet ${idx + 1}: ${ws.name} (RowCount: ${ws.rowCount}) ---`);
    for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const vals = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        vals.push(`C${colNumber}:${cell.value}`);
      });
      if (vals.length > 0) {
        console.log(`Row ${r}:`, vals.slice(0, 10).join(" | "));
      }
    }
  });
}

inspect().catch(console.error);
