"use client";

import { useState, useEffect, useTransition } from "react";
import { Search, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CapCandidateTable } from "@/components/cap/cap-candidate-table";
import { getCapCandidates, getAllCapCandidatesForExport } from "@/lib/actions/cap";

interface Props {
  batchId: string;
  initialData: Awaited<ReturnType<typeof getCapCandidates>>;
}

export function CandidatePageClient({ batchId, initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isVacantFilter, setIsVacantFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const loadData = (newSearch: string, newPage: number, newIsVacant?: boolean) => {
    startTransition(async () => {
      const result = await getCapCandidates(batchId, {
        search: newSearch || undefined,
        isVacant: newIsVacant,
        page: newPage,
        pageSize: 50,
      });
      setData(result);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData(search, 1, isVacantFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, isVacantFilter]);

  // Export Candidate Data to Excel (.csv format recognized natively by MS Excel)
  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const allCandidates = await getAllCapCandidatesForExport(batchId);
      const candidatesToExport = allCandidates.length > 0 ? allCandidates : data.candidates;

      const headers = [
        "Sr No",
        "Application ID",
        "Candidate Name",
        "Department",
        "Category",
        "Seat Type",
        "Merit No",
        "Score",
        "Status",
      ];

      const rows = candidatesToExport.map((c: any, index: number) => [
        c.srNo || index + 1,
        `"${c.applicationId || ""}"`,
        `"${(c.candidateName || "").replace(/"/g, '""')}"`,
        `"${(c.choiceCode?.department?.name || c.departmentName || "").replace(/"/g, '""')}"`,
        `"${c.category || c.candidateCategory || ""}"`,
        `"${c.seatTypeCode || c.allottedSeatType || ""}"`,
        c.meritNo || "",
        c.score || "",
        `"${c.statusLabel || (c.isVacant ? "Vacant" : "Allotted")}"`,
      ]);

      const csvString = [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Cap_Candidate_Records_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Excel error:", err);
    } finally {
      setExportingExcel(false);
    }
  };

  // Export Candidate Data to Formatted PDF Report
  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const allCandidates = await getAllCapCandidatesForExport(batchId);
      const candidatesToExport = allCandidates.length > 0 ? allCandidates : data.candidates;

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const rowsHtml = candidatesToExport
        .map(
          (c: any, index: number) => `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${c.srNo || index + 1}</td>
          <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">${c.applicationId || "—"}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${c.candidateName || "VACANT"}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${c.choiceCode?.department?.name || "Engineering"}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${c.category || c.candidateCategory || "—"}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${c.seatTypeCode || c.allottedSeatType || "—"}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${c.meritNo || "—"}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${c.score ? Number(c.score).toFixed(2) : "—"}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${c.statusLabel || "Allotted"}</td>
        </tr>
      `
        )
        .join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>CAP Candidate Records Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .header h2 { margin: 0; font-size: 18px; }
              .header h3 { margin: 4px 0; font-size: 14px; font-weight: normal; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
              th { background-color: #f2f2f2; padding: 6px; border: 1px solid #ddd; text-align: left; }
              .footer { margin-top: 20px; font-size: 11px; text-align: right; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>TSSM's Bhivarabai Sawant College of Engineering & Research, Narhe, Pune</h2>
              <h3>CAP Round Candidate Records Report (Total Candidates: ${candidatesToExport.length})</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Application ID</th>
                  <th>Candidate Name</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Seat Type</th>
                  <th>Merit No</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <div class="footer">Generated on ${new Date().toLocaleString()}</div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error("Export PDF error:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter & Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or application ID…"
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={isVacantFilter === false ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs"
            onClick={() => setIsVacantFilter(isVacantFilter === false ? undefined : false)}
          >
            Filled Only
          </Button>
          <Button
            variant={isVacantFilter === true ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs"
            onClick={() => setIsVacantFilter(isVacantFilter === true ? undefined : true)}
          >
            Vacant Only
          </Button>
          {isPending && (
            <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            size="sm"
            className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs"
          >
            {exportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export Excel
          </Button>
          <Button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 text-xs font-medium border-slate-300 hover:bg-slate-50 shadow-xs"
          >
            {exportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-rose-600" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      <CapCandidateTable
        candidates={data.candidates as Parameters<typeof CapCandidateTable>[0]["candidates"]}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        batchId={batchId}
        onPageChange={(p) => {
          setPage(p);
          loadData(search, p, isVacantFilter);
        }}
      />
    </div>
  );
}
