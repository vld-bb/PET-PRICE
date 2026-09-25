"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Megaphone,
  Eye,
  MousePointerClick,
  Percent,
  PlusCircle,
  ExternalLink,
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { AdminStats, Banner } from "@/lib/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, bannersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/banners"),
        ]);

        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s.stats);
        }

        if (bannersRes.ok) {
          const b = await bannersRes.json();
          setBanners(b.banners || []);
        }
      } catch (err) {
        console.error("Failed to load admin overview:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            PetPrice Administreerimine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reaalajas tootekataloogi monitooring, hindade ülekirjutamine ja bännerikampaaniate juhtimine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Halda tooteid</span>
          </Link>
          <Link
            href="/admin/banners"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Uus kampaania</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Tooted kokku</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {loading ? "..." : stats?.total_products || 0}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats?.active_products || 0} aktiivset
            </span>
            {stats && stats.inactive_products > 0 && (
              <span className="text-slate-500">
                • {stats.inactive_products} peidetud
              </span>
            )}
          </div>
        </div>

        {/* Store Offers */}
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Pakkumised & Poed</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {loading ? "..." : stats?.total_offers || 0}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Võrreldud <strong className="text-slate-200">{stats?.total_stores || 6}</strong> Eesti e-poest</span>
          </div>
        </div>

        {/* Banners & Impressions */}
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Näitamised</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {loading ? "..." : stats?.total_impressions.toLocaleString() || 0}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-purple-400" />
            <span>{stats?.active_banners || 0} aktiivset kampaaniat</span>
          </div>
        </div>

        {/* Clicks & CTR */}
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Klikid & CTR</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-white">
              {loading ? "..." : stats?.total_clicks.toLocaleString() || 0}
            </div>
            <div className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {stats?.avg_ctr_percent || 0}% CTR
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Keskmine konversioonimäär</span>
          </div>
        </div>
      </div>

      {/* Active Campaigns Performance Section */}
      <div className="rounded-3xl bg-slate-800/70 border border-slate-700/80 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Aktiivsed bännerikampaaniad
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reaalajas näitamised, klikkide arv ja kaalutud rotatsioon
            </p>
          </div>
          <Link
            href="/admin/banners"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>Kõik kampaaniad ({banners.length})</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {banners.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Bännereid pole veel lisatud.{" "}
            <Link href="/admin/banners" className="text-emerald-400 hover:underline">
              Loo esimene bänner
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-3 pl-2">Kampaania</th>
                  <th className="pb-3">Pind</th>
                  <th className="pb-3">Klient</th>
                  <th className="pb-3 text-center">Kaal</th>
                  <th className="pb-3 text-right">Näitamisi</th>
                  <th className="pb-3 text-right">Klikke</th>
                  <th className="pb-3 text-right">CTR</th>
                  <th className="pb-3 text-center">Olek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {banners.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.image_url}
                          alt={b.title}
                          className="w-12 h-8 object-cover rounded-md bg-slate-900 border border-slate-700 shrink-0"
                        />
                        <div className="truncate max-w-xs">
                          <p className="font-bold text-slate-100 truncate">{b.title}</p>
                          <a
                            href={b.target_url}
                            target="_blank"
                            rel="noopener"
                            className="text-[10px] text-slate-400 hover:text-emerald-400 truncate flex items-center gap-1 mt-0.5"
                          >
                            <span className="truncate">{b.target_url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300">
                        {b.placement_identifier}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300 font-medium">
                      {b.client_name || "—"}
                    </td>
                    <td className="py-3 text-center font-bold text-slate-200">
                      {b.weight}/10
                    </td>
                    <td className="py-3 text-right font-mono text-slate-300">
                      {b.impressions_count.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono text-emerald-400 font-bold">
                      {b.clicks_count.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono text-amber-400 font-bold">
                      {b.ctr_percent}%
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.is_active
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {b.is_active ? "Aktiivne" : "Peatatud"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
