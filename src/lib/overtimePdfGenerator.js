/**
 * Monthly Overtime Authorization Sheet — PDF Generator
 * Landscape A4 — exact replica of the physical form photo
 * 月度加班统计表
 */

// ─── Chinese font loader ──────────────────────────────────────────────────────
let _fontLoaded = false;
let _fontB64    = null; // cache so we only fetch once per session

async function ensureChineseFont(doc) {
  if (_fontLoaded) return;

  const TTF_URL =
    "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansSC/hinted/ttf/NotoSansSC-Regular.ttf";

  try {
    if (!_fontB64) {
      const res = await fetch(TTF_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const buf   = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 8192)
        bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
      _fontB64 = btoa(bin);
    }
    doc.addFileToVFS("NotoSansSC.ttf", _fontB64);
    doc.addFont("NotoSansSC.ttf", "NotoSansSC", "normal");
    _fontLoaded = true;
  } catch (e) {
    console.warn("NotoSansSC load failed:", e.message);
  }
}

// Switch between CJK font and Helvetica
function cjk(doc)  { _fontLoaded ? doc.setFont("NotoSansSC","normal") : doc.setFont("helvetica","normal"); }
function lat(doc, w="normal") { doc.setFont("helvetica", w); }

// ─── Main ─────────────────────────────────────────────────────────────────────
export async function downloadOvertimePDF(sheetData, filename) {
  const { default: jsPDF } = await import("jspdf");
  const { dept, month, employeeName, entries } = sheetData;

  // Pad / slice to exactly 9 rows
  const rows = Array.isArray(entries) ? [...entries] : [];
  while (rows.length < 9) rows.push({});
  const safeRows = rows.slice(0, 9);

  // ── Page setup: Landscape A4 ─────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  await ensureChineseFont(doc);

  const PW = doc.internal.pageSize.getWidth();   // 297 mm
  const PH = doc.internal.pageSize.getHeight();  // 210 mm
  const ML = 10, MR = 10, MT = 8, MB = 8;
  const W  = PW - ML - MR;  // 277 mm  usable width
  const H  = PH - MT - MB;  // 194 mm  usable height

  // ── Outer border ─────────────────────────────────────────────────────────
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.rect(ML, MT, W, H);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 1 — TITLE  (merged full-width, ~18 mm tall)
  // ════════════════════════════════════════════════════════════════════════════
  const T1H = 18; // title block height

  // Chinese title — large, centered
  cjk(doc);
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("月度加班统计表", PW / 2, MT + 9, { align: "center" });

  // English subtitle — slightly smaller, centered below
  lat(doc, "bold");
  doc.setFontSize(11);
  doc.text("MONTHLY  OVERTIM  AUTHORIZATION  SHEET", PW / 2, MT + 15, { align: "center" });

  // Divider under title
  doc.setLineWidth(0.6);
  doc.line(ML, MT + T1H, ML + W, MT + T1H);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — INFO ROW  (dept | month | name, ~10 mm tall)
  // ════════════════════════════════════════════════════════════════════════════
  const T2Y = MT + T1H;
  const T2H = 10;
  const IY  = T2Y + 6.5; // text baseline

  // Vertical dividers to split into 3 zones
  const z1 = ML + W * 0.38;  // after dept section
  const z2 = ML + W * 0.65;  // after month section

  doc.setLineWidth(0.4);
  doc.line(z1, T2Y, z1, T2Y + T2H);
  doc.line(z2, T2Y, z2, T2Y + T2H);

  // Zone 1 — Dept
  cjk(doc); doc.setFontSize(8.5);
  doc.text("部门", ML + 3, IY);
  lat(doc,"normal"); doc.setFontSize(8.5);
  doc.text("Dept.  " + (dept || "Maintenance: I&C"), ML + 11, IY);

  // Zone 2 — Month
  cjk(doc); doc.setFontSize(8.5);
  doc.text("月份", z1 + 4, IY);
  lat(doc,"normal"); doc.setFontSize(8.5);
  doc.text("MONTH:  " + (month || ""), z1 + 12, IY);

  // Zone 3 — Name
  cjk(doc); doc.setFontSize(8.5);
  doc.text("姓名", z2 + 4, IY);
  lat(doc,"normal"); doc.setFontSize(8.5);
  doc.text("NAME:  " + (employeeName || ""), z2 + 12, IY);

  // Divider under info row
  doc.setLineWidth(0.6);
  doc.line(ML, T2Y + T2H, ML + W, T2Y + T2H);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 3 — TABLE
  // ════════════════════════════════════════════════════════════════════════════
  const SUMMARY_ROW_H = 11;   // each of the 3 summary rows
  const SUMMARY_H     = SUMMARY_ROW_H * 3;

  const TABLE_Y  = T2Y + T2H;                        // table top
  const TABLE_END = MT + H - SUMMARY_H;              // table bottom (above summary)
  const TABLE_H  = TABLE_END - TABLE_Y;

  const HDR_H    = 13;                               // column header row
  const DATA_H   = (TABLE_H - HDR_H) / 9;           // each of the 9 data rows

  // ── Column widths (must sum to W = 277mm) ──────────────────────────────
  //  NO. | DATE | WORK PERIOD | HOURS | PURPOSE | SIGNATURE | SUPERVISOR SIG
  const RAW = [12, 26, 32, 18, 95, 42, 52];
  const SUM = RAW.reduce((a,b)=>a+b,0);
  const CW  = RAW.map(r => parseFloat((r * W / SUM).toFixed(2)));
  // fix floating point
  CW[4] += parseFloat((W - CW.reduce((a,b)=>a+b,0)).toFixed(2));

  // Column left-edge X positions
  const CX = [];
  let cx = ML;
  CW.forEach(w => { CX.push(cx); cx += w; });

  // ── Column header row ─────────────────────────────────────────────────
  const HDR = [
    { zh: "序号",   en: "NO."              },
    { zh: "日期",   en: "DATE"             },
    { zh: "加班时间", en: "WORK\nPERIOD"   },
    { zh: "小时数", en: "HOURS"            },
    { zh: "加班目的", en: "PURPOSE"        },
    { zh: "",       en: "SIGNATURE"        },
    { zh: "主管签字", en: "SUPERVISOR\nSIGNATURE" },
  ];

  doc.setLineWidth(0.45);
  HDR.forEach((h, i) => {
    doc.rect(CX[i], TABLE_Y, CW[i], HDR_H);
    const mx = CX[i] + CW[i] / 2;

    if (h.zh) {
      // Chinese top line
      cjk(doc); doc.setFontSize(7);
      doc.text(h.zh, mx, TABLE_Y + 4.5, { align: "center" });
      // English bottom line
      lat(doc,"bold"); doc.setFontSize(6.5);
      if (h.en.includes("\n")) {
        const [l1,l2] = h.en.split("\n");
        doc.text(l1, mx, TABLE_Y + 8.5, { align: "center" });
        doc.text(l2, mx, TABLE_Y + 11.5, { align: "center" });
      } else {
        doc.text(h.en, mx, TABLE_Y + 9.5, { align: "center" });
      }
    } else {
      // English only — vertically centered
      lat(doc,"bold"); doc.setFontSize(7);
      if (h.en.includes("\n")) {
        const [l1,l2] = h.en.split("\n");
        doc.text(l1, mx, TABLE_Y + 5,  { align: "center" });
        doc.text(l2, mx, TABLE_Y + 9,  { align: "center" });
      } else {
        doc.text(h.en, mx, TABLE_Y + HDR_H/2 + 1.5, { align: "center" });
      }
    }
  });

  // ── 9 data rows ────────────────────────────────────────────────────────
  doc.setLineWidth(0.2);

  for (let r = 0; r < 9; r++) {
    const RY = TABLE_Y + HDR_H + r * DATA_H;
    const e  = safeRows[r] || {};

    const vals = [
      String(r + 1),
      e.date        ? fmtDate(e.date) : "",
      e.work_period || "",
      e.hours       ? String(e.hours) : "",
      e.purpose     || "",
      e.signature   || "",
      e.supervisor_signature || "",
    ];

    vals.forEach((v, c) => {
      doc.rect(CX[c], RY, CW[c], DATA_H);
      if (!v) return;

      lat(doc,"normal");
      doc.setFontSize(c === 0 ? 9 : 7.5);
      doc.setTextColor(0);

      if (c === 0) {
        // S/N centred
        doc.text(v, CX[c] + CW[c]/2, RY + DATA_H/2 + 1.3, { align: "center" });
      } else {
        const maxW = CW[c] - 3;
        const lines = doc.splitTextToSize(v, maxW);
        const lh  = 3.6;
        const th  = lines.length * lh;
        const ty  = RY + (DATA_H - th) / 2 + lh * 0.8;
        lines.forEach((ln, li) => doc.text(ln, CX[c] + 2, ty + li * lh));
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 4 — SUMMARY (3 rows at bottom)
  // ════════════════════════════════════════════════════════════════════════════

  // Totals
  const weekdayTotal = safeRows.reduce((s,e) => s + (!e.is_holiday && e.hours ? parseFloat(e.hours)||0 : 0), 0);
  const holidayTotal = safeRows.reduce((s,e) => s + ( e.is_holiday && e.hours ? parseFloat(e.hours)||0 : 0), 0);

  const SUMROWS = [
    { zh:"月度平时加班小时合计", en:"Total Weekday Overtime Hours", val: weekdayTotal > 0 ? weekdayTotal.toFixed(1) : "" },
    { zh:"月度假期加班小时合计", en:"Total Holiday Overtime Hours",  val: holidayTotal > 0 ? holidayTotal.toFixed(1) : "" },
    { zh:"部门负责人签字",       en:"Dept. Manager's Signature",      val: "" },
  ];

  // Label cell = first 3 columns merged (NO + DATE + WORK PERIOD)
  const LBL_W = CW[0] + CW[1] + CW[2];
  const VAL_W = W - LBL_W;

  // Heavy divider above summary
  doc.setLineWidth(0.7);
  doc.line(ML, TABLE_END, ML + W, TABLE_END);

  doc.setLineWidth(0.4);
  SUMROWS.forEach((sr, i) => {
    const SY = TABLE_END + i * SUMMARY_ROW_H;

    // Cells
    doc.rect(ML,           SY, LBL_W, SUMMARY_ROW_H);
    doc.rect(ML + LBL_W,   SY, VAL_W, SUMMARY_ROW_H);

    // Chinese label — bold, top of cell
    cjk(doc); doc.setFontSize(8);
    doc.text(sr.zh, ML + LBL_W/2, SY + 4.5, { align: "center" });

    // English label — italic, below Chinese
    lat(doc,"italic"); doc.setFontSize(7);
    doc.text(sr.en, ML + LBL_W/2, SY + 8.8, { align: "center" });

    // Value
    if (sr.val) {
      lat(doc,"bold"); doc.setFontSize(12);
      doc.text(sr.val, ML + LBL_W + 8, SY + SUMMARY_ROW_H/2 + 2);
    }
  });

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(filename || `Overtime_${employeeName || "Sheet"}_${month || "Month"}.pdf`);
}

// ─── Date formatter ───────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return "";
  try {
    const d = new Date(str + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  } catch { return str; }
}
