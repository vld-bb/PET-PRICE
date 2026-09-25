"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  X,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { PET_TAXONOMY, SpeciesTaxonomy } from "@/lib/taxonomy";

interface MegaMenuProps {
  onSelectCategory?: (animal: string, catSlug?: string, groupSlug?: string) => void;
  className?: string;
}

export default function MegaMenu({ onSelectCategory, className = "" }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSpeciesId, setActiveSpeciesId] = useState<string>("koer");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedMobileSpecies, setExpandedMobileSpecies] = useState<string | null>("koer");
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<string | null>(null);
  const [categoriesData, setCategoriesData] = useState<{ species: string; category_group: string; category_slug: string; count: number }[]>([]);
  const [mounted, setMounted] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/facets")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.facets && data.facets.categories) {
          setCategoriesData(data.facets.categories);
        }
      })
      .catch((err) => console.error("Failed to load global facets:", err));
  }, []);

  const activeSpecies =
    PET_TAXONOMY.find((s) => s.id === activeSpeciesId) || PET_TAXONOMY[0];

  // Close on Outside Click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setMobileDrawerOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  const handleItemClick = (animal: string, catSlug?: string, groupSlug?: string) => {
    setIsOpen(false);
    setMobileDrawerOpen(false);
    if (onSelectCategory) {
      onSelectCategory(animal, catSlug, groupSlug);
    } else {
      const params = new URLSearchParams();
      if (animal) params.set("animal", animal);
      if (catSlug) params.set("cat", catSlug);
      if (groupSlug) params.set("group", groupSlug);
      router.push(`/?${params.toString()}`);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Mega Menu Trigger Button */}
      <button
        onClick={() => {
          // On mobile open drawer, on desktop toggle dropdown
          if (window.innerWidth < 1024) {
            setMobileDrawerOpen(true);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-xs select-none ${
          isOpen || mobileDrawerOpen
            ? "bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/30"
            : "bg-slate-900 text-white hover:bg-emerald-600"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <span className="tracking-tight">Kataloog</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Desktop Mega Menu Overlay & Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 top-[73px] bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-150 hidden lg:block"
            onClick={() => setIsOpen(false)}
          />

          {/* Mega Menu Panel */}
          <div className="absolute left-0 top-full mt-2 w-[980px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 hidden lg:flex">
            {/* Left Column: Species / Animals List */}
            <div className="w-64 bg-slate-50/80 border-r border-slate-200/70 p-3 space-y-1 shrink-0">
              <div className="px-3 py-2 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Lemmiklooma valik
              </div>

              {PET_TAXONOMY.map((species) => {
                const isActive = species.id === activeSpeciesId;
                return (
                  <button
                    key={species.id}
                    onMouseEnter={() => setActiveSpeciesId(species.id)}
                    onClick={() => handleItemClick(species.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left text-sm font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-md shadow-slate-200/60 font-black border border-slate-200/80"
                        : "text-slate-700 hover:bg-white/80 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl shrink-0">{species.icon}</span>
                      <span className="leading-snug">{species.name}</span>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        isActive ? "text-emerald-600 translate-x-0.5" : "text-slate-400"
                      }`}
                    />
                  </button>
                );
              })}

              <div className="pt-3 mt-2 border-t border-slate-200/70 px-2">
                <button
                  onClick={() => handleItemClick("all")}
                  className="w-full text-center text-xs font-bold text-slate-600 hover:text-emerald-700 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Vaata kõiki tooteid (Kõik liigid)
                </button>
              </div>
            </div>

            {/* Right Area: Structured Category Groups & Subcategories */}
            <div className="flex-1 p-6 flex flex-col justify-between max-h-[580px] overflow-y-auto">
              <div>
                {/* Active Species Header Banner */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{activeSpecies.icon}</span>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {activeSpecies.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {activeSpecies.tagline}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleItemClick(activeSpecies.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-emerald-200/60"
                  >
                    <span>Kõik {activeSpecies.shortName.toLowerCase()}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Subcategory Grid */}
                <div className="grid grid-cols-3 gap-6">
                  {activeSpecies.groups.map((group) => (
                    <div key={group.id} className="space-y-2.5">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                          {group.name}
                        </span>
                      </div>

                      <ul className="space-y-1.5">
                        {group.items.map((item) => {
                          const catCountObj = categoriesData.find(
                            (c) =>
                              (c.species === activeSpecies.id || c.species === activeSpecies.slug) &&
                              c.category_group === group.id &&
                              c.category_slug === item.slug
                          );
                          const count = catCountObj ? catCountObj.count : 0;

                          // Hide empty categories once data is loaded
                          if (categoriesData.length > 0 && count === 0) return null;

                          return (
                            <li key={item.slug}>
                              <button
                                onClick={() =>
                                  handleItemClick(activeSpecies.id, item.slug, group.id)
                                }
                                className="w-full text-left group flex items-center justify-between text-xs font-medium text-slate-600 hover:text-emerald-600 transition-colors py-1 cursor-pointer"
                              >
                                <span className="group-hover:translate-x-0.5 transition-transform truncate">
                                  {item.name} <span className="text-[10px] text-slate-400 font-normal">({count})</span>
                                </span>
                                {item.badge && (
                                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Feature bar */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  Võrdle hindu 6 Eesti lemmikloomapoes ühe klõpsuga
                </span>
                <span className="text-[11px] text-slate-400">
                  Uuendatud reaalajas
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Drawer (Slide-out Sheet via Portal) */}
      {mounted &&
        mobileDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Drawer Container */}
            <div className="relative w-[320px] sm:w-[360px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col z-[10000] animate-in slide-in-from-left duration-200">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <LayoutGrid className="h-5 w-5 text-emerald-600" />
                  <span>Kõik kategooriad</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                  aria-label="Sulge menüü"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Accordion Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {PET_TAXONOMY.map((species) => {
                  const isExpanded = expandedMobileSpecies === species.id;
                  return (
                    <div
                      key={species.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
                    >
                      {/* Species Accordion Header */}
                      <button
                        onClick={() =>
                          setExpandedMobileSpecies(isExpanded ? null : species.id)
                        }
                        className={`w-full flex items-center justify-between p-3.5 text-left font-black transition-colors ${
                          isExpanded ? "bg-emerald-50 text-emerald-900" : "bg-white text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="text-xl">{species.icon}</span>
                          <span>{species.name}</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-emerald-600" : "text-slate-400"
                          }`}
                        />
                      </button>

                      {/* Species Sub-Groups Accordion Body */}
                      {isExpanded && (
                        <div className="bg-slate-50/70 p-3 border-t border-slate-100 space-y-3">
                          <button
                            onClick={() => handleItemClick(species.id)}
                            className="w-full text-left py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs cursor-pointer"
                          >
                            <span>Kõik {species.shortName.toLowerCase()} tooted</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>

                          {species.groups.map((group) => {
                            const isGroupExpanded =
                              expandedMobileGroup === `${species.id}_${group.id}`;
                            return (
                              <div key={group.id} className="space-y-1">
                                <button
                                  onClick={() =>
                                    setExpandedMobileGroup(
                                      isGroupExpanded ? null : `${species.id}_${group.id}`
                                    )
                                  }
                                  className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
                                >
                                  <span>{group.name}</span>
                                  <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform ${
                                      isGroupExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>

                                {isGroupExpanded && (
                                  <ul className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-emerald-400/40 ml-2">
                                    {group.items.map((item) => {
                                      const catCountObj = categoriesData.find(
                                        (c) =>
                                          (c.species === species.id || c.species === species.slug) &&
                                          c.category_group === group.id &&
                                          c.category_slug === item.slug
                                      );
                                      const count = catCountObj ? catCountObj.count : 0;

                                      if (categoriesData.length > 0 && count === 0) return null;

                                      return (
                                        <li key={item.slug}>
                                          <button
                                            onClick={() =>
                                              handleItemClick(species.id, item.slug, group.id)
                                            }
                                            className="w-full text-left py-1 text-xs text-slate-600 hover:text-emerald-700 font-medium flex items-center justify-between cursor-pointer"
                                          >
                                            <span>
                                              {item.name}{" "}
                                              <span className="text-[10px] text-slate-400 font-normal">
                                                ({count})
                                              </span>
                                            </span>
                                            {item.badge && (
                                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded-sm">
                                                {item.badge}
                                              </span>
                                            )}
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 text-center shrink-0">
                <button
                  onClick={() => handleItemClick("all")}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Kõik tooted (Üldkataloog)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
