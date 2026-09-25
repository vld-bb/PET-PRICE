"use client";

import Link from "next/link";
import { Search, X, Barcode, TrendingDown, Percent, Info, ShieldCheck } from "lucide-react";
import BannerSlot from "./BannerSlot";
import MegaMenu from "./MegaMenu";

interface HeaderProps {
  storesCount?: number;
  productsCount?: number;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  activeAnimal?: string;
  onCategorySelect?: (animal: string, catSlug?: string, groupSlug?: string) => void;
}

export default function Header({
  storesCount = 6,
  productsCount = 310,
  searchValue = "",
  onSearchChange,
  activeAnimal = "all",
  onCategorySelect,
}: HeaderProps) {
  return (
    <>
      {/* Top Banner Slot (header_top) */}
      <BannerSlot placement="header_top" />

      {/* Sticky Main Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xs">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-6 lg:px-8 py-2 sm:py-0 min-h-[3.5rem] sm:h-18 gap-2 sm:gap-6">
          {/* Top Row on Mobile / Left Section on Desktop */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <span className="text-lg sm:text-2xl font-bold">🐾</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Pet<span className="text-emerald-600">Price</span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden md:block">
                  Eesti lemmikloomapoodide reaalajas hinnavõrdlus
                </p>
              </div>
            </Link>

            {/* Right side controls on mobile (Kataloog & Kampaaniad) */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <MegaMenu onSelectCategory={onCategorySelect} />
              <button
                onClick={() => onCategorySelect?.("all", undefined, "sooduspakkumised")}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-colors cursor-pointer shrink-0"
                title="Kampaaniad"
              >
                <Percent className="h-4 w-4 text-amber-600 shrink-0" />
              </button>
            </div>

            {/* Desktop Mega Menu Dropdown Trigger */}
            <div className="hidden sm:block">
              <MegaMenu onSelectCategory={onCategorySelect} />
            </div>
          </div>

          {/* Center: Search Bar (Full-width on mobile below logo, center on desktop) */}
          <div className="flex-1 max-w-2xl w-full">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <Search className="h-4 w-4" />
              </div>

              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Otsi toodet, brändi või EAN koodi..."
                className="w-full pl-9 sm:pl-10 pr-16 sm:pr-20 py-2 sm:py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200/90 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs sm:text-sm font-medium shadow-2xs"
              />

              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
                {searchValue && (
                  <button
                    onClick={() => onSearchChange?.("")}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Tühjenda otsing"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-500 select-none">
                  <Barcode className="h-3.5 w-3.5 text-slate-400" />
                  <span>EAN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Right Quick Links */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-4 shrink-0 text-xs font-bold text-slate-700">
            <button
              onClick={() => onCategorySelect?.("all", undefined, "sooduspakkumised")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-colors cursor-pointer"
            >
              <Percent className="h-3.5 w-3.5 text-amber-600" />
              <span>Kampaaniad</span>
            </button>

            <a
              href="mailto:info@petprice.ee"
              className="hidden lg:inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Info className="h-3.5 w-3.5 text-slate-400" />
              <span>Info</span>
            </a>
          </div>
        </div>

        {/* Secondary Navigation Bar: Core Animal Tabs */}
        <div className="w-full border-t border-slate-100 bg-white/90 overflow-hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 h-10 text-xs font-bold overflow-x-auto overflow-y-hidden no-scrollbar gap-2 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {[
                { id: "all", label: "Kõik tooted", icon: "🐾" },
                { id: "koer", label: "Koerad", icon: "🐶" },
                { id: "kass", label: "Kassid", icon: "🐱" },
                { id: "vaikeloomad", label: "Närilised", icon: "🐰" },
                { id: "linnud", label: "Linnud", icon: "🦜" },
                { id: "kalad", label: "Akvaarium", icon: "🐠" },
              ].map((animal) => {
                const isActive =
                  activeAnimal === animal.id ||
                  (animal.id === "koer" && activeAnimal === "dog") ||
                  (animal.id === "kass" && activeAnimal === "cat");

                return (
                  <button
                    key={animal.id}
                    onClick={() => onCategorySelect?.(animal.id)}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-100/70 text-emerald-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span>{animal.icon}</span>
                    <span>{animal.label}</span>
                  </button>
                );
              })}

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

              {/* Sooduspakkumised % Tab */}
              <button
                onClick={() => onCategorySelect?.("all", undefined, "sooduspakkumised")}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-50 border border-amber-200/60 bg-amber-50/50 transition-all cursor-pointer"
              >
                <Percent className="h-3.5 w-3.5 text-amber-600" />
                <span>Sooduspakkumised %</span>
              </button>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <ShieldCheck className="h-3 w-3" /> Reaalajas hinnavõrdlus
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
