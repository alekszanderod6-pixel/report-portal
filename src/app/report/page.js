"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, getCurrentProfile } from "@/lib/supabase";
import { downloadReportPDF } from "@/lib/pdfGenerator";
import { paraphraseField, stripHtml } from "@/lib/paraphraser";
import Navbar from "@/components/Navbar";
import { showToast } from "@/components/Toast";

function Editor() {
  const sp = useSearchParams();
  var editId = sp.get("id");
  var fileRef = useRef(null);
  var workRef = useRef(null);
  var procRef = useRef(null);
  var partsRef = useRef(null);

  var ps = useState(null), profile = ps[0], setProfile = ps[1];
  var ls = useState(true), loading = ls[0], setLoading = ls[1];
  var ss = useState(false), saving = ss[0], setSaving = ss[1];
  var es = useState(false), exporting = es[0], setExporting = es[1];
  var pgs = useState(null), paraphrasing = pgs[0], setParaphrasing = pgs[1];
  var lgs = useState(null), logoBase64 = lgs[0], setLogoBase64 = lgs[1];
  var ns = useState(""), reportName = ns[0], setReportName = ns[1];
  var dfs = useState(""), dateFrom = dfs[0], setDateFrom = dfs[1];
  var dts = useState(""), dateTo = dts[0], setDateTo = dts[1];
  var ris = useState(null), reportId = ris[0], setReportId = ris[1];
  var sts = useState("draft"), reportStatus = sts[0], setReportStatus = sts[1];
  var ens = useState([]), entries = ens[0], setEntries = ens[1];
  var eis = useState(null), editIdx = eis[0], setEditIdx = eis[1];
  var cis = useState("In Progress"), isCompleted = cis[0], setIsCompleted = cis[1];

  useEffect(function(){ init(); }, []);

  async function init() {
    var r = await supabase.auth.getUser();
    var u = r.data.user;
    if (!u) { window.location.href = "/"; return; }
    var p = await getCurrentProfile();
    setProfile(p);
    if (editId) {
      var r1 = await supabase.from("reports").select("*").eq("id", editId).eq("user_id", u.id).single();
      var rv = r1.data;
      if (!rv) { showToast("Report not found", "error"); window.location.href = "/dashboard"; return; }
      setReportId(rv.id); setReportName(rv.name); setDateFrom(rv.date_from); setDateTo(rv.date_to); setReportStatus(rv.status);
      var r2 = await supabase.from("report_entries").select("*").eq("report_id", rv.id).order("serial_number");
      setEntries(r2.data || []);
      try { var sl = localStorage.getItem("logo_" + rv.id); if (sl) setLogoBase64(sl); } catch(x) {}
      setLoading(false);
    } else {
      var td = new Date(), dw = td.getDay();
      var mn = new Date(td); mn.setDate(td.getDate() - (dw === 0 ? 6 : dw - 1));
      var sn = new Date(mn); sn.setDate(mn.getDate() + 6);
      setDateFrom(mn.toISOString().split("T")[0]);
      setDateTo(sn.toISOString().split("T")[0]);
      setReportName(p && p.name ? p.name : "");
    }
  }

  function handleLogo(e) {
    var f = e.target.files[0];
    if (!f) return;
    if (f.size > 2000000) { showToast("Logo must be under 2MB", "warning"); return; }
    var rd = new FileReader();
    rd.onload = function(ev) {
      setLogoBase64(ev.target.result);
      if (reportId) { try { localStorage.setItem("logo_" + reportId, ev.target.result); } catch(x) {}
      showToast("Logo uploaded!", "success");
    };
    rd.readAsDataURL(f);
  }
  function removeLogo() {
    setLogoBase64(null);
    if (reportId) { try { localStorage.removeItem("logo_" + reportId); } catch(x) {}
    if (fileRef.current) fileRef.current.value = "";
  }

  function enhance(ref) {
    setParaphrasing("active");
    setTimeout(function() {
      var h = ref.current ? ref.current.innerHTML : "";
      var pt = stripHtml(h);
      if (pt.trim().length < 5) { setParaphrasing(null); showToast("Type more text first", "warning"); return; }
      var en = paraphraseField(pt);
      if (ref.current) ref.current.innerHTML = en;
      setParaphrasing(null);
      showToast("Text enhanced", "success");
    }, 200);
  }

  function gv(ref) { return ref.current ? ref.current.innerHTML : ""; }

  function clearAll() {
    if (workRef.current) workRef.current.innerHTML = "";
    if (procRef.current) procRef.current.innerHTML = "";
    if (partsRef.current) partsRef.current.innerHTML = "";
    setIsCompleted("In Progress");
  }

  function loadToRefs(e) {
    if (workRef.current) workRef.current.innerHTML = e.important_work;
    if (procRef.current) procRef.current.innerHTML = e.completion_process;
    if (partsRef.current) partsRef.current.innerHTML = e.spare_parts;
    setIsCompleted(e.is_completed);
  }

  useEffect(function() {
    if (editIdx !== null && entries[editIdx]) loadToRefs(entries[editIdx]);
  }, [editIdx]);

  function addOrUpdate() {
    var wh = gv(workRef), ph = gv(procRef), pr = gv(partsRef);
    var wp = stripHtml(wh), pp = stripHtml(ph);
    if (!wp.trim()) { showToast("Enter the important work", "warning"); return; }
    if (!pp.trim()) { showToast("Enter completion process", "warning"); return; }
    if (editIdx !== null) {
      setEntries(function(p) {
        return p.map(function(e, i) {
          if (i === editIdx) return { id: e.id, serial_number: e.serial_number, important_work: wh, completion_process: ph, is_completed: isCompleted, spare_parts: pr };
          return e;
        });
      });
      setEditIdx(null); clearAll();
      showToast("Entry updated", "success");
    } else {
      setEntries(function(p) { return p.concat([{ id: null, serial_number: p.length + 1, important_work: wh, completion_process: ph, is_completed: isCompleted, spare_parts: pr }]); });
      clearAll();
      showToast("Entry added", "success");
    }
  }

  function editEntry(i) { loadToRefs(entries[i]); setEditIdx(i); window.scrollTo({ top: 0, behavior: "smooth" }); }

  function removeEntry(i) {
    if (!confirm("Remove this entry?")) return;
    setEntries(function(p) { return p.filter(function(_, x) { return x !== i; }).map(function(e, x) { return { id: e.id, serial_number: x + 1, important_work: e.important_work, completion_process: e.completion_process, is_completed: e.is_completed, spare_parts: e.spare_parts }; }); });
    showToast("Entry removed", "info");
  }