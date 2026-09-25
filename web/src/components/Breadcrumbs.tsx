"use client";

import Link from "next/link";
import { ChevronRight, Home, X } from "lucide-react";
import { findTaxonomyInfo, PET_TAXONOMY } from "@/lib/taxonomy";

interface BreadcrumbsProps {
  animal?: string;
  categoryGroup?: string;
  categorySlug?: string;
  onReset?: () => void;
  onSelectAnimal?: (animal: string) => void;
}

export default function Breadcrumbs({
  animal,
  categoryGroup,
  categorySlug,
  onReset,
  onSelectAnimal,
}: BreadcrumbsProps) {
  // If no filters active, don't clutter the view
  if (!animal && !categoryGroup && !categorySlug) {
    return null;
  }

  const taxInfo = findTaxonomyInfo(animal, categorySlug);
  const species = taxInfo?.species;
  const group = taxInfo?.group;
  const subcat = taxInfo?.subcat;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-100/80 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-600 mb-6"
    >
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Home */}
        <li className="flex items-center">
          <Link
            href="/"
            onClick={() => onReset?.()}
            className="flex items-center gap-1 text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Avaleht</span>
          </Link>
        </li>

        {/* Animal Species */}
        {species && (
          <li className="flex items-center gap-1.5 sm:gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link
              href={`/?animal=${species.id}`}
              onClick={() => onSelectAnimal?.(species.id)}
              className={`hover:text-emerald-700 transition-colors flex items-center gap-1 ${
                !group && !subcat ? "text-emerald-700 font-black" : "text-slate-600"
              }`}
            >
              <span>{species.icon}</span>
              <span>{species.name}</span>
            </Link>
          </li>
        )}

        {/* Category Group */}
        {group && (
          <li className="flex items-center gap-1.5 sm:gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span
              className={`${
                !subcat ? "text-emerald-700 font-black" : "text-slate-600"
              }`}
            >
              {group.name}
            </span>
          </li>
        )}

        {/* Subcategory */}
        {subcat && (
          <li className="flex items-center gap-1.5 sm:gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-emerald-700 font-black bg-emerald-100/60 text-emerald-900 px-2 py-0.5 rounded-md">
              {subcat.name}
            </span>
          </li>
        )}
      </ol>

      {/* Clear active filter button */}
      <button
        onClick={() => onReset?.()}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer ml-auto"
      >
        <span>Tühjenda filter</span>
        <X className="h-3 w-3" />
      </button>
    </nav>
  );
}
