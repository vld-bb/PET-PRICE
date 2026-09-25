"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  X,
  Package,
  Sparkles,
  Store as StoreIcon,
  Tag,
  Scale,
  Barcode,
} from "lucide-react";
import { Product, StoreOffer } from "@/lib/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "featured">("all");
  const [matchStatusFilter, setMatchStatusFilter] = useState<"all" | "multi_store" | "single_store" | "no_offers">("all");

  // New product form state
  const [newProduct, setNewProduct] = useState({
    title: "",
    brand: "",
    category: "",
    weight_kg: "",
    image_url: "",
    ean: "",
    custom_description: "",
    is_active: true,
    is_featured: false,
  });

  // Edit product form state
  const [editForm, setEditForm] = useState({
    title: "",
    custom_title: "",
    brand: "",
    category: "",
    weight_kg: "",
    image_url: "",
    custom_description: "",
    is_active: true,
    is_featured: false,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (brandFilter !== "all") q.set("brand", brandFilter);
      if (categoryFilter !== "all") q.set("category", categoryFilter);
      if (statusFilter !== "all") q.set("status", statusFilter);
      if (matchStatusFilter !== "all") q.set("match_status", matchStatusFilter);

      const res = await fetch(`/api/admin/products?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, brandFilter, categoryFilter, statusFilter, matchStatusFilter]);

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setEditForm({
      title: p.title || "",
      custom_title: p.custom_title || "",
      brand: p.brand || "",
      category: p.category || "",
      weight_kg: p.weight_kg !== null && p.weight_kg !== undefined ? String(p.weight_kg) : "",
      image_url: p.image_url || "",
      custom_description: p.custom_description || "",
      is_active: p.is_active !== false,
      is_featured: Boolean(p.is_featured),
    });
    setFeedback(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          custom_title: editForm.custom_title.trim() || null,
          custom_description: editForm.custom_description.trim() || null,
          brand: editForm.brand.trim() || null,
          category: editForm.category.trim() || null,
          weight_kg: editForm.weight_kg ? Number(editForm.weight_kg) : null,
          image_url: editForm.image_url.trim() || null,
          is_active: editForm.is_active,
          is_featured: editForm.is_featured,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Salvestamine ebaõnnestus");
      }

      setFeedback("Toode edukalt salvestatud!");
      loadProducts();
    } catch (err: any) {
      setFeedback(`Viga: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOfferActive = async (offer: StoreOffer) => {
    const newActive = !offer.is_active;
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newActive }),
      });
      if (res.ok) {
        // Update local state in selected product
        if (selectedProduct) {
          const updatedOffers = selectedProduct.offers.map((o) =>
            o.id === offer.id ? { ...o, is_active: newActive } : o
          );
          setSelectedProduct({ ...selectedProduct, offers: updatedOffers });
        }
        loadProducts();
      }
    } catch (err) {
      console.error("Failed to toggle offer:", err);
    }
  };

  const handleOverrideOfferPrice = async (offerId: number, val: string) => {
    const num = val.trim() === "" ? null : Number(val);
    try {
      const res = await fetch(`/api/admin/offers/${offerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ override_price: num }),
      });
      if (res.ok) {
        if (selectedProduct) {
          const updatedOffers = selectedProduct.offers.map((o) =>
            o.id === offerId
              ? {
                  ...o,
                  override_price: num,
                  effective_price: num !== null ? num : o.price,
                }
              : o
          );
          setSelectedProduct({ ...selectedProduct, offers: updatedOffers });
        }
        loadProducts();
      }
    } catch (err) {
      console.error("Failed to override offer price:", err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProduct.title.trim(),
          brand: newProduct.brand.trim() || null,
          category: newProduct.category.trim() || null,
          weight_kg: newProduct.weight_kg ? Number(newProduct.weight_kg) : null,
          image_url: newProduct.image_url.trim() || null,
          ean: newProduct.ean.trim() || null,
          custom_description: newProduct.custom_description.trim() || null,
          is_active: newProduct.is_active,
          is_featured: newProduct.is_featured,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Toote lisamine ebaõnnestus");
      }

      setShowAddModal(false);
      setNewProduct({
        title: "",
        brand: "",
        category: "",
        weight_kg: "",
        image_url: "",
        ean: "",
        custom_description: "",
        is_active: true,
        is_featured: false,
      });
      loadProducts();
    } catch (err: any) {
      alert(`Viga toote loomisel: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Distinct brands and categories for dropdown filters
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[];
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Tootekataloog & Pakkumised</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
              {products.length} toodet
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Halda toodete nähtavust, pealkirju, kirjeldusi ning poodide pakkumiste hindade ülekirjutamist
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lisa uus toode</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Otsi nime, brändi või EAN järgi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Kõik olekud</option>
              <option value="active">Ainult aktiivsed</option>
              <option value="inactive">Ainult peidetud</option>
              <option value="featured">Esiletõstetud</option>
            </select>

            {/* Match status */}
            <select
              value={matchStatusFilter}
              onChange={(e) => setMatchStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Kõik vastavused</option>
              <option value="multi_store">Võrreldav (2+ poodi)</option>
              <option value="single_store">1 pood</option>
              <option value="no_offers">Ilma pakkumisteta</option>
            </select>

            {/* Brand filter */}
            {uniqueBrands.length > 0 && (
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Kõik brändid</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl bg-slate-800/70 border border-slate-700/80 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Laadin tooteid...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Tooteid ei leitud valitud filtritega.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Toode</th>
                  <th className="py-3 px-3">Bränd & Kategooria</th>
                  <th className="py-3 px-3 text-center">Olek</th>
                  <th className="py-3 px-3 text-center">Poode</th>
                  <th className="py-3 px-3 text-right">Hind alates</th>
                  <th className="py-3 px-4 text-right">Tegevus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {products.map((p) => {
                  const hasCustomTitle = Boolean(p.custom_title);
                  return (
                    <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=100&q=80"}
                            alt={p.title}
                            className="w-10 h-10 object-contain rounded-lg bg-slate-900 border border-slate-700 p-1 shrink-0"
                          />
                          <div className="max-w-md truncate">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-100 truncate">
                                {p.custom_title || p.title}
                              </p>
                              {hasCustomTitle && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30">
                                  Muudetud
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-2 mt-0.5">
                              {p.ean && <span>EAN: {p.ean}</span>}
                              {p.weight_kg && <span>{p.weight_kg} kg</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-200 block">{p.brand || "—"}</span>
                        <span className="text-[11px] text-slate-400">{p.category || "—"}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.is_active !== false
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {p.is_active !== false ? "Aktiivne" : "Peidetud"}
                          </span>
                          {p.is_featured && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Esiletõstetud
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                            p.offers.length > 1
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : p.offers.length === 1
                              ? "bg-slate-700 text-slate-300"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {p.offers.length}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                        {p.lowest_price !== undefined ? `${p.lowest_price.toFixed(2)} €` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-emerald-400" />
                          <span>Muuda</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Muuda toodet: {selectedProduct.title}
                </h3>
                <p className="text-xs text-slate-400">
                  ID #{selectedProduct.id} • Slug: {selectedProduct.slug}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div
                className={`mb-6 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedback.startsWith("Viga")
                    ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {feedback.startsWith("Viga") ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-5">
              {/* Product Overrides */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kohandatud pealkiri (Custom Title)
                  </label>
                  <input
                    type="text"
                    value={editForm.custom_title}
                    onChange={(e) => setEditForm({ ...editForm, custom_title: e.target.value })}
                    placeholder={selectedProduct.title}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Kui tühi, kuvatakse kraabitud originaalpealkiri: &quot;{selectedProduct.title}&quot;
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Bränd
                  </label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kategooria
                  </label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kaal (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.weight_kg}
                    onChange={(e) => setEditForm({ ...editForm, weight_kg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Pildi URL
                  </label>
                  <input
                    type="text"
                    value={editForm.image_url}
                    onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kohandatud tootekirjeldus (Custom Description)
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.custom_description}
                    onChange={(e) => setEditForm({ ...editForm, custom_description: e.target.value })}
                    placeholder="Kirjeldus kuvatakse toote detaillehel..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6 md:col-span-2 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Toode on avalik (is_active)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_featured}
                      onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Esiletõstetud toode (is_featured)</span>
                  </label>
                </div>
              </div>

              {/* Associated Store Offers List */}
              <div className="pt-6 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Seotud e-poodide pakkumised ({selectedProduct.offers.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Määra käsitsi hinna ülekirjutus või lülita pakkumine välja
                  </span>
                </div>

                {selectedProduct.offers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">Sellel tootel puuduvad poepakkumised.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedProduct.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleOfferActive(offer)}
                            className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              offer.is_active !== false
                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                            }`}
                            title={offer.is_active !== false ? "Pakkumine aktiivne (kliki peitmiseks)" : "Pakkumine peidetud (kliki aktiveerimiseks)"}
                          >
                            {offer.is_active !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">
                                {offer.store?.name || `Pood #${offer.store_id}`}
                              </span>
                              <a
                                href={offer.url}
                                target="_blank"
                                rel="noopener"
                                className="text-slate-400 hover:text-emerald-400"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Kraabitud hind: <strong>{offer.price.toFixed(2)} €</strong>
                            </span>
                          </div>
                        </div>

                        {/* Price Override input */}
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-slate-400">
                            Hinna ülekirjutus (€):
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder={offer.price.toFixed(2)}
                            defaultValue={offer.override_price !== null && offer.override_price !== undefined ? String(offer.override_price) : ""}
                            onBlur={(e) => handleOverrideOfferPrice(offer.id, e.target.value)}
                            className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Sulge
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Salvestan..." : "Salvesta muudatused"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-black text-white tracking-tight">
                Lisa uus toode (Sponsoreeritud / Butiik)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Toote täielik pealkiri *
                </label>
                <input
                  type="text"
                  required
                  placeholder="nt. Orijen Amazing Grains Regional Red 10kg"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Bränd
                  </label>
                  <input
                    type="text"
                    placeholder="nt. Orijen"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kategooria
                  </label>
                  <input
                    type="text"
                    placeholder="nt. Koeratoit / Kuivtoit"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kaal (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="nt. 10.0"
                    value={newProduct.weight_kg}
                    onChange={(e) => setNewProduct({ ...newProduct, weight_kg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    EAN triipkood
                  </label>
                  <input
                    type="text"
                    placeholder="nt. 064992182113"
                    value={newProduct.ean}
                    onChange={(e) => setNewProduct({ ...newProduct, ean: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Pildi URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tootekirjeldus
                </label>
                <textarea
                  rows={2}
                  value={newProduct.custom_description}
                  onChange={(e) => setNewProduct({ ...newProduct, custom_description: e.target.value })}
                  placeholder="Toote omadused, koostisosad..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.is_active}
                    onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Aktiivne toode</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.is_featured}
                    onChange={(e) => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Esiletõstetud toode</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Tühista
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{saving ? "Lisan..." : "Loo toode"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
