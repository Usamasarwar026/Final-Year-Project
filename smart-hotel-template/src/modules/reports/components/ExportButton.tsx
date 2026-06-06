"use client";
// src/modules/reports/components/ExportButton.tsx
import { useState } from "react";
import { Download, FileText, Sheet } from "lucide-react";

export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportConfig {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  rows: any[];
  from: string;
  to: string;
}

interface ExportButtonProps {
  config: ExportConfig;
  disabled?: boolean;
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "number") return val.toFixed(2);
  return String(val);
}

// ── PDF export ─────────────────────────────────────────────────────────────

async function exportPDF(config: ExportConfig) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header block
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(config.title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  if (config.subtitle) doc.text(config.subtitle, 14, 28);
  doc.text(`Date Range: ${config.from}  →  ${config.to}`, 14, 35);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 41);

  autoTable(doc, {
    startY: 48,
    head: [config.columns.map((c) => c.header)],
    body: config.rows.map((row) =>
      config.columns.map((c) => formatCell(row[c.key]))
    ),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: [14, 165, 233], // sky-500
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  // Footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount}  |  Smart Hotel Management System`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  const filename = `${config.title.replace(/\s+/g, "_")}_${config.from}_${config.to}.pdf`;
  doc.save(filename);
}

// ── Excel export ───────────────────────────────────────────────────────────

async function exportExcel(config: ExportConfig) {
  const XLSX = await import("xlsx");

  // Meta sheet
  const metaData = [
    ["Report", config.title],
    ["Subtitle", config.subtitle ?? ""],
    ["Date From", config.from],
    ["Date To", config.to],
    ["Generated At", new Date().toLocaleString()],
  ];

  // Data sheet
  const header = config.columns.map((c) => c.header);
  const body = config.rows.map((row) =>
    config.columns.map((c) => {
      const v = row[c.key];
      return typeof v === "number" ? v : formatCell(v);
    })
  );

  const wb = XLSX.utils.book_new();

  const metaWS = XLSX.utils.aoa_to_sheet(metaData);
  XLSX.utils.book_append_sheet(wb, metaWS, "Info");

  const dataWS = XLSX.utils.aoa_to_sheet([header, ...body]);
  // Column widths
  dataWS["!cols"] = config.columns.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, dataWS, "Report Data");

  const filename = `${config.title.replace(/\s+/g, "_")}_${config.from}_${config.to}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ExportButton({ config, disabled = false }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const handleExport = async (type: "pdf" | "excel") => {
    setExporting(type);
    setOpen(false);
    try {
      if (type === "pdf") await exportPDF(config);
      else await exportExcel(config);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please make sure all required libraries are installed.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative">
      <button
        id="report-export-btn"
        disabled={disabled || !!exporting}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Exporting…
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <button
            id="export-pdf-btn"
            onClick={() => handleExport("pdf")}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            Export as PDF
          </button>
          <hr className="border-gray-100" />
          <button
            id="export-excel-btn"
            onClick={() => handleExport("excel")}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Sheet className="w-4 h-4 text-emerald-500" />
            Export as Excel
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
