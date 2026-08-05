"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { showToast } from "@/components/Toast";
import { downloadOvertimePDF } from "@/lib/overtimePdfGenerator";

export default function OvertimeList() {
  const [profile, setProfile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!p) { router.push("/"); return; }
    setProfile(p);

    const { data } = await supabase
      .from("overtime_sheets")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    setSheets(data || []);
    setLoading(false);
  }

  async function del(id) {
    if (!confirm("Delete this overtime sheet permanently?")) return;
    const { error } = await supabase.from("overtime_sheets").delete().eq("id", id);
    if (error) { showToast("Failed to delete", "error"); return; }
    setSheets(prev => prev.filter(s => s.id !== id));
    showToast("Deleted", "success");
  }

  async function exportPDF(sheet) {
    try {
      await downloadOvertimePDF(
        { dept: sheet.dept, month: sheet.month, employeeName: sheet.employee_name, entries: sheet.entries || [] },
        `Overtime_${sheet.employee_name.replace(/\s+/g, "_")}_${sheet.month.replace(/\s+/g, "_")}.pdf`
      );
      showToast("PDF downloaded!", "success");
    } catch (err) {
      showToast("PDF failed", "error");
    }
  }

  const fmt = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const drafts = sheets.filter(s => s.status === "draft").length;
  const done = sheets.filter(s => s.status === "completed").length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--navy)" }}>
              月度加班授权表
            </h1>
            <p className="text-gray-500 text-sm mt-1">Monthly Overtime Authorization Sheets</p>
          </div>
          <button onClick={() => router.push("/overtime")} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Sheet
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { l: "Total Sheets", v: sheets.length, c: "var(--navy)", bg: "rgba(12,35,64,0.08)" },
            { l: "Drafts", v: drafts, c: "var(--warning)", bg: "rgba(217,119,6,0.1)" },
            { l: "Completed", v: done, c: "var(--success)", bg: "rgba(27,107,74,0.1)" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 card-hover" style={{ border: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{s.l}</div>
              <div className="font-display font-bold text-3xl" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Sheets table */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-display font-semibold text-lg" style={{ color: "var(--navy)" }}>Your Sheets</h2>
            <span className="text-sm text-gray-400">{sheets.length} sheet{sheets.length !== 1 ? "s" : ""}</span>
          </div>

          {!sheets.length ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-gray-700 mb-1">No overtime sheets yet</h3>
              <p className="text-gray-400 text-sm mb-4">Create your first monthly overtime authorization sheet</p>
              <button onClick={() => router.push("/overtime")} className="btn btn-primary btn-sm">Create Sheet</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid var(--border)" }}>
                    {["Month", "Employee", "Dept.", "Entries", "Status", "Last Updated", ""].map((h) => (
                      <th key={h} className={`text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider ${h === "" ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheets.map(s => {
                    const entryCount = Array.isArray(s.entries) ? s.entries.filter(e => e.date || e.purpose).length : 0;
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{s.month || "—"}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{s.employee_name || "—"}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{s.dept}</td>
                        <td className="px-6 py-4 text-gray-600">{entryCount}</td>
                        <td className="px-6 py-4">
                          {s.status === "completed"
                            ? <span className="badge badge-success">Completed</span>
                            : <span className="badge badge-warning">Draft</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{fmt(s.updated_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => router.push("/overtime?id=" + s.id)} className="btn btn-outline btn-sm">Edit</button>
                            <button onClick={() => exportPDF(s)} className="btn btn-outline btn-sm" title="Download PDF">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            </button>
                            <button onClick={() => del(s.id)} className="btn btn-sm" style={{ background: "transparent", color: "var(--danger)" }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
