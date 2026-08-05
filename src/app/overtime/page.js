"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, getCurrentProfile } from "@/lib/supabase";
import { downloadOvertimePDF } from "@/lib/overtimePdfGenerator";
import Navbar from "@/components/Navbar";
import { showToast } from "@/components/Toast";

// 9 blank entry rows
const BLANK_ENTRIES = Array.from({ length: 9 }, () => ({
  date: "",
  work_period: "",
  hours: "",
  purpose: "",
  is_holiday: false,
  signature: "",
  supervisor_signature: "",
}));

function OvertimeEditor() {
  const sp = useSearchParams();
  const editId = sp.get("id");
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Header fields
  const [dept, setDept] = useState("Maintenance: I&C");
  const [month, setMonth] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  // 9 entry rows
  const [entries, setEntries] = useState(BLANK_ENTRIES);
  const [sheetId, setSheetId] = useState(null);
  const [status, setStatus] = useState("draft");

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const p = await getCurrentProfile();
      if (!p) { router.push("/"); return; }
      setProfile(p);
      setEmployeeName(p.name || "");

      // Default month to current month
      const now = new Date();
      const monthStr = now.toLocaleString("en-US", { month: "long" }) + " " + now.getFullYear();
      setMonth(monthStr);

      if (editId) {
        const { data: sheet, error } = await supabase
          .from("overtime_sheets")
          .select("*")
          .eq("id", editId)
          .eq("user_id", user.id)
          .single();

        if (error || !sheet) {
          showToast("Sheet not found", "error");
          router.push("/overtime");
          return;
        }

        setSheetId(sheet.id);
        setDept(sheet.dept || "Maintenance: I&C");
        setMonth(sheet.month || monthStr);
        setEmployeeName(sheet.employee_name || p.name || "");
        setStatus(sheet.status || "draft");

        // Merge saved entries with blank template (always 9 rows)
        const saved = Array.isArray(sheet.entries) ? sheet.entries : [];
        const merged = BLANK_ENTRIES.map((blank, i) => saved[i] ? { ...blank, ...saved[i] } : blank);
        setEntries(merged);
      }
    } catch (err) {
      showToast("Load error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function updateEntry(idx, field, value) {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  // Computed totals
  const weekdayHours = entries.reduce((s, e) => s + (!e.is_holiday && e.hours ? parseFloat(e.hours) || 0 : 0), 0);
  const holidayHours = entries.reduce((s, e) => s + (e.is_holiday && e.hours ? parseFloat(e.hours) || 0 : 0), 0);
  const filledRows = entries.filter(e => e.date || e.purpose || e.hours).length;

  async function save(newStatus = "draft") {
    if (!employeeName.trim()) { showToast("Enter employee name", "warning"); return; }
    if (!month.trim()) { showToast("Enter month", "warning"); return; }

    setSaving(true);
    try {
      const payload = {
        user_id: profile.id,
        dept: dept.trim(),
        month: month.trim(),
        employee_name: employeeName.trim(),
        status: newStatus,
        entries,
      };

      let id = sheetId;
      if (id) {
        const { error } = await supabase.from("overtime_sheets").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("overtime_sheets").insert(payload).select().single();
        if (error) throw error;
        id = data.id;
        setSheetId(id);
        // Update URL so refresh doesn't duplicate
        window.history.replaceState(null, "", "/overtime?id=" + id);
      }

      setStatus(newStatus);
      showToast(newStatus === "completed" ? "Sheet completed!" : "Draft saved!", "success");
    } catch (err) {
      showToast("Save failed: " + (err.message || "Unknown error"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function exportPDF() {
    await save("completed");
    setExporting(true);
    try {
      await downloadOvertimePDF(
        { dept, month, employeeName, entries },
        `Overtime_${employeeName.replace(/\s+/g, "_")}_${month.replace(/\s+/g, "_")}.pdf`
      );
      showToast("PDF downloaded!", "success");
    } catch (err) {
      showToast("PDF failed: " + (err.message || "Unknown"), "error");
    } finally {
      setExporting(false);
    }
  }

  // Shared input style
  const cellInput = (extraStyle = {}) => ({
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.8rem",
    color: "var(--fg)",
    padding: "0 4px",
    ...extraStyle,
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
    </div>
  );

  if (!profile) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => router.push("/overtime")} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 className="font-display font-bold text-2xl" style={{ color: "var(--navy)" }}>
                月度加班授权表
              </h1>
            </div>
            <p className="text-gray-500 text-sm">Monthly Overtime Authorization Sheet
              {" · "}{editId ? (status === "completed" ? "Completed" : "Draft") : "New Sheet"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => save("draft")} disabled={saving} className="btn btn-outline">
              {saving && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button onClick={exportPDF} disabled={exporting || saving} className="btn btn-primary">
              {exporting && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {exporting ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* ── Main form card ── */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

          {/* ── Title bar ── */}
          <div className="px-6 py-5 text-center" style={{ borderBottom: "2px solid #000", background: "white" }}>
            <div className="flex items-start justify-between">
              {/* Chinese title left */}
              <div className="text-left">
                <div className="font-bold text-base leading-tight" style={{ color: "#000", fontFamily: "serif" }}>
                  月度加班授权表
                </div>
              </div>
              {/* English title center */}
              <div className="flex-1 text-center">
                <h2 className="font-bold text-xl tracking-wide" style={{ color: "#000", fontFamily: "serif" }}>
                  MONTHLY OVERTIM AUTHORIZATION SHEET
                </h2>
              </div>
              <div style={{ width: 120 }} />
            </div>

            {/* Info row */}
            <div className="flex items-center justify-between mt-4 gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "#000" }}>部门 Dept.</span>
                <input
                  type="text"
                  value={dept}
                  onChange={e => setDept(e.target.value)}
                  className="input"
                  style={{ width: 160, fontSize: "0.85rem", padding: "0.3rem 0.6rem" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "#000" }}>月份 MONTH:</span>
                <input
                  type="text"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  placeholder="e.g. July 2026"
                  className="input"
                  style={{ width: 140, fontSize: "0.85rem", padding: "0.3rem 0.6rem" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "#000" }}>姓名 NAME:</span>
                <input
                  type="text"
                  value={employeeName}
                  onChange={e => setEmployeeName(e.target.value)}
                  className="input"
                  style={{ width: 160, fontSize: "0.85rem", padding: "0.3rem 0.6rem" }}
                />
              </div>
            </div>
          </div>

          {/* ── Entries table ── */}
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#000", color: "#fff" }}>
                  {[
                    { en: "NO.", zh: "序号", w: "4%" },
                    { en: "DATE", zh: "日期", w: "10%" },
                    { en: "WORK PERIOD", zh: "加班时间", w: "12%" },
                    { en: "HOURS", zh: "小时数", w: "7%" },
                    { en: "PURPOSE", zh: "加班目的", w: "33%" },
                    { en: "SIGNATURE", zh: "", w: "14%" },
                    { en: "SUPERVISOR SIGNATURE", zh: "主管签名", w: "14%" },
                    { en: "HOLIDAY?", zh: "假日", w: "6%" },
                  ].map((h, i) => (
                    <th key={i} style={{
                      width: h.w,
                      padding: "8px 6px",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      letterSpacing: "0.03em",
                      border: "1px solid #555",
                      lineHeight: 1.3,
                    }}>
                      <div>{h.en}</div>
                      {h.zh && <div style={{ fontSize: "0.65rem", opacity: 0.85, marginTop: 1 }}>{h.zh}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    {/* S/N */}
                    <td style={{ textAlign: "center", fontWeight: 700, color: "var(--navy)", border: "1px solid var(--border)", padding: "6px 4px" }}>
                      {idx + 1}
                    </td>
                    {/* Date */}
                    <td style={{ border: "1px solid var(--border)", padding: "4px" }}>
                      <input
                        type="date"
                        value={entry.date}
                        onChange={e => updateEntry(idx, "date", e.target.value)}
                        style={{ ...cellInput(), minWidth: 100 }}
                      />
                    </td>
                    {/* Work Period */}
                    <td style={{ border: "1px solid var(--border)", padding: "4px" }}>
                      <input
                        type="text"
                        value={entry.work_period}
                        onChange={e => updateEntry(idx, "work_period", e.target.value)}
                        placeholder="e.g. 08:00–12:00"
                        style={cellInput()}
                      />
                    </td>
                    {/* Hours */}
                    <td style={{ border: "1px solid var(--border)", padding: "4px" }}>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={entry.hours}
                        onChange={e => updateEntry(idx, "hours", e.target.value)}
                        placeholder="0"
                        style={{ ...cellInput(), textAlign: "center" }}
                      />
                    </td>
                    {/* Purpose */}
                    <td style={{ border: "1px solid var(--border)", padding: "4px" }}>
                      <textarea
                        value={entry.purpose}
                        onChange={e => updateEntry(idx, "purpose", e.target.value)}
                        placeholder="Describe the overtime work..."
                        rows={2}
                        style={{ ...cellInput(), resize: "vertical", minHeight: 44, lineHeight: 1.5 }}
                      />
                    </td>
                    {/* Signature */}
                    <td style={{ border: "1px solid var(--border)", padding: "4px" }}>
                      <input
                        type="text"
                        value={entry.signature}
                        onChange={e => updateEntry(idx, "signature", e.target.value)}
                        placeholder="Signature"
                        style={cellInput()}
                      />
                    </td>
                    {/* Supervisor Signature */}
                    <td style={{ border: "1px solid var(--border)", padding: "4px" }}>
                      <input
                        type="text"
                        value={entry.supervisor_signature}
                        onChange={e => updateEntry(idx, "supervisor_signature", e.target.value)}
                        placeholder="Supervisor"
                        style={cellInput()}
                      />
                    </td>
                    {/* Holiday checkbox */}
                    <td style={{ border: "1px solid var(--border)", padding: "4px", textAlign: "center" }}>
                      <label className="flex flex-col items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!entry.is_holiday}
                          onChange={e => updateEntry(idx, "is_holiday", e.target.checked)}
                          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }}
                        />
                        <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>
                          {entry.is_holiday ? "Holiday" : "Weekday"}
                        </span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Summary section ── */}
          <div style={{ borderTop: "2px solid #000" }}>
            {[
              {
                zh: "月度平日加班小时总计",
                en: "Total Weekday Overtime Hours",
                val: weekdayHours > 0 ? weekdayHours.toFixed(1) : "—",
                color: "var(--navy)",
              },
              {
                zh: "月度假日加班小时总计",
                en: "Total Holiday Overtime Hours",
                val: holidayHours > 0 ? holidayHours.toFixed(1) : "—",
                color: "var(--accent)",
              },
              {
                zh: "部门经理人签名",
                en: "Dept. Manager's Signature",
                val: "",
                color: "var(--muted)",
                isSignature: true,
              },
            ].map((row, i) => (
              <div key={i} className="flex items-center" style={{
                borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                minHeight: 40,
              }}>
                <div style={{ flex: "0 0 260px", padding: "8px 14px", borderRight: "1px solid var(--border)" }}>
                  <div className="font-bold text-sm" style={{ color: "#000" }}>{row.zh}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{row.en}</div>
                </div>
                <div style={{ flex: 1, padding: "8px 14px" }}>
                  {row.isSignature ? (
                    <div style={{ height: 24, borderBottom: "1px dashed var(--border)", width: 200 }} />
                  ) : (
                    <span className="font-bold text-xl" style={{ color: row.color }}>
                      {row.val} {row.val !== "—" ? "hrs" : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tips card ── */}
        <div className="mt-6 rounded-xl p-5" style={{
          background: "linear-gradient(135deg,#0C2340 0%,#1A3A5C 100%)",
          border: "1px solid rgba(232,146,11,0.2)"
        }}>
          <h3 className="font-display font-semibold text-sm text-white mb-3">Tips</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-xs text-gray-400 leading-relaxed">
            <p><span style={{ color: "var(--accent)" }}>WORK PERIOD</span> — Enter the time range, e.g. "08:00–12:00" or "14:00–18:00"</p>
            <p><span style={{ color: "var(--accent)" }}>HOLIDAY?</span> — Check the box if the overtime falls on a public holiday or weekend; affects the totals at the bottom</p>
            <p><span style={{ color: "var(--accent)" }}>Download PDF</span> — Saves the sheet as a landscape A4 PDF that matches the physical form exactly</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OvertimePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      </div>
    }>
      <OvertimeEditor />
    </Suspense>
  );
}
