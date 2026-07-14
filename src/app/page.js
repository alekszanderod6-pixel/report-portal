"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const router = useRouter();

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        showToast("Welcome back!", "success");
        router.push("/dashboard");
      } else {
        if (!form.name.trim()) { showToast("Enter your full name", "warning"); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { name: form.name.trim() } },
        });
        if (error) throw error;
        showToast("Account created! You can now sign in.", "success");
        setIsLogin(true);
      }
    } catch (err) {
      showToast(err.message || "Authentication failed", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-pattern hero-grid relative overflow-hidden flex-col justify-between p-14">
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(232,146,11,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 left-0 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(232,146,11,0.08) 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div style={{ background: "linear-gradient(135deg, var(--accent) 0%, #f5a623 100%)" }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg font-display">CI</span>
          </div>
          <div>
            <div className="text-white font-display font-bold text-sm leading-tight">C&I Report Portal</div>
            <div className="text-gray-500 text-xs">Maintenance Department</div>
          </div>
        </div>

        {/* Main hero text */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(232,146,11,0.12)", border: "1px solid rgba(232,146,11,0.2)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 accent-pulse" />
            <span className="text-amber-400 text-xs font-semibold tracking-wide">Controls & Instrumentation</span>
          </div>
          <h1 className="font-display font-bold text-4xl xl:text-5xl text-white leading-tight mb-5">
            Weekly Work<br />
            <span style={{ color: "var(--accent)" }}>Summary</span> Portal
          </h1>
          <p className="text-gray-400 text-base max-w-sm leading-relaxed mb-10">
            Create, manage and export professional weekly work summaries for the Maintenance department.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              { icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z", label: "Secure & Private" },
              { icon: "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z", label: "Cloud Saved" },
              { icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z", label: "PDF Export" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(232,146,11,0.15)" }}>
                  <svg className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <span className="text-gray-400 text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 text-gray-600 text-xs">
          © 2026 Maintenance C&I Department
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-md fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div style={{ background: "linear-gradient(135deg, var(--accent) 0%, #f5a623 100%)" }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow">
              <span className="text-white font-bold text-base font-display">CI</span>
            </div>
            <div>
              <div className="font-display font-bold text-sm" style={{ color: "var(--navy)" }}>C&I Report Portal</div>
              <div className="text-xs text-gray-500">Maintenance Department</div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl mb-2" style={{ color: "var(--navy)" }}>
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLogin ? "Sign in to access your weekly report workspace" : "Register to start creating reports"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl overflow-hidden mb-7 p-1"
            style={{ background: "#E9EBF0", border: "1px solid var(--border)" }}>
            {["Sign In", "Register"].map((label, i) => (
              <button key={label} onClick={() => setIsLogin(i === 0)}
                className="flex-1 py-2.5 text-sm font-semibold transition-all rounded-lg"
                style={{
                  background: (i === 0) === isLogin ? "white" : "transparent",
                  color: (i === 0) === isLogin ? "var(--navy)" : "var(--muted)",
                  boxShadow: (i === 0) === isLogin ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--navy)" }}>Full Name</label>
                <input type="text" name="name" value={form.name} onChange={set}
                  placeholder="e.g. Alexander Opoku Dwumaah" className="input" required={!isLogin} />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--navy)" }}>Email Address</label>
              <input type="email" name="email" value={form.email} onChange={set}
                placeholder="you@asogli.com" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--navy)" }}>Password</label>
              <input type="password" name="password" value={form.password} onChange={set}
                placeholder="Min. 6 characters" className="input" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-2"
              style={{ height: 48, fontSize: "0.95rem", borderRadius: "0.6rem" }}>
              {loading
                ? <span className="flex items-center gap-2">
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </span>
                : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold"
              style={{ color: "var(--accent)" }}>
              {isLogin ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
