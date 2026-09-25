"use client";

import { ArrowUpDown, RotateCcw } from "lucide-react";
import { ProductQueryParams } from "@/lib/types";

interface QuickFiltersProps {
  filters: ProductQueryParams;
  onChange: (updated: Partial<ProductQueryParams>) => void;
  onReset: () => void;
  totalCount?: number;
}

export default function QuickFilters({
  filters,
  onChange,
  onReset,
  totalCount = 0,
}: QuickFiltersProps) {
  const isFiltered =
    Boolean(filters.search) ||
    filters.pet !== "all" ||
    filters.type !== "all" ||
    filters.stage !== "all";

  return (
    <div className="space-y-4 rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">Filtrid ja kategooriad</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {totalCount} toodet
          </span>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Järjesta:</span>
          <select
            value={filters.sort || "price_asc"}
            onChange={(e) => onChange({ sort: e.target.value })}
            className="text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
          >
            <option value="price_asc">Odavaim hind enne (€)</option>
            <option value="price_per_kg">Parim ühikuhind (€/kg)</option>
            <option value="savings">Suurim hinnavõit (%)</option>
            <option value="title">Tootenimi (A-Z)</option>
          </select>

          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors ml-1"
              title="Lähtesta kõik filtrid"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Lähtesta</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Pet Type Filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Lemmikloom
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Kõik" },
              { id: "koer", label: "🐶 Koerad" },
              { id: "kass", label: "🐱 Kassid" },
              { id: "vaikeloomad", label: "🐰 Närilised" },
              { id: "linnud", label: "🦜 Linnud" },
              { id: "kalad", label: "🐠 Kalad" },
            ].map((item) => {
              const isSelected =
                (filters.animal || filters.pet || "all") === item.id ||
                (item.id === "koer" && filters.pet === "dog") ||
                (item.id === "kass" && filters.pet === "cat");

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    onChange({
                      animal: item.id,
                      pet: item.id,
                      category_group: undefined,
                      category_slug: undefined,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Food Type Filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Toidu liik
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Kõik tüübid" },
              { id: "dry", label: "Kuivtoit" },
              { id: "wet", label: "Märgtoit & Konservid" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ type: item.id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  (filters.type || "all") === item.id
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Stage & Special needs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Eluetapp / Omadus
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Kõik" },
              { id: "puppy", label: "Kutsikas / Kassipoeg" },
              { id: "large", label: "Suur tõug" },
              { id: "sterilised", label: "Steriliseeritud" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ stage: item.id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  (filters.stage || "all") === item.id
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
