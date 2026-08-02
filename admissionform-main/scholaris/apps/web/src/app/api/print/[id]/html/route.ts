import { NextRequest } from "next/server";
import { getPrintFormData } from "@/lib/print-templates/get-form-data";
import { renderPrintHtml } from "@/lib/print-templates/render-html";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getPrintFormData(id);

  if (!data) {
    return new Response("Record not found", { status: 404 });
  }

  const html = renderPrintHtml(data);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
