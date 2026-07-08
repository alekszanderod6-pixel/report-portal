"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, getCurrentProfile } from "@/lib/supabase";
import { downloadReportPDF } from "@/lib/pdfGenerator";
import { paraphraseField } from "@/lib/paraphraser";
import Navbar from "@/components/Navbar";
import { showToast } from "@/components/Toast";

function Editor() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [paraphrasing, setParaphrasing] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);

  const [reportName, setReportName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportId, setReportId] = useState(null);
  const [reportStatus, setReportStatus] = useState("draft");
  const [entries, setEntries] = useState([]);
  const [cur, setCur] = useState({ important_work: "", completion_process: "", is_completed: "In Progress", spare_parts: "" });
  const [editIdx, setEditIdx] = useState(null);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/"; return; }
    const p = await getCurrentProfile();
    setProfile(p);
    if (editId) {
      const { data: r } = await supabase.from("reports").select("*").eq("id", editId).eq("user_id", user.id).single();
      if (!r) { showToast("Report not found", "error"); window.location.href = "/dashboard"; return; }
      setReportId(r.id); setReportName(r.name); setDateFrom(r.date_from); setDateTo(r.date_to); setReportStatus(r.status);
      const { data: e } = await supabase.from("report_entries").select("*").eq("report_id", r.id).order("serial_number");
      setEntries(e || []);
      var savedLogo = null;
      try { savedLogo = localStorage.getItem("logo_" + r.id); } catch(x) {}
      if (savedLogo) setLogoBase64(savedLogo);
      setLoading(false);
    } else {
      const today = new Date();
      const dow = today.getDay();
      const mon = new Date(today); mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      setDateFrom(mon.toISOString().split("T")[0]);
      setDateTo(sun.toISOString().split("T")[0]);
      setReportName(p && p.name ? p.name : "");
    }
  }

  function handleLogo(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) { showToast("Logo must be under 2MB", "warning"); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
      var base64 = ev.target.result;
      setLogoBase64(base64);
      if (reportId) { try { localStorage.setItem("logo_" + reportId, base64); } catch(x) {} }
      showToast("Logo uploaded!", "success");
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoBase64(null);
    if (reportId) { try { localStorage.removeItem("logo_" + reportId); } catch(x) {} }
    if (fileRef.current) fileRef.current.value = "";
  }

  const setC = (f, v) => setCur((p) => ({ ...p, [f]: v }));

  function enhance(field) {
    setParaphrasing(field);
    setTimeout(() => {
      setC(field, paraphraseField(cur[field]));
      setParaphrasing(null);
      showToast("Text enhanced", "success");
    }, 350);
  }

  function addOrUpdate() {
    if (!cur.important_work.trim()) { showToast("Enter the important work", "warning"); return; }
    if (!cur.completion_process.trim()) { showToast("Enter completion process", "warning"); return; }
    if (editIdx !== null) {
      setEntries((p) => p.map((e, i) => (i === editIdx ? { ...e, ...cur } : e)));
      setEditIdx(null);
      showToast("Entry updated", "success");
    } else {
      setEntries((p) => [...p, { id: null, serial_number: p.length + 1, ...cur }]);
      showToast("Entry added", "success");
    }
    setCur({ important_work: "", completion_process: "", is_completed: "In Progress", spare_parts: "" });
  }

  function editEntry(i) {
    var e = entries[i];
    setCur({ important_work: e.important_work, completion_process: e.completion_process, is_completed: e.is_completed, spare_parts: e.spare_parts });
    setEditIdx(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeEntry(i) {
    if (!confirm("Remove this entry?")) return;
    setEntries((p) => p.filter((_, x) => x !== i).map((e, x) => ({ ...e, serial_number: x + 1 })));
    showToast("Entry removed", "info");
  }

  async function save(status) {
    if (status === undefined) status = "draft";
    if (!reportName.trim()) { showToast("Enter your name", "warning"); return; }
    if (!dateFrom || !dateTo) { showToast("Select date range", "warning"); return; }
    setSaving(true);
    try {
      var rid = reportId;
      if (rid) {
        await supabase.from("reports").update({ name: reportName.trim(), date_from: dateFrom, date_to: dateTo, status: status }).eq("id", rid);
        await supabase.from("report_entries").delete().eq("report_id", rid);
      } else {
        const { data: nr } = await supabase.from("reports").insert({ user_id: profile.id, name: reportName.trim(), date_from: dateFrom, date_to: dateTo, status: status }).select().single();
        rid = nr.id; setReportId(rid);
      }
      if (logoBase64 && rid) { try { localStorage.setItem("logo_" + rid, logoBase64); } catch(x) {} }
      if (entries.length) {
        await supabase.from("report_entries").insert(entries.map((e, i) => ({ report_id: rid, serial_number: i + 1, important_work: e.important_work, completion_process: e.completion_process, is_completed: e.is_completed, spare_parts: e.spare_parts || "" })));
      }
      setReportStatus(status);
      showToast(status === "completed" ? "Report completed!" : "Draft saved!", "success");
    } catch (err) { showToast("Save failed", "error"); }
    finally { setSaving(false); }
  }

  async function exportPDF() {
    if (!entries.length) { showToast("Add at least one entry", "warning"); return; }
    await save("completed");
    setExporting(true);
    try {
      await downloadReportPDF({ name: reportName, dateFrom: dateFrom, dateTo: dateTo, entries: entries, logoBase64: logoBase64 }, "Weekly_Summary_" + reportName.replace(/\s+/g, "_") + "_" + dateFrom + ".pdf");
      showToast("PDF downloaded!", "success");
    } catch (err) { showToast("PDF failed", "error"); }
    finally { setExporting(false); }
  }

  const fmtD = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  function EnhanceBtn(props) {
    return (
      <button onClick={() => enhance(props.field)} disabled={paraphrasing === props.field || !cur[props.field].trim()}
        className="btn btn-sm" style={{ background: "#F3F4F6", color: "var(--navy)", fontSize: "0.7rem" }}>
        {paraphrasing === props.field ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> :
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
        Enhance
      </button>
    );
  }

  if (!profile || loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--navy)" }}>{editId ? "Edit Report" : "New Weekly Report"}</h1>
            <p className="text-gray-500 text-sm mt-1">{editId ? "Editing - " + (reportStatus === "completed" ? "Completed" : "Draft") : "Fill in your weekly work summary"}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => save("draft")} disabled={saving} className="btn btn-outline">
              {saving && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button onClick={exportPDF} disabled={exporting || !entries.length} className="btn btn-primary">
              {exporting && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {exporting ? "Generating..." : "Export PDF"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid var(--border)" }}>
              <h2 className="font-display font-semibold text-lg mb-4" style={{ color: "var(--navy)" }}>Report Information</h2>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Name</label>
                  <input type="text" value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="Your full name" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Date From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Date To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "#F8FAFC", border: "1px dashed var(--border)" }}>
                <div>
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Logo" className="w-14 h-14 rounded-lg object-contain" style={{ border: "1px solid var(--border)" }} />
                  ) : (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
                      <span className="text-white font-bold text-xs">LOGO</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Company Logo</p>
                  <p className="text-xs text-gray-400">Upload your company logo to appear on the PDF</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileRef} accept="image/*" onChange={handleLogo} className="hidden" />
                  <button onClick={() => fileRef.current.click()} className="btn btn-outline btn-sm">Upload</button>
                  {logoBase64 && <button onClick={removeLogo} className="btn btn-sm" style={{ background: "transparent", color: "var(--danger)" }}>Remove</button>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid var(--border)" }}>
              <h2 className="font-display font-semibold text-lg mb-1" style={{ color: "var(--navy)" }}>{editIdx !== null ? "Edit Entry #" + (editIdx + 1) : "Add Work Entry"}</h2>
              <p className="text-gray-400 text-xs mb-4">Serial Number: {editIdx !== null ? editIdx + 1 : entries.length + 1}</p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">Important Work</label>
                    <EnhanceBtn field="important_work" />
                  </div>
                  <textarea value={cur.important_work} onChange={(e) => setC("important_work", e.target.value)} placeholder="e.g. Installation of Two New 75 Inches Huawei Television at CCR for CCTV Display" rows={2} className="input" style={{ resize: "vertical", minHeight: 60 }} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">Completion, Process And Results</label>
                    <EnhanceBtn field="completion_process" />
                  </div>
                  <textarea value={cur.completion_process} onChange={(e) => setC("completion_process", e.target.value)} placeholder={"1. Set laser level...\n2. Projected laser...\nResults: Two new TVs mounted level..."} rows={5} className="input" style={{ resize: "vertical", minHeight: 100 }} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Is it Completed?</label>
                    <select value={cur.is_completed} onChange={(e) => setC("is_completed", e.target.value)} className="input">
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Spare Parts Model Numbers</label>
                    <textarea value={cur.spare_parts} onChange={(e) => setC("spare_parts", e.target.value)} placeholder={"1. Bracket Model: DS-1602ZJ\n2. Power adapter Model: 57A241500\n(or None)"} rows={3} className="input" style={{ resize: "vertical", minHeight: 60 }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button onClick={addOrUpdate} className="btn btn-navy">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={editIdx !== null ? "M4.5 12.75l6 6 9-13.5" : "M12 4v16m8-8H4"} /></svg>
                    {editIdx !== null ? "Update Entry" : "Add Entry"}
                  </button>
                  {editIdx !== null && (
                    <button onClick={() => { setEditIdx(null); setCur({ important_work: "", completion_process: "", is_completed: "In Progress", spare_parts: "" }); }} className="btn btn-outline">Cancel Edit</button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="font-display font-semibold text-lg" style={{ color: "var(--navy)" }}>Report Entries</h2>
                <span className="text-sm text-gray-400">{entries.length} entr{entries.length !== 1 ? "ies" : "y"}</span>
              </div>
              {!entries.length ? (
                <div className="p-8 text-center text-gray-400 text-sm">No entries yet. Add your first work item above.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="report-preview-table">
                    <thead><tr>
                      <th style={{ width: 40 }}>S/N</th>
                      <th style={{ width: "20%" }}>Important Work</th>
                      <th style={{ width: "40%" }}>Completion, Process And Results</th>
                      <th style={{ width: 80 }}>Completed?</th>
                      <th style={{ width: "18%" }}>Spare Parts</th>
                      <th style={{ width: 70 }}>Actions</th>
                    </tr></thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr key={i}>
                          <td className="text-center font-semibold" style={{ color: "var(--navy)" }}>{i + 1}</td>
                          <td><div style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{e.important_work}</div></td>
                          <td><div style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-line" }}>{e.completion_process}</div></td>
                          <td className="text-center">
                            {e.is_completed === "Yes" && <span className="badge badge-success">Yes</span>}
                            {e.is_completed === "No" && <span className="badge badge-danger">No</span>}
                            {e.is_completed === "In Progress" && <span className="badge badge-warning">In Progress</span>}
                          </td>
                          <td style={{ fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "pre-line" }}>{e.spare_parts || "\u2014"}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button onClick={() => editEntry(i)} className="p-1 rounded hover:bg-gray-100"><svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>
                              <button onClick={() => removeEntry(i)} className="p-1 rounded hover:bg-red-50"><svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5" style={{ border: "1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-sm mb-3" style={{ color: "var(--navy)" }}>Report Summary</h3>
              <div className="space-y-3 text-sm">
                {[["Period", fmtD(dateFrom) + " \u2013 " + fmtD(dateTo)], ["Entries", entries.length], ["Completed", entries.filter((e) => e.is_completed === "Yes").length], ["In Progress", entries.filter((e) => e.is_completed === "In Progress").length], ["Not Done", entries.filter((e) => e.is_completed === "No").length]].map(([l, v], i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-medium" style={i === 2 ? { color: "var(--success)" } : i === 3 ? { color: "var(--warning)" } : i === 4 ? { color: "var(--danger)" } : {}}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }} className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  {reportStatus === "completed" ? <span className="badge badge-success">Completed</span> : <span className="badge badge-warning">Draft</span>}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, #0C2340 0%, #1A3A5C 100%)", border: "1px solid rgba(232,146,11,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                <h3 className="font-display font-semibold text-sm text-white">AI Writing Assist</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed mb-3">Click <span style={{ color: "var(--accent)" }}>Enhance</span> to improve technical writing.</p>
              {["Expands abbreviations (CCTV, HDMI, PLC)", "Improves action verbs", "Adds technical precision", "Formal sentence structure"].map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400 mb-1"><div className="w-1 h-1 rounded-full" style={{ background: "var(--accent)" }} />{t}</div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-5" style={{ border: "1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-sm mb-3" style={{ color: "var(--navy)" }}>Tips</h3>
              <div className="space-y-2 text-xs text-gray-500 leading-relaxed">
                <p>Upload your company logo above to appear on the PDF.</p>
                <p>Save as draft anytime and continue later.</p>
                <p>Number your steps: 1., 2., 3. for clarity.</p>
                <p>Include a Results: line at the end of completion process.</p>
                <p>Export PDF auto-saves and marks completed.</p>
                <p>Duplicate a report from dashboard to reuse as template.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>}>
      <Editor />
    </Suspense>
  );
}
