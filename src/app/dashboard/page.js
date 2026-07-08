"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { showToast } from "@/components/Toast";

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const router = useRouter();

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) { setErrMsg("Auth error: " + authErr.message); return; }
      if (!user) { router.push("/"); return; }

      let p = null;
      let profileErr = null;

      const { data: existing, error: selErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (selErr) {
        profileErr = selErr.message;
      }

      if (existing) {
        p = existing;
      } else {
        const { data: created, error: insErr } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            name: (user.user_metadata && user.user_metadata.name) ? user.user_metadata.name : user.email.split("@")[0],
            role: "user"
          })
          .select()
          .single();
        if (insErr) {
          profileErr = "Insert error: " + insErr.message;
        } else {
          p = created;
        }
      }

      if (!p) {
        setErrMsg("Profile error: " + (profileErr || "Unknown error. User ID: " + user.id));
        return;
      }

      setProfile(p);
      const { data } = await supabase
        .from("reports")
        .select("*, report_entries(count)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      setReports(data || []);
    } catch (err) {
      setErrMsg("Catch error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function del(id) {
    if (!confirm("Delete this report permanently?")) return;
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) showToast("Failed to delete", "error");
    else { setReports((p) => p.filter((r) => r.id !== id)); showToast("Deleted", "success"); }
  }

  async function dup(report) {
    const { data: nr } = await supabase.from("reports").insert({ user_id: report.user_id, name: report.name, date_from: report.date_from, date_to: report.date_to, status: "draft" }).select().single();
    if (!nr) { showToast("Duplication failed", "error"); return; }
    const { data: entries } = await supabase.from("report_entries").select("*").eq("report_id", report.id).order("serial_number");
    if (entries && entries.length) {
      await supabase.from("report_entries").insert(entries.map((e) => ({ report_id: nr.id, serial_number: e.serial_number, important_work: e.important_work, completion_process: e.completion_process, is_completed: e.is_completed, spare_parts: e.spare_parts })));
    }
    showToast("Duplicated as draft", "success");
    checkAuth();
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const drafts = reports.filter((r) => r.status === "draft").length;
  const done = reports.filter((r) => r.status === "completed").length;
  const totalE = reports.reduce((s, r) => s + (r.report_entries && r.report_entries[0] ? r.report_entries[0].count : 0), 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} /></div>;

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-md p-6">
        <p className="text-gray-500 mb-2">Could not load your profile.</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
          <p className="text-xs font-mono text-red-600 break-all">{errMsg}</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push("/"))} className="btn btn-primary">Go Back to Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--navy)" }}>Welcome, {profile.name}</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your weekly work summary reports</p>
          </div>
          <button onClick={() => router.push("/report")} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Report
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { l: "Total Reports", v: reports.length, c: "var(--navy)" },
            { l: "Drafts", v: drafts, c: "var(--warning)" },
            { l: "Completed", v: done, c: "var(--success)" },
            { l: "Total Entries", v: totalE, c: "var(--accent)" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-5 card-hover" style={{ border: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{s.l}</div>
              <div className="font-display font-bold text-3xl" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-display font-semibold text-lg" style={{ color: "var(--navy)" }}>Your Reports</h2>
            <span className="text-sm text-gray-400">{reports.length} report{reports.length !== 1 ? "s" : ""}</span>
          </div>
          {!reports.length ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
              <h3 className="font-display font-semibold text-gray-700 mb-1">No reports yet</h3>
              <p className="text-gray-400 text-sm mb-4">Create your first weekly work summary</p>
              <button onClick={() => router.push("/report")} className="btn btn-primary btn-sm">Create Report</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ background: "#F8FAFC", borderBottom: "1px solid var(--border)" }}>
                  {["Period", "Entries", "Status", "Last Updated", ""].map((h) => <th key={h} className={"text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider " + (h === "" ? "text-right" : "")}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{fmt(r.date_from)} - {fmt(r.date_to)}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{r.report_entries && r.report_entries[0] ? r.report_entries[0].count : 0}</td>
                      <td className="px-6 py-4">{r.status === "completed" ? <span className="badge badge-success">Completed</span> : <span className="badge badge-warning">Draft</span>}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{fmt(r.updated_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => router.push("/report?id=" + r.id)} className="btn btn-outline btn-sm">Edit</button>
                          <button onClick={() => dup(r)} className="btn btn-outline btn-sm">Copy</button>
                          <button onClick={() => del(r.id)} className="btn btn-sm" style={{ background: "transparent", color: "var(--danger)" }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
