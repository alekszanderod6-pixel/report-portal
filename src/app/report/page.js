"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, getCurrentProfile } from "@/lib/supabase";
import { downloadReportPDF } from "@/lib/pdfGenerator";
import { stripHtml } from "@/lib/paraphraser";
import Navbar from "@/components/Navbar";
import { showToast } from "@/components/Toast";

// ─── Rich text helpers ────────────────────────────────────────────────────────

// execCommand for contenteditable (bold / italic / underline)
function execFormat(cmd) {
  document.execCommand(cmd, false, null);
}

// Get plain text from a contenteditable div
function getPlain(ref) {
  if (!ref?.current) return "";
  return stripHtml(ref.current.innerHTML);
}

// Get HTML from contenteditable
function getHtml(ref) {
  if (!ref?.current) return "";
  return ref.current.innerHTML;
}

// Set HTML into contenteditable and move cursor to end
function setHtml(ref, html) {
  if (!ref?.current) return;
  ref.current.innerHTML = html;
  // Move cursor to end
  const el = ref.current;
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// Insert text at cursor inside a contenteditable
function insertAtCursor(ref, text) {
  if (!ref?.current) return;
  ref.current.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  // Convert \n to <br>
  const parts = text.split("\n");
  const frag = document.createDocumentFragment();
  parts.forEach((part, i) => {
    if (i > 0) frag.appendChild(document.createElement("br"));
    if (part) frag.appendChild(document.createTextNode(part));
  });
  range.insertNode(frag);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Count step numbers in a contenteditable for auto-increment
function nextStepNum(ref) {
  if (!ref?.current) return 1;
  const text = ref.current.innerText || "";
  const matches = text.match(/^\d+\./gm);
  return matches ? matches.length + 1 : 1;
}

// ─── Editor component ─────────────────────────────────────────────────────────
function Editor() {
  const sp = useSearchParams();
  const editId = sp.get("id");
  const fileRef = useRef(null);
  const workRef = useRef(null);
  const procRef = useRef(null);
  const partsRef = useRef(null); // still a textarea

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [isCompleted, setIsCompleted] = useState("In Progress");
  const [editIdx, setEditIdx] = useState(null);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
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
        try { const sl = localStorage.getItem("logo_" + r.id); if (sl) setLogoBase64(sl); } catch (_) {}
        // Populate contenteditable fields after mount
        if (e && e.length === 0) {
          // new editing of empty — handled by editEntry
        }
      } else {
        const td = new Date(), dw = td.getDay();
        const mn = new Date(td); mn.setDate(td.getDate() - (dw === 0 ? 6 : dw - 1));
        const sn = new Date(mn); sn.setDate(mn.getDate() + 6);
        setDateFrom(mn.toISOString().split("T")[0]);
        setDateTo(sn.toISOString().split("T")[0]);
        setReportName(p?.name || "");
      }
    } catch (err) {
      showToast("Load error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function handleLogo(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2000000) { showToast("Logo must be under 2MB", "warning"); return; }
    const rd = new FileReader();
    rd.onload = (ev) => {
      setLogoBase64(ev.target.result);
      if (reportId) { try { localStorage.setItem("logo_" + reportId, ev.target.result); } catch (_) {} }
      showToast("Logo uploaded!", "success");
    };
    rd.readAsDataURL(f);
  }

  function removeLogo() {
    setLogoBase64(null);
    if (reportId) { try { localStorage.removeItem("logo_" + reportId); } catch (_) {} }
    if (fileRef.current) fileRef.current.value = "";
  }

  // ─── Enhance: calls Groq AI API to rewrite text professionally
  async function doEnhance(field) {
    const ref = field === "important_work" ? workRef : procRef;
    if (!ref?.current) { showToast("Could not read field", "error"); return; }
    const plain = getPlain(ref);
    if (!plain.trim()) { showToast("Type something first", "warning"); return; }
    setParaphrasing(field);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plain, field }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || "Enhance failed", "error");
        return;
      }
      // Strip any heading the AI may have added at the top (e.g. "Completion, Process and Results:")
      const cleaned = data.enhanced
        .replace(/^[\s\S]*?(?:completion[,\s]*process[,\s]*and[,\s]*results|important work)\s*[:\-]?\s*/i, "")
        .trim();
      // Write back — convert newlines to <br> for contenteditable, escape HTML special chars
      const html = cleaned
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      ref.current.innerHTML = html;
      showToast("Enhanced!", "success");
    } catch (err) {
      showToast("Enhance failed: " + (err.message || "Network error"), "error");
    } finally {
      setParaphrasing(null);
    }
  }

  function clearFields() {
    if (workRef.current) workRef.current.innerHTML = "";
    if (procRef.current) procRef.current.innerHTML = "";
    if (partsRef.current) partsRef.current.value = "";
    setIsCompleted("In Progress");
    setEditIdx(null);
  }

  function addOrUpdate() {
    const work = getHtml(workRef);
    const workPlain = getPlain(workRef);
    const process = getHtml(procRef);
    const processPlain = getPlain(procRef);
    const parts = partsRef.current?.value || "";
    if (!workPlain.trim()) { showToast("Enter the important work", "warning"); return; }
    if (!processPlain.trim()) { showToast("Enter completion process", "warning"); return; }
    if (editIdx !== null) {
      setEntries(p => p.map((e, i) => i === editIdx
        ? { ...e, important_work: work, completion_process: process, is_completed: isCompleted, spare_parts: parts }
        : e));
      showToast("Entry updated", "success");
    } else {
      setEntries(p => [...p, { id: null, serial_number: p.length + 1, important_work: work, completion_process: process, is_completed: isCompleted, spare_parts: parts }]);
      showToast("Entry added", "success");
    }
    clearFields();
  }

  function editEntry(i) {
    const e = entries[i];
    setIsCompleted(e.is_completed);
    setEditIdx(i);
    setTimeout(() => {
      if (workRef.current) workRef.current.innerHTML = e.important_work || "";
      if (procRef.current) procRef.current.innerHTML = e.completion_process || "";
      if (partsRef.current) partsRef.current.value = e.spare_parts || "";
    }, 30);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeEntry(i) {
    if (!confirm("Remove this entry?")) return;
    setEntries(p => p.filter((_, x) => x !== i).map((e, x) => ({ ...e, serial_number: x + 1 })));
    showToast("Entry removed", "info");
  }

  async function save(status = "draft") {
    if (!reportName.trim()) { showToast("Enter your name", "warning"); return; }
    if (!dateFrom || !dateTo) { showToast("Select date range", "warning"); return; }
    setSaving(true);
    try {
      let rid = reportId;
      if (rid) {
        await supabase.from("reports").update({ name: reportName.trim(), date_from: dateFrom, date_to: dateTo, status }).eq("id", rid);
        await supabase.from("report_entries").delete().eq("report_id", rid);
      } else {
        const { data: nr } = await supabase.from("reports").insert({ user_id: profile.id, name: reportName.trim(), date_from: dateFrom, date_to: dateTo, status }).select().single();
        rid = nr.id; setReportId(rid);
      }
      if (logoBase64 && rid) { try { localStorage.setItem("logo_" + rid, logoBase64); } catch (_) {} }
      if (entries.length) {
        const rows = entries.map((e, i) => ({ report_id: rid, serial_number: i + 1, important_work: e.important_work, completion_process: e.completion_process, is_completed: e.is_completed, spare_parts: e.spare_parts || "" }));
        await supabase.from("report_entries").insert(rows);
      }
      setReportStatus(status);
      showToast(status === "completed" ? "Report completed!" : "Draft saved!", "success");
    } catch (err) { showToast("Save failed: " + (err.message || "Unknown"), "error"); }
    finally { setSaving(false); }
  }

  async function exportPDF() {
    if (!entries.length) { showToast("Add at least one entry", "warning"); return; }
    await save("completed");
    setExporting(true);
    try {
      await downloadReportPDF({ name: reportName, dateFrom, dateTo, entries, logoBase64 },
        "Weekly_Summary_" + reportName.replace(/\s+/g, "_") + "_" + dateFrom + ".pdf");
      showToast("PDF downloaded!", "success");
    } catch (err) { showToast("PDF failed: " + (err.message || "Unknown"), "error"); }
    finally { setExporting(false); }
  }

  const fmtD = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <p className="text-gray-500 mb-3">Session expired.</p>
        <button onClick={() => window.location.href = "/"} className="btn btn-primary">Back to Login</button>
      </div>
    </div>
  );

  // ─── Toolbar component ────────────────────────────────────────────────────
  const dv = <div style={{ width:1, background:"var(--border)", height:18, margin:"0 2px" }} />;

  const tbBtn = (label, title, onClick, extraStyle = {}) => (
    <button type="button" title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        padding:"0 9px", height:28, borderRadius:5,
        border:"1px solid var(--border)", background:"white", cursor:"pointer",
        fontSize:12, fontWeight:600, color:"var(--fg)", whiteSpace:"nowrap",
        transition:"background 0.1s",
        ...extraStyle
      }}>
      {label}
    </button>
  );

  function Toolbar({ fieldRef, field }) {
    return (
      <div style={{ display:"flex", gap:3, marginBottom:6, alignItems:"center", flexWrap:"wrap" }}>
        {/* Bold */}
        {tbBtn(<b style={{fontFamily:"serif",fontSize:14}}>B</b>, "Bold (select text first)", () => execFormat("bold"))}
        {/* Italic */}
        {tbBtn(<i style={{fontFamily:"serif",fontSize:14}}>I</i>, "Italic (select text first)", () => execFormat("italic"))}
        {/* Underline */}
        {tbBtn(<u style={{fontFamily:"serif",fontSize:14}}>U</u>, "Underline (select text first)", () => execFormat("underline"))}
        {dv}
        {tbBtn("+ Step #", "Insert numbered step", () => insertAtCursor(fieldRef, nextStepNum(fieldRef) + ". "))}
        {tbBtn("• Bullet", "Insert bullet point", () => insertAtCursor(fieldRef, "• "))}
        {tbBtn("Results:", 'Insert "Results:" label', () => insertAtCursor(fieldRef, "Results: "))}
        {tbBtn("↵ Line", "Insert new line", () => insertAtCursor(fieldRef, "\n"))}
        {dv}
        <button type="button" title="Enhance with technical writing"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { doEnhance(field); }}
          disabled={paraphrasing === field}
          style={{
            display:"inline-flex", alignItems:"center", gap:4, padding:"0 10px", height:28,
            borderRadius:5, border:"1px solid var(--border)",
            background: paraphrasing === field ? "#FFFBEB" : "white",
            cursor: paraphrasing === field ? "not-allowed" : "pointer",
            fontSize:12, fontWeight:600,
            color: paraphrasing === field ? "var(--accent)" : "var(--fg)",
            whiteSpace:"nowrap", transition:"all 0.15s"
          }}>
          {paraphrasing === field
            ? <span className="spinner" style={{ width:11, height:11, borderWidth:2 }} />
            : <span>✨</span>}
          Enhance
        </button>
      </div>
    );
  }

  // Shared contenteditable style
  const ceStyle = {
    width:"100%", minHeight:72, padding:"0.6rem 0.8rem",
    border:"1.5px solid var(--border)", borderRadius:"0.5rem",
    fontFamily:"DM Sans, sans-serif", fontSize:"0.875rem",
    background:"white", color:"var(--fg)", lineHeight:1.6,
    overflowY:"auto", wordBreak:"break-word", outline:"none",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color:"var(--navy)" }}>
              {editId ? "Edit Report" : "New Weekly Report"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {editId ? "Editing — " + (reportStatus === "completed" ? "Completed" : "Draft") : "Fill in your weekly work summary"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => save("draft")} disabled={saving} className="btn btn-outline">
              {saving && <span className="spinner" style={{ width:16, height:16, borderWidth:2 }} />}
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button onClick={exportPDF} disabled={exporting || !entries.length} className="btn btn-primary">
              {exporting && <span className="spinner" style={{ width:16, height:16, borderWidth:2 }} />}
              {exporting ? "Generating..." : "Export PDF"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Report info */}
            <div className="bg-white rounded-xl p-6" style={{ border:"1px solid var(--border)" }}>
              <h2 className="font-display font-semibold text-lg mb-4" style={{ color:"var(--navy)" }}>Report Information</h2>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div>
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
              <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background:"#F8FAFC", border:"1px dashed var(--border)" }}>
                <div>
                  {logoBase64
                    ? <img src={logoBase64} alt="Logo" className="w-14 h-14 rounded-lg object-contain" style={{ border:"1px solid var(--border)" }} />
                    : <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background:"var(--accent)" }}><span className="text-white font-bold text-xs">LOGO</span></div>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Company Logo</p>
                  <p className="text-xs text-gray-400">Upload to appear on PDF (max 2MB)</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileRef} accept="image/*" onChange={handleLogo} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} className="btn btn-outline btn-sm">Upload</button>
                  {logoBase64 && <button onClick={removeLogo} className="btn btn-sm" style={{ background:"transparent", color:"var(--danger)" }}>Remove</button>}
                </div>
              </div>
            </div>

            {/* Entry form */}
            <div className="bg-white rounded-xl p-6" style={{ border:"1px solid var(--border)" }}>
              <h2 className="font-display font-semibold text-lg mb-1" style={{ color:"var(--navy)" }}>
                {editIdx !== null ? "Edit Entry #" + (editIdx + 1) : "Add Work Entry"}
              </h2>
              <p className="text-gray-400 text-xs mb-4">Serial Number: {editIdx !== null ? editIdx + 1 : entries.length + 1}</p>
              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Important Work</label>
                  <Toolbar fieldRef={workRef} field="important_work" />
                  <div
                    ref={workRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="e.g. Installation of Ruijie Wireless Access Point at Oil Area Gate to East"
                    style={ceStyle}
                    onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Completion, Process And Results</label>
                  <Toolbar fieldRef={procRef} field="completion_process" />
                  <div
                    ref={procRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder={"1. Installed new panel and ensured network wiring from AP to switch.\n2. Mounted camera for Oil Gate facing Plant car parks.\nResults: Installation completed successfully."}
                    style={{ ...ceStyle, minHeight: 110 }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Is it Completed?</label>
                    <select value={isCompleted} onChange={(e) => setIsCompleted(e.target.value)} className="input">
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700">Spare Parts Model Numbers</label>
                    <textarea ref={partsRef}
                      placeholder={"1. MD: RG-AP680-O(P)\n2. Cam MD: DS-2DC42201W-D\n(or None)"}
                      rows={3} className="input" style={{ resize:"vertical", minHeight:72, fontFamily:"DM Sans, sans-serif" }} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button onClick={addOrUpdate} className="btn btn-navy">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={editIdx !== null ? "M4.5 12.75l6 6 9-13.5" : "M12 4v16m8-8H4"} />
                    </svg>
                    {editIdx !== null ? "Update Entry" : "Add Entry"}
                  </button>
                  {editIdx !== null && (
                    <button onClick={clearFields} className="btn btn-outline">Cancel Edit</button>
                  )}
                </div>
              </div>
            </div>

            {/* Entries table */}
            <div className="bg-white rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)" }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom:"1px solid var(--border)" }}>
                <h2 className="font-display font-semibold text-lg" style={{ color:"var(--navy)" }}>Report Entries</h2>
                <span className="text-sm text-gray-400">{entries.length} entr{entries.length !== 1 ? "ies" : "y"}</span>
              </div>
              {!entries.length ? (
                <div className="p-8 text-center text-gray-400 text-sm">No entries yet. Add one above.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="report-preview-table">
                    <thead>
                      <tr>
                        <th style={{ width:40 }}>S/N</th>
                        <th style={{ width:"22%" }}>Important Work</th>
                        <th style={{ width:"40%" }}>Completion, Process And Results</th>
                        <th style={{ width:80 }}>Status</th>
                        <th style={{ width:"16%" }}>Spare Parts</th>
                        <th style={{ width:70 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr key={i}>
                          <td className="text-center font-semibold" style={{ color:"var(--navy)" }}>{i + 1}</td>
                          <td><div style={{ display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }} dangerouslySetInnerHTML={{ __html: e.important_work }} /></td>
                          <td><div style={{ display:"-webkit-box", WebkitLineClamp:4, WebkitBoxOrient:"vertical", overflow:"hidden" }} dangerouslySetInnerHTML={{ __html: e.completion_process }} /></td>
                          <td className="text-center">
                            {e.is_completed === "Yes" ? <span className="badge badge-success">Yes</span>
                              : e.is_completed === "No" ? <span className="badge badge-danger">No</span>
                              : <span className="badge badge-warning">In Progress</span>}
                          </td>
                          <td style={{ fontSize:"0.75rem", color:"var(--muted)", whiteSpace:"pre-line" }}>{e.spare_parts || "—"}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button onClick={() => editEntry(i)} className="p-1 rounded hover:bg-gray-100" title="Edit">
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                              </button>
                              <button onClick={() => removeEntry(i)} className="p-1 rounded hover:bg-red-50" title="Remove">
                                <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                              </button>
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

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5" style={{ border:"1px solid var(--border)" }}>
              <h3 className="font-display font-semibold text-sm mb-3" style={{ color:"var(--navy)" }}>Report Summary</h3>
              <div className="space-y-3 text-sm">
                {[
                  ["Period", fmtD(dateFrom) + " – " + fmtD(dateTo)],
                  ["Entries", entries.length],
                  ["Completed", entries.filter(e => e.is_completed === "Yes").length],
                  ["In Progress", entries.filter(e => e.is_completed === "In Progress").length],
                  ["Not Done", entries.filter(e => e.is_completed === "No").length],
                ].map(([label, val], i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium" style={i===2?{color:"var(--success)"}:i===3?{color:"var(--warning)"}:i===4?{color:"var(--danger)"}:{}}>
                      {val}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop:"1px solid var(--border)", paddingTop:"0.75rem" }} className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  {reportStatus === "completed" ? <span className="badge badge-success">Completed</span> : <span className="badge badge-warning">Draft</span>}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background:"linear-gradient(135deg,#0C2340 0%,#1A3A5C 100%)", border:"1px solid rgba(232,146,11,0.2)" }}>
              <h3 className="font-display font-semibold text-sm text-white mb-3">Toolbar Guide</h3>
              <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <p><span style={{ color:"var(--accent)" }}>B / I / U</span> — Select text first, then tap to instantly Bold, Italic, or Underline it</p>
                <p><span style={{ color:"var(--accent)" }}>+ Step #</span> — Inserts auto-numbered steps (1. 2. 3.)</p>
                <p><span style={{ color:"var(--accent)" }}>• Bullet</span> — Inserts a bullet point</p>
                <p><span style={{ color:"var(--accent)" }}>Results:</span> — Adds the Results label</p>
                <p><span style={{ color:"var(--accent)" }}>✨ Enhance</span> — Fixes spelling, grammar and rewrites in professional technical language</p>
                <p style={{ color:"#7DD3FC" }}>Tip: write naturally, then hit Enhance to make it professional</p>
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background:"var(--bg)" }}>
        <div className="spinner" style={{ width:40, height:40, borderWidth:4 }} />
      </div>
    }>
      <Editor />
    </Suspense>
  );
}
