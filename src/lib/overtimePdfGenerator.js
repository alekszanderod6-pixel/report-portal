/**
 * Monthly Overtime Authorization Sheet — PDF Generator
 * Landscape A4, exact replica of the physical form
 * 月度加班授权表
 */

export async function downloadOvertimePDF(sheetData, filename) {
  const { default: jsPDF } = await import("jspdf");

  const { dept, month, employeeName, entries } = sheetData;
  const safeEntries = Array.isArray(entries) ? entries : [];

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();  // 297mm
  const ph = doc.internal.pageSize.getHeight(); // 210mm
  const mL = 10, mR = 10, mT = 8, mB = 8;

  const usable = pw - mL - mR; // 277mm
  const totalH = ph - mT - mB; // 194mm

  // ── Outer border ─────────────────────────────────────────────────────────────
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.rect(mL, mT, usable, totalH);

  // ── Title block (top ~20mm) ───────────────────────────────────────────────────
  const titleBlockH = 20;

  // Chinese title — top-left, two lines stacked
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text("\u6708\u5EA6\u52A0\u73ED\u6388\u6743\u8868", mL + 2, mT + 7); // 月度加班授权表

  // English main title — centered
  doc.setFontSize(13);
  doc.text("MONTHLY OVERTIM AUTHORIZATION SHEET", pw / 2, mT + 8, { align: "center" });

  // Info row: Dept | Month | Name
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  // Dept
  const deptLabel = "\u90E8\u95E8 Dept.  "; // 部门 Dept.
  doc.text(deptLabel, mL + 2, mT + 15);
  doc.setFont("helvetica", "bold");
  doc.text(dept || "Maintenance: I&C", mL + 22, mT + 15);

  // Month
  doc.setFont("helvetica", "normal");
  doc.text("\u6708\u4EFD MONTH:", pw / 2 - 22, mT + 15); // 月份
  doc.setFont("helvetica", "bold");
  doc.text(month || "", pw / 2 - 1, mT + 15);

  // Name
  doc.setFont("helvetica", "normal");
  doc.text("\u59D3\u540D NAME:", pw - mR - 58, mT + 15); // 姓名
  doc.setFont("helvetica", "bold");
  doc.text(employeeName || "", pw - mR - 42, mT + 15);

  // Horizontal divider under title block
  doc.setLineWidth(0.5);
  doc.line(mL, mT + titleBlockH, mL + usable, mT + titleBlockH);

  // ── Layout measurements ───────────────────────────────────────────────────────
  // Summary section at bottom: 3 rows × 8mm = 24mm
  const summaryRowH = 8;
  const summaryRows = 3;
  const summaryH = summaryRows * summaryRowH;

  const tableStartY = mT + titleBlockH;
  const tableEndY = mT + totalH - summaryH;
  const tableH = tableEndY - tableStartY;

  // ── Column widths (total = usable = 277mm) ────────────────────────────────────
  // S/N | DATE | WORK PERIOD | HOURS | PURPOSE | SIGNATURE | SUPERVISOR SIG
  const rawCols = [12, 26, 32, 18, 83, 40, 40];
  const rawSum = rawCols.reduce((a, b) => a + b, 0);
  const scale = usable / rawSum;
  const cw = rawCols.map(w => +(w * scale).toFixed(3));
  // Fix floating point: assign remainder to longest col
  const cwSum = cw.reduce((a, b) => a + b, 0);
  cw[4] += usable - cwSum;

  const colX = []; // left x of each column
  let cx = mL;
  cw.forEach(w => { colX.push(cx); cx += w; });

  // ── Table header ──────────────────────────────────────────────────────────────
  const headerH = 13;
  const dataRows = 9;
  const dataRowH = (tableH - headerH) / dataRows;

  const headers = [
    { en: "NO.", zh: "\u5E8F\u53F7" },          // 序号
    { en: "DATE", zh: "\u65E5\u671F" },           // 日期
    { en: "WORK PERIOD", zh: "\u52A0\u73ED\u65F6\u95F4" }, // 加班时间
    { en: "HOURS", zh: "\u5C0F\u65F6\u6570" },   // 小时数
    { en: "PURPOSE", zh: "\u52A0\u73ED\u76EE\u7684" }, // 加班目的
    { en: "SIGNATURE", zh: "" },
    { en: "SUPERVISOR\nSIGNATURE", zh: "\u4E3B\u7BA1\u7B7E\u540D" }, // 主管签名
  ];

  doc.setLineWidth(0.35);

  headers.forEach((h, i) => {
    const x = colX[i];
    const w = cw[i];
    doc.rect(x, tableStartY, w, headerH);

    const midX = x + w / 2;

    // English bold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0);

    if (h.en.includes("\n")) {
      const parts = h.en.split("\n");
      doc.text(parts[0], midX, tableStartY + 4, { align: "center" });
      doc.text(parts[1], midX, tableStartY + 8, { align: "center" });
    } else {
      doc.text(h.en, midX, tableStartY + (h.zh ? 5.5 : 7), { align: "center" });
    }

    // Chinese below
    if (h.zh) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(h.zh, midX, tableStartY + 11, { align: "center" });
    }
  });

  // ── Data rows ─────────────────────────────────────────────────────────────────
  for (let row = 0; row < dataRows; row++) {
    const ry = tableStartY + headerH + row * dataRowH;
    const entry = safeEntries[row] || {};

    headers.forEach((h, col) => {
      doc.setLineWidth(0.2);
      doc.rect(colX[col], ry, cw[col], dataRowH);

      let val = "";
      switch (col) {
        case 0: val = String(row + 1); break;
        case 1: val = entry.date || ""; break;
        case 2: val = entry.work_period || ""; break;
        case 3: val = entry.hours ? String(entry.hours) : ""; break;
        case 4: val = entry.purpose || ""; break;
        case 5: val = entry.signature || ""; break;
        case 6: val = entry.supervisor_signature || ""; break;
      }

      if (val) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(col === 0 ? 8 : 7.5);
        doc.setTextColor(0);

        const maxW = cw[col] - 3;
        const lines = doc.splitTextToSize(val, maxW);
        const lineH = 3.5;
        const textH = lines.length * lineH;
        const baseY = ry + (dataRowH + lineH * 0.8) / 2 - (textH / 2);

        if (col === 0) {
          lines.forEach((ln, li) => doc.text(ln, colX[col] + cw[col] / 2, baseY + li * lineH, { align: "center" }));
        } else {
          lines.forEach((ln, li) => doc.text(ln, colX[col] + 1.8, baseY + li * lineH));
        }
      }
    });
  }

  // ── Summary section ───────────────────────────────────────────────────────────
  // Label cols = first 3 merged; value col = rest
  const labelW = cw[0] + cw[1] + cw[2];
  const valueW = usable - labelW;

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
      zh: "\u6708\u5EA6\u5E73\u65E5\u52A0\u73ED\u5C0F\u65F6\u603B\u8BA1", // 月度平日加班小时总计
      en: "Total Weekday Overtime Hours",
      val: weekdayTotal > 0 ? weekdayTotal.toFixed(1) : "",
    },
    {
      zh: "\u6708\u5EA6\u5047\u65E5\u52A0\u73ED\u5C0F\u65F6\u603B\u8BA1", // 月度假日加班小时总计
      en: "Total Holiday Overtime Hours",
      val: holidayTotal > 0 ? holidayTotal.toFixed(1) : "",
    },
    {
      zh: "\u90E8\u95E8\u7ECF\u7406\u4EBA\u7B7E\u540D", // 部门经理人签名
      en: "Dept. Manager's Signature",
      val: "",
    },
  ];

  summaryData.forEach((sr, i) => {
    const sy = tableEndY + i * summaryRowH;
    doc.setLineWidth(0.3);
    doc.rect(mL, sy, labelW, summaryRowH);
    doc.rect(mL + labelW, sy, valueW, summaryRowH);

    // Label — Chinese bold top, English smaller below
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0);
    doc.text(sr.zh, mL + 2, sy + 3.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(sr.en, mL + 2, sy + 7);

    // Value
    if (sr.val) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(sr.val, mL + labelW + 4, sy + 5.5);
    }
  });

  doc.save(filename || `Overtime_${employeeName || "Sheet"}_${month || "Month"}.pdf`);
}
