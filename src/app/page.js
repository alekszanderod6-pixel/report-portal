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
      <div className="hidden lg:flex lg:w-1/2 hero-pattern hero-grid relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5" style={{ background: "var(--accent)", filter: "blur(60px)" }} />
        <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full opacity-5" style={{ background: "var(--accent)", filter: "blur(40px)" }} />
        <div className="relative z-10">
          <div style={{ background: "var(--accent)" }} className="w-10 h-10 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg font-display">CI</span>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="font-display font-bold text-4xl xl:text-5xl text-white leading-tight mb-4">Weekly Work<br />Summary Portal</h1>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed mb-8">Maintenance - Controls and Instrumentations Department</p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            {[["Secure and Private", 0], ["Cloud Saved", 1], ["PDF Export", 2]].map(([t, d]) => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 accent-pulse" style={{ animationDelay: d + "s" }} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-gray-600 text-xs">Sunon Asogli Power - Shenzhen Energy Asogli Power</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-md fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div style={{ background: "var(--accent)" }} className="w-10 h-10 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg font-display">CI</span>
            </div>
            <div>
              <div className="font-display font-bold text-sm" style={{ color: "var(--navy)" }}>C&I Report Portal</div>
              <div className="text-xs text-gray-500">Maintenance Department</div>
            </div>
          </div>
          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl mb-1" style={{ color: "var(--navy)" }}>{isLogin ? "Sign In" : "Create Account"}</h2>
            <p className="text-gray-500 text-sm">{isLogin ? "Access your weekly report workspace" : "Register to start creating reports"}</p>
          </div>
          <div className="flex rounded-lg overflow-hidden mb-6" style={{ border: "1.5px solid var(--border)" }}>
            {["Sign In", "Register"].map((label, i) => (
              <button key={label} onClick={() => setIsLogin(i === 0)}
                className="flex-1 py-2.5 text-sm font-semibold transition-all"
                style={{ background: (i === 0) === isLogin ? "var(--navy)" : "transparent", color: (i === 0) === isLogin ? "white" : "var(--muted)" }}>
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={set} placeholder="e.g. Alexander Opoku Dwumaah" className="input" required={!isLogin} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={set} placeholder="you@asogli.com" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">Password</label>
              <input type="password" name="password" value={form.password} onChange={set} placeholder="Min. 6 characters" className="input" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3 text-base">
              {loading ? (<span className="flex items-center gap-2"><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />{isLogin ? "Signing in..." : "Creating account..."}</span>) : (isLogin ? "Sign In" : "Create Account")}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">
            {isLogin ? "Do not have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold" style={{ color: "var(--accent)" }}>{isLogin ? "Register" : "Sign In"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
