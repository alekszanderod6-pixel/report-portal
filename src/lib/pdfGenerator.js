export async function generateReportPDF(reportData) {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const { name, dateFrom, dateTo, entries, logoBase64 } = reportData;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 12;
  let pc = 0;

  function footer() {
    pc++;
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text(pc + " | P a g e", m, ph - 10);
  }

  // Logo top-right
  if (logoBase64) {
    try { doc.addImage(logoBase64, "JPEG", pw - m - 15, 18, 13, 12); }
    catch (e) { drawLogo(doc, pw - m - 15, 18); }
  } else {
    drawLogo(doc, pw - m - 15, 18);
  }

  // Header text
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text("SUNON ASOGLI POWER", m, 14);
  doc.setFontSize(12);
  doc.text("SHENZHEN ENERGY ASOGLI POWER", m, 21);
  doc.setFontSize(13);
  doc.text("2026 INDIVIDUAL WEEKLY SUMMARY", m, 28);

  // Divider
  doc.setDrawColor(232, 146, 11);
  doc.setLineWidth(1.2);
  doc.line(m, 31, pw - m, 31);

  // Subtitle + name/date
  doc.setFontSize(12);
  doc.text("Weekly Summary", pw / 2, 39, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const ds = fmtDate(dateFrom, dateTo);
  doc.text("Name: " + name, m, 46);
  doc.text("Date: " + ds, pw - m, 46, { align: "right" });

  // Strip formatting markers for PDF plain text
  function sf(html) {
    if (!html) return "";
    return html
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<div[^>]*>/gi, "")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .trim();
  }

  const body = entries.map(function (e, i) {
    return [
      String(i + 1),
      sf(e.important_work),
      sf(e.completion_process),
      e.is_completed || "In Progress",
      sf(e.spare_parts) || "None"
    ];
  });

  const cw = [16, 36, 76, 20, 38];

  doc.autoTable({
    startY: 50,
    margin: { left: m, right: m },
    head: [[
      { content: "Serial\nNumber", styles: { halign: "center", valign: "middle", cellWidth: cw[0], fontSize: 8.5, cellPadding: 4 } },
      { content: "Important Work", styles: { halign: "center", valign: "middle", cellWidth: cw[1], fontSize: 8.5, cellPadding: 4 } },
      { content: "Completion, Process\nAnd Results", styles: { halign: "center", valign: "middle", cellWidth: cw[2], fontSize: 8.5, cellPadding: 4 } },
      { content: "Is it\ncompleted?", styles: { halign: "center", valign: "middle", cellWidth: cw[3], fontSize: 8.5, cellPadding: 4 } },
      { content: "Detailed Model Numbers\nOf The Spare Parts Used", styles: { halign: "center", valign: "middle", cellWidth: cw[4], fontSize: 8.5, cellPadding: 4 } }
    ]],
    body: body,
    columnStyles: {
      0: { cellWidth: cw[0], halign: "center", valign: "middle", fontSize: 9, cellPadding: 3 },
      1: { cellWidth: cw[1], valign: "top", fontSize: 8.5, cellPadding: 3 },
      2: { cellWidth: cw[2], valign: "top", fontSize: 8.5, cellPadding: 3 },
      3: { cellWidth: cw[3], halign: "center", valign: "middle", fontSize: 9, cellPadding: 3 },
      4: { cellWidth: cw[4], valign: "top", fontSize: 8, cellPadding: 3 }
    },
    headStyles: {
      fillColor: [255, 255, 255], textColor: [0, 0, 0],
      fontStyle: "bold", lineWidth: 0.3, lineColor: [0, 0, 0]
    },
    bodyStyles: {
      textColor: [0, 0, 0], lineWidth: 0.2,
      lineColor: [0, 0, 0], cellPadding: 3
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.2,
    didDrawPage: function () { footer(); }
  });

  if (pc === 0) footer();
  return doc;
}

function drawLogo(doc, x, y) {
  doc.setFillColor(232, 146, 11);
  doc.roundedRect(x, y, 13, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("EEA", x + 6.5, y + 7.5, { align: "center" });
}

function ord(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fmtDate(from, to) {
  if (!from || !to) return "";
  const mo = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const fd = new Date(from);
  const td = new Date(to);
  const yr = td.getFullYear();
  if (fd.getMonth() === td.getMonth()) {
    return mo[fd.getMonth()] + " " + ord(fd.getDate()) + " - " + ord(td.getDate()) + ", " + yr;
  }
  return mo[fd.getMonth()] + " " + ord(fd.getDate()) + " \u2013 " + mo[td.getMonth()] + " " + ord(td.getDate()) + ", " + yr;
}

export async function downloadReportPDF(data, filename) {
  const doc = await generateReportPDF(data);
  doc.save(filename || "Weekly_Summary_" + data.name + "_" + data.dateFrom + ".pdf");
}
