import { NextRequest } from "next/server";
import { chromium } from "playwright";
import { getPrintFormData } from "@/lib/print-templates/get-form-data";
import { renderPrintHtml } from "@/lib/print-templates/render-html";

export const dynamic = "force-dynamic";

let browserInstance: import("playwright").Browser | null = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({ headless: true });
  }
  return browserInstance;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const data = await getPrintFormData(id);
  if (!data) {
    return new Response("Record not found", { status: 404 });
  }

  const formNo = String(data.student.serialNumber || data.student.formNumber || "001").padStart(3, "0");
  const surname = String(data.student.fullNameSurname || "").trim();
  const firstName = String(data.student.fullNameFirst || "").trim();
  const fatherName = String(data.student.fullNameFather || data.student.fatherName || "").trim();

  // Format: Form.No_Student_Name.pdf e.g. 001_SHINDE_RUDDHI_RUPESH.pdf
  const fullStudentName = [surname, firstName, fatherName].filter(Boolean).join("_").replace(/[^a-zA-Z0-9_]/g, "") || "Candidate";
  const filename = `${formNo}_${fullStudentName}.pdf`;

  const html = renderPrintHtml(data);
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "networkidle" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "0", bottom: "0", left: "0", right: "0" },
        printBackground: true,
        preferCSSPageSize: true,
      });

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"; filename*=${encodeURIComponent(filename)}`,
        },
      });
    } finally {
      await page.close();
    }
  } catch (pdfErr) {
    console.error("PDF generation error, falling back to HTML stream:", pdfErr);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename.replace('.pdf', '.html')}"`,
      },
    });
  }
}
