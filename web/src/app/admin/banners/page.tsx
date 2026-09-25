"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MousePointerClick,
  Percent,
  Calendar,
  Layers,
  ExternalLink,
  Save,
  X,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Pause,
} from "lucide-react";
import { Banner, BannerPlacement } from "@/lib/types";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [placements, setPlacements] = useState<BannerPlacement[]>([]);
  const [activeTab, setActiveTab] = useState<"banners" | "placements">("banners");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    placement_id: 1,
    title: "",
    client_name: "",
    image_url: "",
    target_url: "",
    alt_text: "",
    weight: 5,
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bannersRes, placementsRes] = await Promise.all([
        fetch("/api/admin/banners"),
        fetch("/api/admin/placements"),
      ]);

      if (bannersRes.ok) {
        const b = await bannersRes.json();
        setBanners(b.banners || []);
      }

      if (placementsRes.ok) {
        const p = await placementsRes.json();
        setPlacements(p.placements || []);
        if (p.placements && p.placements.length > 0 && !editingBanner) {
          setFormData((prev) => ({ ...prev, placement_id: p.placements[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load banner system:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      placement_id: placements[0]?.id || 1,
      title: "",
      client_name: "",
      image_url: "",
      target_url: "https://",
      alt_text: "",
      weight: 5,
      start_date: "",
      end_date: "",
      is_active: true,
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingBanner(b);
    setFormData({
      placement_id: b.placement_id,
      title: b.title,
      client_name: b.client_name || "",
      image_url: b.image_url,
      target_url: b.target_url,
      alt_text: b.alt_text || "",
      weight: b.weight || 1,
      start_date: b.start_date ? b.start_date.split("T")[0] : "",
      end_date: b.end_date ? b.end_date.split("T")[0] : "",
      is_active: b.is_active,
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image_url.trim() || !formData.target_url.trim()) {
      setErrorMsg("Palun täida kohustuslikud väljad (Pealkiri, Pildi URL, Sihtkoha URL).");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (editingBanner) {
        // Update existing banner
        const res = await fetch(`/api/admin/banners/${editingBanner.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placement_id: Number(formData.placement_id),
            title: formData.title.trim(),
            client_name: formData.client_name.trim() || null,
            image_url: formData.image_url.trim(),
            target_url: formData.target_url.trim(),
            alt_text: formData.alt_text.trim() || null,
            weight: Number(formData.weight),
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            is_active: formData.is_active,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Salvestamine ebaõnnestus");
        }
      } else {
        // Create new banner
        const res = await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placement_id: Number(formData.placement_id),
            title: formData.title.trim(),
            client_name: formData.client_name.trim() || null,
            image_url: formData.image_url.trim(),
            target_url: formData.target_url.trim(),
            alt_text: formData.alt_text.trim() || null,
            weight: Number(formData.weight),
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            is_active: formData.is_active,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Loomine ebaõnnestus");
        }
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Viga salvestamisel");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    const newActive = !banner.is_active;
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newActive }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, is_active: newActive } : b))
        );
      }
    } catch (err) {
      console.error("Failed to toggle banner status:", err);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!confirm("Kas oled kindel, et soovid selle bännerikampaania kustutada?")) return;

    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete banner:", err);
    }
  };

  // Metrics summary
  const totalImps = banners.reduce((sum, b) => sum + b.impressions_count, 0);
  const totalClicks = banners.reduce((sum, b) => sum + b.clicks_count, 0);
  const avgCtr = totalImps > 0 ? ((totalClicks / totalImps) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Bännerite & Kampaaniate Haldus</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
              {banners.length} kampaaniat
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monetiseerimise mootor, bänneripindade haldus, kaalutud rotatsioon ja klikkide monitooring
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Loo uus bänner</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>Kõik näitamised kokku</span>
          </div>
          <div className="text-2xl font-black text-white">{totalImps.toLocaleString()}</div>
        </div>

        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <MousePointerClick className="w-3.5 h-3.5 text-blue-400" />
            <span>Kõik klikid kokku</span>
          </div>
          <div className="text-2xl font-black text-white">{totalClicks.toLocaleString()}</div>
        </div>

        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Percent className="w-3.5 h-3.5 text-amber-400" />
            <span>Keskmine CTR (klikkimismäär)</span>
          </div>
          <div className="text-2xl font-black text-amber-400">{avgCtr}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("banners")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "banners"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Kampaaniad & Bännerid ({banners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("placements")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "placements"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bänneripinnad / Placements ({placements.length})</span>
        </button>
      </div>

      {/* TAB 1: Banners View */}
      {activeTab === "banners" && (
        <div className="rounded-3xl bg-slate-800/70 border border-slate-700/80 overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Laadin bännereid...</div>
          ) : banners.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Bännereid pole veel lisatud. Kliki ülal nupule &quot;Loo uus bänner&quot;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Kampaania</th>
                    <th className="py-3 px-3">Bänneripind</th>
                    <th className="py-3 px-3">Klient</th>
                    <th className="py-3 px-3 text-center">Kaal (Rotatsioon)</th>
                    <th className="py-3 px-3 text-right">Näitamisi</th>
                    <th className="py-3 px-3 text-right">Klikke</th>
                    <th className="py-3 px-3 text-right">CTR</th>
                    <th className="py-3 px-3 text-center">Olek</th>
                    <th className="py-3 px-4 text-right">Tegevused</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {banners.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.image_url}
                            alt={b.title}
                            className="w-16 h-10 object-cover rounded-lg bg-slate-900 border border-slate-700 shrink-0"
                          />
                          <div className="max-w-xs truncate">
                            <p className="font-bold text-slate-100 truncate">{b.title}</p>
                            <a
                              href={b.target_url}
                              target="_blank"
                              rel="noopener"
                              className="text-[11px] text-slate-400 hover:text-emerald-400 truncate flex items-center gap-1 mt-0.5"
                            >
                              <span className="truncate">{b.target_url}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-mono text-emerald-300">
                          {b.placement_identifier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {b.client_name || "—"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
                          <Sliders className="w-3 h-3 text-slate-400" />
                          <span>{b.weight}/10</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {b.impressions_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                        {b.clicks_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-400 font-bold">
                        {b.ctr_percent}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(b)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            b.is_active
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                          }`}
                        >
                          {b.is_active ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5 fill-current" />}
                          <span>{b.is_active ? "Aktiivne" : "Peatatud"}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                            title="Muuda kampaaniat"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 cursor-pointer"
                            title="Kustuta kampaania"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* TAB 2: Placements View */}
      {activeTab === "placements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {placements.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  <code className="text-[11px] text-emerald-400 font-mono">
                    {p.identifier}
                  </code>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 text-xs font-bold text-slate-300 border border-slate-700">
                  {p.banners_count} bännerit
                </span>
              </div>

              <p className="text-xs text-slate-400">{p.description || "Bänneripinna kirjeldus puudub."}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
                <span>Soovituslikud mõõtmed:</span>
                <span className="font-mono font-bold text-slate-200">
                  {p.width && p.height ? `${p.width} × ${p.height} px` : "Dünaamiline"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Banner Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-black text-white tracking-tight">
                {editingBanner ? `Muuda kampaaniat: ${editingBanner.title}` : "Loo uus bännerikampaania"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Bänneripind (Placement) *
                </label>
                <select
                  value={formData.placement_id}
                  onChange={(e) => setFormData({ ...formData, placement_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {placements.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.identifier} - {p.width}x{p.height})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Kampaania pealkiri *
                </label>
                <input
                  type="text"
                  required
                  placeholder="nt. PetCity Kevadpakkumised - Kõik toidud -25%"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kliendi / Brändi nimi
                  </label>
                  <input
                    type="text"
                    placeholder="nt. PetCity Kampaania"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Rotatsiooni kaal (1–10)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-400 font-mono w-6 text-right">
                      {formData.weight}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Bänneri pildi URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {/* Instant image preview */}
                {formData.image_url && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 h-24 max-w-full flex items-center justify-center">
                    <img
                      src={formData.image_url}
                      alt="Eelvaade"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Sihtkoha URL (Target Link) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Alt-tekst (SEO ja ligipääsetavus)
                </label>
                <input
                  type="text"
                  placeholder="Bänneri kirjeldus..."
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Alguskuupäev (Valikuline)
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Lõpukuupäev (Valikuline)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Kampaania on aktiivne</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Tühista
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Salvestan..." : editingBanner ? "Salvesta muudatused" : "Loo kampaania"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
