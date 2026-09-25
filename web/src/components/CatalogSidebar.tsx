"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  Filter,
  X,
  Store as StoreIcon,
  Tag,
  Coins,
  Sparkles,
} from "lucide-react";
import { ProductQueryParams, Store } from "@/lib/types";
import { PET_TAXONOMY, SpeciesTaxonomy } from "@/lib/taxonomy";

interface Facets {
  brands: { name: string; count: number }[];
  stores: { id: number; name: string; domain: string; count: number }[];
  priceRange: { min: number; max: number };
  categories?: { species: string; category_group: string; category_slug: string; count: number }[];
}

interface CatalogSidebarProps {
  filters: ProductQueryParams;
  facets?: Facets;
  onChange: (updated: Partial<ProductQueryParams>) => void;
  onReset: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function CatalogSidebar({
  filters,
  facets,
  onChange,
  onReset,
  isMobileOpen = false,
  onMobileClose,
}: CatalogSidebarProps) {
  // Accordion section open/close states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    price: true,
    stores: true,
    brands: true,
    foodAttributes: true,
  });

  const [brandSearch, setBrandSearch] = useState("");
  const [minPriceInput, setMinPriceInput] = useState(
    filters.min_price !== undefined ? String(filters.min_price) : ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    filters.max_price !== undefined ? String(filters.max_price) : ""
  );

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeSpeciesId = filters.animal || filters.pet || "koer";
  const activeTaxonomy =
    PET_TAXONOMY.find((s) => s.id === activeSpeciesId || s.slug === activeSpeciesId) ||
    PET_TAXONOMY[0];

  // Dynamic attributes condition: Only show food attributes if browsing all or "toit_maiused"
  const isFoodCategory =
    !filters.category_group ||
    filters.category_group === "toit_maiused" ||
    filters.category_slug === "kuivtoit" ||
    filters.category_slug === "margtoit";

  // Filtered brand list based on brand search query
  const filteredBrands = useMemo(() => {
    if (!facets?.brands) return [];
    
    let result = facets.brands;
    if (brandSearch.trim()) {
      const q = brandSearch.toLowerCase().trim();
      result = result.filter((b) => b.name.toLowerCase().includes(q));
    }

    const checkedBrands = filters.brands || [];
    return result.sort((a, b) => {
      const aChecked = checkedBrands.includes(a.name);
      const bChecked = checkedBrands.includes(b.name);
      if (aChecked && !bChecked) return -1;
      if (!aChecked && bChecked) return 1;
      return 0;
    });
  }, [facets?.brands, brandSearch, filters.brands]);

  const handleBrandToggle = (brandName: string) => {
    const current = filters.brands || [];
    const next = current.includes(brandName)
      ? current.filter((b) => b !== brandName)
      : [...current, brandName];
    onChange({ brands: next.length > 0 ? next : undefined });
  };

  const handleStoreToggle = (storeName: string) => {
    const current = filters.stores || [];
    const next = current.includes(storeName)
      ? current.filter((s) => s !== storeName)
      : [...current, storeName];
    onChange({ stores: next.length > 0 ? next : undefined });
  };

  const handlePriceApply = () => {
    const min = minPriceInput ? parseFloat(minPriceInput) : undefined;
    const max = maxPriceInput ? parseFloat(maxPriceInput) : undefined;
    onChange({ min_price: min, max_price: max });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.category_slug ||
      filters.category_group ||
      (filters.brands && filters.brands.length > 0) ||
      (filters.stores && filters.stores.length > 0) ||
      filters.min_price !== undefined ||
      filters.max_price !== undefined ||
      (filters.type && filters.type !== "all") ||
      (filters.stage && filters.stage !== "all")
  );

  const content = (
    <div className="space-y-6">
      {/* Sidebar Header & Clear All */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Filtrid</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Tühjenda</span>
          </button>
        )}
      </div>

      {/* 1. KATEGOORIAD ACCORDION */}
      <div className="border-b border-slate-100 pb-5">
        <button
          onClick={() => toggleSection("categories")}
          className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 py-1"
        >
          <span>Kategooriad ({activeTaxonomy.shortName})</span>
          {openSections.categories ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {openSections.categories && (
          <div className="mt-3 space-y-3">
            {activeTaxonomy.groups.map((group) => (
              <div key={group.id} className="space-y-1.5">
                <button
                  onClick={() =>
                    onChange({
                      category_group:
                        filters.category_group === group.id ? undefined : group.id,
                      category_slug: undefined,
                    })
                  }
                  className={`w-full text-left text-xs font-bold transition-colors flex items-center justify-between ${
                    filters.category_group === group.id
                      ? "text-emerald-700"
                      : "text-slate-800 hover:text-emerald-600"
                  }`}
                >
                  <span>{group.name}</span>
                </button>

                <div className="pl-2 space-y-1 border-l-2 border-slate-100">
                  {group.items.map((subcat) => {
                    const isSelected = filters.category_slug === subcat.slug;
                    const catCountObj = facets?.categories?.find(
                      (c) =>
                        (c.species === activeSpeciesId || c.species === activeTaxonomy.slug) &&
                        c.category_group === group.id &&
                        c.category_slug === subcat.slug
                    );
                    const catCount = catCountObj ? catCountObj.count : 0;

                    // If zero products and it's not selected, we hide it or disable it.
                    if (catCount === 0 && !isSelected) return null;

                    return (
                      <button
                        key={subcat.slug}
                        onClick={() =>
                          onChange({
                            category_group: group.id,
                            category_slug: isSelected ? undefined : subcat.slug,
                          })
                        }
                        className={`w-full text-left text-[11px] py-0.5 transition-colors flex items-center justify-between rounded px-1.5 ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-800 font-bold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">
                          {subcat.name} <span className="text-[10px] text-slate-400 font-normal">({catCount})</span>
                        </span>
                        {subcat.badge && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded-sm shrink-0">
                            {subcat.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. HIND (€) ACCORDION */}
      <div className="border-b border-slate-100 pb-5">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 py-1"
        >
          <span>Hind (€)</span>
          {openSections.price ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {openSections.price && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2 text-xs text-slate-400">€</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                  className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
              <span className="text-slate-400 text-xs">–</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2 text-xs text-slate-400">€</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                  className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
              <button
                onClick={handlePriceApply}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                OK
              </button>
            </div>

            {/* Quick price presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: "Kuni 10€", max: 10 },
                { label: "10€ - 25€", min: 10, max: 25 },
                { label: "25€ - 50€", min: 25, max: 50 },
                { label: "Üle 50€", min: 50 },
              ].map((preset) => {
                const isActive =
                  filters.min_price === preset.min && filters.max_price === preset.max;
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setMinPriceInput(preset.min ? String(preset.min) : "");
                      setMaxPriceInput(preset.max ? String(preset.max) : "");
                      onChange({ min_price: preset.min, max_price: preset.max });
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. POOD / KAUPLUS ACCORDION */}
      <div className="border-b border-slate-100 pb-5">
        <button
          onClick={() => toggleSection("stores")}
          className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 py-1"
        >
          <span>Pood / Kauplus</span>
          {openSections.stores ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {openSections.stores && (
          <div className="mt-3 space-y-2">
            {[
              { name: "PetCity", slug: "petcity" },
              { name: "Kika", slug: "kika" },
              { name: "Zoomaailm", slug: "zoomaailm" },
              { name: "Fera", slug: "fera" },
              { name: "Koerland", slug: "koerland" },
              { name: "Zooplus", slug: "zooplus" },
            ].map((store) => {
              const isChecked = filters.stores?.includes(store.name) || false;
              return (
                <label
                  key={store.name}
                  className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleStoreToggle(store.name)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="font-medium">{store.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. BRÄND ACCORDION */}
      <div className="border-b border-slate-100 pb-5">
        <button
          onClick={() => toggleSection("brands")}
          className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 py-1"
        >
          <span>Bränd</span>
          {openSections.brands ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {openSections.brands && (
          <div className="mt-3 space-y-2.5">
            {/* Brand quick search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Otsi brändi..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Brand checkboxes list */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {filteredBrands.map((b) => {
                const isChecked = filters.brands?.includes(b.name) || false;
                return (
                  <label
                    key={b.name}
                    className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleBrandToggle(b.name)}
                        className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span className="truncate max-w-[130px] font-medium">{b.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">({b.count})</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. DYNAMIC FOOD ATTRIBUTES (Only show if browsing food categories) */}
      {isFoodCategory && (
        <div className="border-b border-slate-100 pb-5">
          <button
            onClick={() => toggleSection("foodAttributes")}
            className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 py-1"
          >
            <span>Toidu omadused</span>
            {openSections.foodAttributes ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          {openSections.foodAttributes && (
            <div className="mt-3 space-y-3">
              {/* Type: Dry vs Wet */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Toidu liik
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: "all", label: "Kõik" },
                    { id: "dry", label: "Kuivtoit" },
                    { id: "wet", label: "Märgtoit" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onChange({ type: t.id })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        (filters.type || "all") === t.id
                          ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Life Stage */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Eluetapp
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: "all", label: "Kõik" },
                    { id: "puppy", label: "Kutsikas / Kassipoeg" },
                    { id: "large", label: "Suur tõug" },
                    { id: "sterilised", label: "Steriliseeritud" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onChange({ stage: s.id })}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        (filters.stage || "all") === s.id
                          ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Left Sidebar Card */}
      <aside className="hidden lg:block w-full bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
        {content}
      </aside>

      {/* Mobile Off-canvas Drawer / Sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-black text-slate-900">
                <Filter className="h-4 w-4 text-emerald-600" />
                <span>Kataloogi filtrid</span>
              </div>
              <button
                onClick={onMobileClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{content}</div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
              <button
                onClick={onReset}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Tühjenda
              </button>
              <button
                onClick={onMobileClose}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
              >
                Vaata tulemusi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
