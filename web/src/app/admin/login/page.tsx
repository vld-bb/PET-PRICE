"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Autentimise viga");
      }

      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Vale parool! Proovi uuesti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
      {error && (
        <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs font-semibold text-rose-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
          >
            Admini parool
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sisesta parool..."
              className="block w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Vaikimisi seadistatud parool: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono">admin123</code></span>
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span>Kontrollin...</span>
          ) : (
            <>
              <span>Logi sisse</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-700/60 text-center">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          ← Tagasi avalehele
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <span className="text-2xl">🐾</span>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Pet<span className="text-emerald-400">Price</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Admin Paneel
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Tootekataloogi haldus ja bännerimootor
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 text-center text-slate-400 text-xs">
            Laadin...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
