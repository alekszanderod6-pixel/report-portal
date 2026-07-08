"use client";

import { useState, useEffect } from "react";
import { supabase, getCurrentProfile } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { downloadReportPDF } from "@/lib/pdfGenerator";
import Navbar from "@/components/Navbar";
import { showToast } from "@/components/Toast";

export default function AdminPage() {
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("reports");
  const [sel, setSel] = useState(null);
  const [selEntries, setSelEntries] = useState([]);
  const router = useRouter();

  useEffect(() => { check(); }, []);

  async function check() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }
    const p = await getCurrentProfile();
    if (!p || p.role !== "admin") { router.push("/dashboard"); showToast("Access denied", "error"); return; }
    setProfile(p);
    const { data: rd } = await supabase.from("reports").select("*, profiles(name), report_entries(count)").order("updated_at", { ascending: false });
    const { data: ud } = await supabase.from("profiles").select("*, reports(count)").order("created_at", { ascending: false });
    setReports(rd || []); setUsers(ud || []); setLoading(false);
  }

  async function view(r) {
    setSel(r);
    const { data: e } = await supabase.from("report_entries").select("*").eq("report_id", r.id).order("serial_number");
    setSelEntries(e || []);
  }

  async function exportR(r) {
    const { data: e } = await supabase.from("report_entries").select("*").eq("report_id", r.id).order("serial_number");
    try {
      await downloadReportPDF({ name: r.name, dateFrom: r.date_from, dateTo: r.date_to, entries: e || [] }, "Weekly_Summary_" + r.name.replace(/\s+/g, "_") + "_" + r.date_from + ".pdf");
      showToast("PDF downloaded", "success");
    } catch (err) { showToast("PDF failed", "error"); }
  }

  async function del(id) {
    if (!confirm("Delete permanently?")) return;
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) showToast("Failed", "error");
    else { setReports((p) => p.filter((r) => r.id !== id)); if (sel && sel.id === id) { setSel(null); setSelEntries([]); } showToast("Deleted", "success"); }
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const fmtS = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  if (!profile) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--navy)" }}>Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all reports and users</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { l: "Total Users", v: users.length, c: "var(--navy)" },
            { l: "Total Reports", v: reports.length, c: "var(--accent)" },
            { l: "Completed", v: reports.filter((r) => r.status === "completed").length, c: "var(--success)" },
            { l: "Drafts", v: reports.filter((r) => r.status === "draft").length, c: "var(--warning)" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-5 card-hover" style={{ border: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{s.l}</div>
              <div className="font-display font-bold text-3xl" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-1 mb-6" style={{ borderBottom: "2px solid var(--border)" }}>
          {["reports", "users"].map((t) => (
            <button key={t} onClick={() => { setTab(t); setSel(null); }} className="px-4 py-2.5 text-sm font-semibold transition-all capitalize"
              style={{ color: tab === t ? "var(--accent)" : "var(--muted)", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent", marginBottom: -2 }}>
              {t}
            </button>
          ))}
        </div>
        {loading ? <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="skeleton h-12 w-full" />)}</div> :
        tab === "reports" ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ background: "#F8FAFC", borderBottom: "1px solid var(--border)" }}>
                      {["User", "Period", "Entries", "Status", ""].map((h) => <th key={h} className={"text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider " + (h === "" ? "text-right" : "")}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {!reports.length ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">No reports</td></tr> :
                      reports.map((r) => (
                        <tr key={r.id} className={"cursor-pointer transition-colors " + (sel && sel.id === r.id ? "bg-amber-50" : "hover:bg-gray-50")} style={{ borderBottom: "1px solid var(--border)" }} onClick={() => view(r)}>
                          <td className="px-4 py-3 font-medium text-gray-900 text-xs">{r.profiles && r.profiles.name ? r.profiles.name : "Unknown"}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{fmtS(r.date_from)} - {fmtS(r.date_to)}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{r.report_entries && r.report_entries[0] ? r.report_entries[0].count : 0}</td>
                          <td className="px-4 py-3">{r.status === "completed" ? <span className="badge badge-success">Completed</span> : <span className="badge badge-warning">Draft</span>}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => exportR(r)} className="btn btn-outline btn-sm" title="Download PDF">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                              </button>
                              <button onClick={() => del(r.id)} className="btn btn-sm" style={{ background: "transparent", color: "var(--danger)" }}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div>
              {sel ? (
                <div className="bg-white rounded-xl overflow-hidden sticky top-20" style={{ border: "1px solid var(--border)" }}>
                  <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}><h3 className="font-display font-semibold text-sm" style={{ color: "var(--navy)" }}>Report Detail</h3></div>
                  <div className="p-5 space-y-3 text-sm">
                    <div><span className="text-gray-500 text-xs">Name</span><div className="font-medium">{sel.name}</div></div>
                    <div><span className="text-gray-500 text-xs">Period</span><div className="font-medium">{fmtS(sel.date_from)} - {fmtS(sel.date_to)}</div></div>
                    <div><span className="text-gray-500 text-xs">Status</span><div>{sel.status === "completed" ? <span className="badge badge-success">Completed</span> : <span className="badge badge-warning">Draft</span>}</div></div>
                    <div><span className="text-gray-500 text-xs">Updated</span><div className="font-medium text-xs">{fmt(sel.updated_at)}</div></div>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                      <span className="text-gray-500 text-xs">Entries ({selEntries.length})</span>
                      <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                        {selEntries.map((e, i) => (
                          <div key={i} className="p-2.5 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid var(--border)" }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs" style={{ color: "var(--navy)" }}>#{i + 1}</span>
                              {e.is_completed === "Yes" && <span className="badge badge-success" style={{ fontSize: "0.6rem" }}>Yes</span>}
                              {e.is_completed === "No" && <span className="badge badge-danger" style={{ fontSize: "0.6rem" }}>No</span>}
                              {e.is_completed === "In Progress" && <span className="badge badge-warning" style={{ fontSize: "0.6rem" }}>In Progress</span>}
                            </div>
                            <div className="text-xs font-medium text-gray-800 mb-1" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{e.important_work}</div>
                            <div className="text-xs text-gray-500" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-line" }}>{e.completion_process}</div>
                            {e.spare_parts && e.spare_parts !== "None" && <div className="text-xs mt-1" style={{ color: "var(--accent)" }}>{e.spare_parts}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center" style={{ border: "1px solid var(--border)" }}>
                  <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  <p className="text-gray-400 text-sm">Select a report to view details</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ background: "#F8FAFC", borderBottom: "1px solid var(--border)" }}>
                  {["User", "Role", "Reports", "Joined"].map((h) => <th key={h} className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>)}
                </tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(232,146,11,0.15)", color: "var(--accent)" }}>{u.name ? u.name.charAt(0).toUpperCase() : "?"}</div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{u.role === "admin" ? <span className="badge badge-warning">Admin</span> : <span className="badge badge-info">User</span>}</td>
                      <td className="px-6 py-4 text-gray-600">{u.reports && u.reports[0] ? u.reports[0].count : 0}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{fmt(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
