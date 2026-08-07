/**
 * Monthly Overtime Authorization Sheet — PDF Generator
 * Portrait A4, exact replica of the physical form
 * 月度加班授权表
 *
 * Uses NotoSansSC (fetched from CDN) so Chinese characters render correctly.
 */

// ─── Font loader ──────────────────────────────────────────────────────────────
// We load two weights: Regular (400) and Bold (700) of Noto Sans SC.
// jsPDF needs the font as a raw binary string (ArrayBuffer → base64).

let _fontLoaded = false;

async function ensureChineseFont(doc) {
  if (_fontLoaded) return;

  // Reliable jsDelivr-hosted Noto Sans SC TTF (covers all CJK Simplified Chinese):
  const RELIABLE_TTF =
    "https://cdn.jsdelivr.net/gh/jsntn/webfonts@master/NotoSansSC-Regular.ttf";

  try {
    const res = await fetch(RELIABLE_TTF);
    if (!res.ok) throw new Error("Font fetch failed: " + res.status);
    const buffer = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    // Add font to jsPDF virtual file system and register it
    doc.addFileToVFS("NotoSansSC-Regular.ttf", base64);
    doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");

    _fontLoaded = true;
  } catch (err) {
    console.warn("Could not load NotoSansSC font:", err.message);
    // Fallback: Chinese chars will be squares but layout stays intact
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  // Process in chunks to avoid stack overflow on large fonts
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Set font: use NotoSansSC if loaded (supports CJK), else fall back to helvetica */
function setFont(doc, style = "normal") {
  if (_fontLoaded) {
    doc.setFont("NotoSansSC", "normal"); // NotoSansSC only has one registered weight
  } else {
    doc.setFont("helvetica", style);
  }
}

/** Draw a filled rectangle (white) then outline */
function cell(doc, x, y, w, h, lineW = 0.3) {
  doc.setDrawColor(0);
  doc.setLineWidth(lineW);
  doc.rect(x, y, w, h, "S");
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function downloadOvertimePDF(sheetData, filename) {
  const { default: jsPDF } = await import("jspdf");

  const { dept, month, employeeName, entries } = sheetData;
  const safeEntries = Array.isArray(entries) ? entries.slice(0, 9) : [];
  // Pad to exactly 9 rows
  while (safeEntries.length < 9) safeEntries.push({});

  // ── Document setup (Portrait A4) ─────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Load Chinese font into this doc instance
  await ensureChineseFont(doc);

  const pw = doc.internal.pageSize.getWidth();   // 210 mm
  const ph = doc.internal.pageSize.getHeight();  // 297 mm
  const mL = 12, mR = 12, mT = 10, mB = 10;
  const usableW = pw - mL - mR;  // 186 mm
  const usableH = ph - mT - mB;  // 277 mm

  // ── Outer border ─────────────────────────────────────────────────────────
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.rect(mL, mT, usableW, usableH);

  // ════════════════════════════════════════════════════════════════════════
  // TITLE BLOCK  (top ~28 mm)
  // ════════════════════════════════════════════════════════════════════════
  const titleBlockH = 28;

  // Chinese title — top-left, bold, large
  setFont(doc, "bold");
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("月度加班授权单", mL + 3, mT + 10);

  // English title — centered, bold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("MONTHLY OVERTIM AUTHORIZATION SHEET", pw / 2, mT + 10, { align: "center" });

  // Divider under first line
  doc.setLineWidth(0.4);
  doc.line(mL, mT + 13, mL + usableW, mT + 13);

  // ── Info row: Dept | Month | Name ──────────────────────────────────────
  const infoY = mT + 20;
  doc.setFontSize(8.5);

  // Dept label (Chinese + English)
  setFont(doc, "normal");
  doc.text("部门", mL + 3, infoY);
  doc.setFont("helvetica", "normal");
  doc.text("Dept.", mL + 11, infoY);

  // Dept value (underlined)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const deptVal = dept || "Maintenance: I&C";
  doc.text(deptVal, mL + 25, infoY);
  doc.setLineWidth(0.25);
  doc.line(mL + 24, infoY + 1, mL + 24 + 40, infoY + 1);

  // Month label
  setFont(doc, "normal");
  doc.setFontSize(8.5);
  doc.text("月份", pw / 2 - 28, infoY);
  doc.setFont("helvetica", "normal");
  doc.text("MONTH:", pw / 2 - 20, infoY);

  // Month value
  doc.setFont("helvetica", "bold");
  const monthVal = month || "";
  doc.text(monthVal, pw / 2 - 2, infoY);
  doc.setLineWidth(0.25);
  doc.line(pw / 2 - 3, infoY + 1, pw / 2 + 25, infoY + 1);

  // Name label
  setFont(doc, "normal");
  doc.setFontSize(8.5);
  doc.text("姓名", pw - mR - 58, infoY);
  doc.setFont("helvetica", "normal");
  doc.text("NAME:", pw - mR - 50, infoY);

  // Name value
  doc.setFont("helvetica", "bold");
  doc.text(employeeName || "", pw - mR - 38, infoY);
  doc.setLineWidth(0.25);
  doc.line(pw - mR - 39, infoY + 1, pw - mR - 1, infoY + 1);

  // Heavy divider under title block
  doc.setLineWidth(0.7);
  doc.line(mL, mT + titleBlockH, mL + usableW, mT + titleBlockH);

  // ════════════════════════════════════════════════════════════════════════
  // TABLE LAYOUT
  // ════════════════════════════════════════════════════════════════════════
  const summaryH = 9 * 3;   // 3 summary rows × 9 mm each = 27 mm
  const tableStartY = mT + titleBlockH;
  const tableEndY   = mT + usableH - summaryH;
  const tableH      = tableEndY - tableStartY;

  // Header row height + 9 data rows
  const headerH  = 14;
  const dataRowH = (tableH - headerH) / 9;  // ~22 mm each — nice spacious rows

  // ── Column definitions ────────────────────────────────────────────────
  // NO. | DATE | WORK PERIOD | HOURS | PURPOSE | SIGNATURE | SUPERVISOR SIG
  // Ratio (out of 186 mm usable):
  const rawCols = [10, 22, 28, 16, 60, 25, 25];
  const rawSum  = rawCols.reduce((a, b) => a + b, 0); // 186
  const scale   = usableW / rawSum;
  const cw      = rawCols.map(w => parseFloat((w * scale).toFixed(3)));
  // Fix rounding
  const diff = usableW - cw.reduce((a, b) => a + b, 0);
  cw[4] = parseFloat((cw[4] + diff).toFixed(3));

  const colX = [];
  let cx = mL;
  cw.forEach(w => { colX.push(cx); cx += w; });

  // ── Header row ───────────────────────────────────────────────────────
  const headers = [
    { en: "NO.",             zh: "序号",     wrap: false },
    { en: "DATE",            zh: "日期",     wrap: false },
    { en: "WORK PERIOD",     zh: "加班时间", wrap: true  },
    { en: "HOURS",           zh: "小时数",   wrap: false },
    { en: "PURPOSE",         zh: "加班目的", wrap: false },
    { en: "SIGNATURE",       zh: "",         wrap: false },
    { en: "SUPERVISOR\nSIGNATURE", zh: "主管签名", wrap: true },
  ];

  doc.setLineWidth(0.5);

  headers.forEach((h, i) => {
    const x = colX[i];
    const w = cw[i];
    doc.rect(x, tableStartY, w, headerH, "S");
    const midX = x + w / 2;

    // English — bold helvetica
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(0);

    if (h.en.includes("\n")) {
      const [l1, l2] = h.en.split("\n");
      const baseY = h.zh ? tableStartY + 4 : tableStartY + 5.5;
      doc.text(l1, midX, baseY,     { align: "center" });
      doc.text(l2, midX, baseY + 4, { align: "center" });
    } else {
      const enY = h.zh ? tableStartY + 5.5 : tableStartY + 7.5;
      doc.text(h.en, midX, enY, { align: "center" });
    }

    // Chinese — NotoSansSC below
    if (h.zh) {
      setFont(doc, "normal");
      doc.setFontSize(6.5);
      doc.text(h.zh, midX, tableStartY + 11.5, { align: "center" });
    }
  });

  // ── Data rows ────────────────────────────────────────────────────────
  doc.setLineWidth(0.25);

  for (let row = 0; row < 9; row++) {
    const ry    = tableStartY + headerH + row * dataRowH;
    const entry = safeEntries[row] || {};

    headers.forEach((h, col) => {
      doc.rect(colX[col], ry, cw[col], dataRowH, "S");

      let val = "";
      switch (col) {
        case 0: val = String(row + 1); break;
        case 1: val = entry.date        ? formatDate(entry.date)       : ""; break;
        case 2: val = entry.work_period || ""; break;
        case 3: val = entry.hours       ? String(entry.hours)          : ""; break;
        case 4: val = entry.purpose     || ""; break;
        case 5: val = entry.signature   || ""; break;
        case 6: val = entry.supervisor_signature || ""; break;
      }

      if (val) {
        // Use NotoSansSC for content (handles CJK if present)
        setFont(doc, "normal");
        doc.setFontSize(col === 0 ? 9 : 7.5);
        doc.setTextColor(0);

        const maxW  = cw[col] - 3;
        const lines = doc.splitTextToSize(val, maxW);
        const lineH = 3.8;
        const textH = lines.length * lineH;
        const textY = ry + (dataRowH - textH) / 2 + lineH * 0.75;

        if (col === 0) {
          doc.text(val, colX[col] + cw[col] / 2, ry + dataRowH / 2 + 1.2, { align: "center" });
        } else {
          lines.forEach((ln, li) =>
            doc.text(ln, colX[col] + 1.8, textY + li * lineH)
          );
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // SUMMARY ROWS  (bottom 27 mm — 3 rows)
  // ════════════════════════════════════════════════════════════════════════
  const summaryRowH = summaryH / 3;  // 9 mm

  // Compute totals
  const weekdayTotal = safeEntries.reduce((s, e) => {
    const h = parseFloat(e.hours || 0);
    return s + (e.is_holiday ? 0 : h);
  }, 0);
  const holidayTotal = safeEntries.reduce((s, e) => {
    const h = parseFloat(e.hours || 0);
    return s + (e.is_holiday ? h : 0);
  }, 0);

  const summaryData = [
    {
      zh: "月度平日加班小时总计",
      en: "Total Weekday Overtime Hours",
      val: weekdayTotal > 0 ? weekdayTotal.toFixed(1) : "",
    },
    {
      zh: "月度假日加班小时总计",
      en: "Total Holiday Overtime Hours",
      val: holidayTotal > 0 ? holidayTotal.toFixed(1) : "",
    },
    {
      zh: "部门经理人签名",
      en: "Dept. Manager's Signature",
      val: "",
    },
  ];

  // Label column width = NO + DATE + WORK PERIOD cols merged
  const labelColW = cw[0] + cw[1] + cw[2];
  const valueColW = usableW - labelColW;

  doc.setLineWidth(0.35);

  summaryData.forEach((sr, i) => {
    const sy = tableEndY + i * summaryRowH;

    // Heavy top border on first summary row
    if (i === 0) {
      doc.setLineWidth(0.7);
      doc.line(mL, sy, mL + usableW, sy);
      doc.setLineWidth(0.35);
    }

    // Label cell
    doc.rect(mL, sy, labelColW, summaryRowH, "S");
    // Value cell
    doc.rect(mL + labelColW, sy, valueColW, summaryRowH, "S");

    // Chinese label
    setFont(doc, "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0);
    doc.text(sr.zh, mL + 2.5, sy + 4.5);

    // English label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(sr.en, mL + 2.5, sy + 7.8);

    // Value (hours)
    if (sr.val) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(sr.val, mL + labelColW + 5, sy + summaryRowH / 2 + 1.5);
    }
  });

  // ── Save ─────────────────────────────────────────────────────────────────
  doc.save(filename || `Overtime_${employeeName || "Sheet"}_${month || "Month"}.pdf`);
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00"); // avoid TZ shift
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}
