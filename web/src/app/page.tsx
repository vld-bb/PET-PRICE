"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import CatalogSidebar from "@/components/CatalogSidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import BannerSlot from "@/components/BannerSlot";
import HeroCarousel from "@/components/HeroCarousel";
import { Product, Store, ProductQueryParams } from "@/lib/types";
import { Filter, ArrowUpDown, ShieldCheck, Sparkles } from "lucide-react";

function HomeContent() {
  const searchParamsHook = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [facets, setFacets] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const [filters, setFilters] = useState<ProductQueryParams>(() => {
    const animal = searchParamsHook.get("animal") || searchParamsHook.get("pet") || "all";
    const group = searchParamsHook.get("group") || searchParamsHook.get("category_group") || undefined;
    const cat = searchParamsHook.get("cat") || searchParamsHook.get("category") || searchParamsHook.get("category_slug") || undefined;
    const search = searchParamsHook.get("search") || searchParamsHook.get("q") || "";
    const minPrice = searchParamsHook.get("min_price") ? parseFloat(searchParamsHook.get("min_price")!) : undefined;
    const maxPrice = searchParamsHook.get("max_price") ? parseFloat(searchParamsHook.get("max_price")!) : undefined;
    const brands = searchParamsHook.get("brands") ? searchParamsHook.get("brands")!.split(",") : undefined;
    const storesList = searchParamsHook.get("stores") ? searchParamsHook.get("stores")!.split(",") : undefined;

    return {
      search,
      pet: animal,
      animal,
      category_group: group,
      category_slug: cat,
      type: searchParamsHook.get("type") || "all",
      stage: searchParamsHook.get("stage") || "all",
      sort: searchParamsHook.get("sort") || "price_asc",
      min_price: minPrice,
      max_price: maxPrice,
      brands,
      stores: storesList,
    };
  });

  const [isPending, startTransition] = useTransition();

  // Sync state if URL query params change
  useEffect(() => {
    const animal = searchParamsHook.get("animal") || searchParamsHook.get("pet") || "all";
    const group = searchParamsHook.get("group") || searchParamsHook.get("category_group") || undefined;
    const cat = searchParamsHook.get("cat") || searchParamsHook.get("category") || searchParamsHook.get("category_slug") || undefined;
    const search = searchParamsHook.get("search") || searchParamsHook.get("q") || "";
    const minPrice = searchParamsHook.get("min_price") ? parseFloat(searchParamsHook.get("min_price")!) : undefined;
    const maxPrice = searchParamsHook.get("max_price") ? parseFloat(searchParamsHook.get("max_price")!) : undefined;
    const brands = searchParamsHook.get("brands") ? searchParamsHook.get("brands")!.split(",") : undefined;
    const storesList = searchParamsHook.get("stores") ? searchParamsHook.get("stores")!.split(",") : undefined;

    setFilters((prev) => ({
      ...prev,
      search,
      pet: animal,
      animal,
      category_group: group,
      category_slug: cat,
      min_price: minPrice,
      max_price: maxPrice,
      brands,
      stores: storesList,
    }));
  }, [searchParamsHook]);

  // Load stores list
  useEffect(() => {
    fetch("/api/stores")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stores) {
          setStores(data.stores);
        }
      })
      .catch((err) => console.error("Failed to load stores:", err));
  }, []);

  // Load facets for current animal
  useEffect(() => {
    const species = filters.animal || filters.pet || "all";
    fetch(`/api/facets?animal=${species}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.facets) {
          setFacets(data.facets);
        }
      })
      .catch((err) => console.error("Failed to load facets:", err));
  }, [filters.animal, filters.pet]);

  // Fetch products whenever filters change & reset to page 1
  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    const apiParams = new URLSearchParams();

    if (filters.search) apiParams.set("search", filters.search);
    if (filters.animal && filters.animal !== "all") {
      apiParams.set("animal", filters.animal);
    } else if (filters.pet && filters.pet !== "all") {
      apiParams.set("pet", filters.pet);
    }
    if (filters.category_group) apiParams.set("group", filters.category_group);
    if (filters.category_slug) apiParams.set("cat", filters.category_slug);
    if (filters.type && filters.type !== "all") apiParams.set("type", filters.type);
    if (filters.stage && filters.stage !== "all") apiParams.set("stage", filters.stage);
    if (filters.sort) apiParams.set("sort", filters.sort);
    if (filters.min_price !== undefined) apiParams.set("min_price", String(filters.min_price));
    if (filters.max_price !== undefined) apiParams.set("max_price", String(filters.max_price));
    if (filters.brands && filters.brands.length > 0) apiParams.set("brands", filters.brands.join(","));
    if (filters.stores && filters.stores.length > 0) apiParams.set("stores", filters.stores.join(","));

    fetch(`/api/products?${apiParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.products) {
          startTransition(() => {
            setProducts(data.products);
          });
        }
      })
      .catch((err) => console.error("Failed to fetch products:", err))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleFilterChange = (updated: Partial<ProductQueryParams>) => {
    const next = { ...filters, ...updated };
    setFilters(next);

    const q = new URLSearchParams();
    if (next.search) q.set("search", next.search);
    if (next.animal && next.animal !== "all") q.set("animal", next.animal);
    if (next.category_group) q.set("group", next.category_group);
    if (next.category_slug) q.set("cat", next.category_slug);
    if (next.type && next.type !== "all") q.set("type", next.type);
    if (next.stage && next.stage !== "all") q.set("stage", next.stage);
    if (next.sort && next.sort !== "price_asc") q.set("sort", next.sort);
    if (next.min_price !== undefined) q.set("min_price", String(next.min_price));
    if (next.max_price !== undefined) q.set("max_price", String(next.max_price));
    if (next.brands && next.brands.length > 0) q.set("brands", next.brands.join(","));
    if (next.stores && next.stores.length > 0) q.set("stores", next.stores.join(","));

    const qs = q.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

  const handleResetFilters = () => {
    router.replace("/", { scroll: false });
    setFilters({
      search: "",
      pet: "all",
      animal: "all",
      category_group: undefined,
      category_slug: undefined,
      type: "all",
      stage: "all",
      sort: "price_asc",
      min_price: undefined,
      max_price: undefined,
      brands: undefined,
      stores: undefined,
    });
  };

  // Pagination calculation
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE) || 1;
  const pageProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const first12Products = pageProducts.slice(0, 12);
  const remaining12Products = pageProducts.slice(12, 24);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Clean Sticky Header with embedded center search bar & secondary animal bar */}
      <Header
        storesCount={stores.length || 6}
        productsCount={products.length}
        searchValue={filters.search || ""}
        onSearchChange={(val) => handleFilterChange({ search: val })}
        activeAnimal={filters.animal || filters.pet || "all"}
        onCategorySelect={(animal, catSlug, groupSlug) => {
          if (groupSlug === "sooduspakkumised") {
            handleFilterChange({
              sort: "savings",
              category_slug: undefined,
              category_group: undefined,
            });
            return;
          }
          handleFilterChange({
            animal,
            pet: animal,
            category_slug: catSlug,
            category_group: groupSlug,
          });
        }}
      />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 space-y-6">
        {/* Hero Carousel (Only on default homepage when no deep filters are active) */}
        {(!filters.search && (!filters.animal || filters.animal === "all") && !filters.category_slug && !filters.category_group) && (
          <section className="w-full">
            <HeroCarousel />
          </section>
        )}

        {/* 2. Standard Two-Column Catalog Layout */}
        <section className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Column: Collapsible Filter Sidebar (lg:col-span-1) */}
            <div className="lg:col-span-1">
              <CatalogSidebar
                filters={filters}
                facets={facets}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
                isMobileOpen={isMobileFiltersOpen}
                onMobileClose={() => setIsMobileFiltersOpen(false)}
              />
            </div>

            {/* Right Column: Product Feed & Controls (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Breadcrumb Trail */}
              <Breadcrumbs
                animal={filters.animal || (filters.pet !== "all" ? filters.pet : undefined)}
                categoryGroup={filters.category_group}
                categorySlug={filters.category_slug}
                onReset={handleResetFilters}
                onSelectAnimal={(animal) =>
                  handleFilterChange({
                    animal,
                    pet: animal,
                    category_group: undefined,
                    category_slug: undefined,
                  })
                }
              />

              {/* Action Bar: Mobile Filter Trigger, Product Count & Sort Dropdown */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                  {/* Mobile Filters Drawer Trigger */}
                  <button
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-emerald-600 transition-colors"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span>Filtrid</span>
                  </button>

                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {loading ? (
                      "Otsin tooteid..."
                    ) : (
                      <>
                        Leitud{" "}
                        <strong className="text-emerald-700 font-black">
                          {products.length}
                        </strong>{" "}
                        {products.length === 1 ? "toode" : "toodet"}
                      </>
                    )}
                  </span>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                    Järjesta:
                  </span>
                  <select
                    value={filters.sort || "price_asc"}
                    onChange={(e) => handleFilterChange({ sort: e.target.value })}
                    className="text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="price_asc">Odavaim hind enne (€)</option>
                    <option value="price_per_kg">Parim ühikuhind (€/kg)</option>
                    <option value="savings">Suurim hinnavõit (%)</option>
                    <option value="title">Tootenimi (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Product Grid Area */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-72 rounded-2xl bg-white border border-slate-200/80 p-3 animate-pulse space-y-3"
                    >
                      <div className="h-3 bg-slate-200 rounded-md w-1/3"></div>
                      <div className="h-32 bg-slate-100 rounded-xl"></div>
                      <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                /* No Results Box */
                <div className="rounded-3xl bg-white border border-slate-200 p-10 text-center shadow-xs space-y-4">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
                    🔍
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ühtegi toodet ei vasta valitud filtritele
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Proovi muuta hinnavahemikku, eemaldada brändifilter või valida teine kategooria.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                  >
                    <span>Lähtesta kõik filtrid</span>
                  </button>
                </div>
              ) : (
                /* Product Feed: 3 Rows (12 items) -> Banner -> Remaining Rows (12 items) -> Pagination */
                <div className="space-y-6">
                  {/* First 12 items (compact 4-column cards on desktop) */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                    {first12Products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onOpenModal={(p) => setSelectedProduct(p)}
                      />
                    ))}
                  </div>

                  {/* Mid-Feed Ad Banner Placement */}
                  <div className="my-6">
                    <BannerSlot placement="catalog_leaderboard" />
                  </div>

                  {/* Remaining products on current page (up to 12 items) */}
                  {remaining12Products.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                      {remaining12Products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onOpenModal={(p) => setSelectedProduct(p)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination Controls Bar */}
                  {totalPages > 1 && (
                    <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <span>← Eelmine</span>
                      </button>

                      <span className="text-xs font-semibold text-slate-600">
                        Leht <strong className="text-slate-900">{currentPage}</strong> / {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <span>Järgmine →</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Comparison Modal */}
      <ProductComparisonModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="text-xl">🐾</span>
            <div>
              <p className="font-bold text-slate-900 text-sm">PetPrice.ee</p>
              <p>Eesti lemmikloomapoodide reaalajas hinnavõrdlus ja säästunippide mootor.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 font-medium text-slate-600">
            <a
              href="mailto:info@petprice.ee"
              className="hover:text-emerald-600 underline decoration-emerald-500/40 font-semibold transition-colors"
            >
              info@petprice.ee
            </a>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="h-4 w-4" /> 100% sõltumatu võrdlus
            </span>
            <span>© 2026 PetPrice.ee. Kõik õigused kaitstud.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Laadimine...</div>}>
      <HomeContent />
    </Suspense>
  );
}
