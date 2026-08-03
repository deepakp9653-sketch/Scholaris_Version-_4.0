export const PRINT_STYLES = `
  /* Google Fonts for Devanagari (Marathi) */
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700;900&display=swap');

  @page {
    size: A4 portrait;
    margin: 0;
  }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Times New Roman', 'Georgia', serif;
    font-size: 13px;
    line-height: 1.45;
    color: #000;
    background: #fff;
    -webkit-font-smoothing: antialiased;
  }

  /* Devanagari / Marathi support */
  .marathi {
    font-family: 'Noto Sans Devanagari', 'Mangal', 'Times New Roman', serif;
  }

  /* ---- A4 Page Container ---- */
  .page-container {
    width: 210mm;
    min-height: 297mm;
    padding: 10mm 14mm 12mm 14mm;
    background: #fff;
    position: relative;
    box-sizing: border-box;
    overflow: hidden;
    page-break-after: always;
  }
  .page-container:last-child {
    page-break-after: auto;
  }

  /* ---- Form Row Layout ---- */
  .form-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .form-row.spaced {
    margin-bottom: 9px;
  }

  .form-label {
    font-size: 12.5px;
    white-space: nowrap;
    margin-right: 4px;
    color: #000;
    font-weight: normal;
  }
  .form-label.bold {
    font-weight: normal;
  }

  /* ---- Field Values (printed readonly) ---- */
  .form-value {
    border-bottom: 1.5px solid #000;
    font-family: Arial, Helvetica, 'Times New Roman', sans-serif;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #000;
    padding: 1px 4px;
    flex: 1;
    min-width: 40px;
    line-height: 1.3;
    min-height: 16px;
  }
  .form-value.lowercase {
    text-transform: lowercase !important;
  }
  .form-value.short {
    flex: 0 1 110px;
  }
  .form-value.medium {
    flex: 0 1 180px;
  }
  .form-value.full {
    width: 100%;
    flex: 1;
  }

  /* ---- Tables ---- */
  .form-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 12px;
  }
  .form-table th,
  .form-table td {
    border: 1px solid #000;
    padding: 4px 6px;
    text-align: center;
    vertical-align: middle;
  }
  .form-table th {
    font-weight: bold;
    background: #fff;
  }
  .form-table td .val {
    font-weight: 900;
    text-transform: uppercase;
    font-family: Arial, sans-serif;
    font-size: 12.5px;
  }
  .form-table.left-align td,
  .form-table.left-align th {
    text-align: left;
  }

  /* ---- Signature Line ---- */
  .signature-line {
    border-top: 1px solid #000;
    width: 160px;
    padding-top: 4px;
    font-size: 11px;
    text-align: center;
    font-weight: bold;
  }

  /* ---- Photo Box ---- */
  .photo-box {
    width: 100px;
    height: 120px;
    border: 1.5px solid #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    text-align: center;
    flex-shrink: 0;
  }

  /* ---- Rules ---- */
  .rule-item {
    font-size: 13.5px;
    line-height: 1.65;
    margin-bottom: 7px;
    text-align: justify;
  }

  /* ---- Affidavit Clause ---- */
  .affidavit-clause {
    font-size: 13px;
    line-height: 1.7;
    text-align: justify;
    margin-bottom: 12px;
  }

  /* ---- Utility ---- */
  .mt-4 { margin-top: 5px; }
  .mt-8 { margin-top: 10px; }
  .mt-12 { margin-top: 14px; }
  .mt-16 { margin-top: 18px; }

  /* ---- Bank form special ---- */
  .bank-applicant-row {
    padding: 6px 10px;
    border-bottom: 1px solid #000;
  }
  .bank-applicant-row:last-child {
    border-bottom: none;
  }

  /* ---- Print Media ---- */
  @media print {
    @page {
      size: A4 portrait;
      margin: 0;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      width: 210mm !important;
      height: auto !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-container {
      box-shadow: none !important;
      margin: 0 !important;
      padding: 8mm 10mm !important;
      width: 210mm !important;
      min-height: 297mm !important;
      height: auto !important;
      box-sizing: border-box !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-container:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;
