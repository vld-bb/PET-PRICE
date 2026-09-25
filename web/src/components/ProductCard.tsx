"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Tag, Scale, ShoppingCart, TrendingDown } from "lucide-react";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

export default function ProductCard({ product, onOpenModal }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const fallbackImage =
    "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80";

  const lowestPrice = product.lowest_price;
  const bestKgPrice = product.best_price_per_kg;

  const sortedOffers = product.offers ? [...product.offers].sort((a, b) => a.price - b.price) : [];
  const cheapestOffer = sortedOffers[0];
  const mostExpensiveOffer = sortedOffers[sortedOffers.length - 1];

  const maxSavings =
    mostExpensiveOffer && cheapestOffer
      ? Math.max(0, mostExpensiveOffer.price - cheapestOffer.price)
      : 0;

  const percentSavings =
    mostExpensiveOffer && cheapestOffer && maxSavings > 0
      ? Math.round((maxSavings / mostExpensiveOffer.price) * 100)
      : (product.savings_percent || 0);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200/80 p-3 sm:p-4 shadow-2xs hover:shadow-lg hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-200">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-800 tracking-wide uppercase truncate max-w-[55%]">
            {product.brand || "Lemmikloom"}
          </span>

          {percentSavings > 0 ? (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              <TrendingDown className="h-2.5 w-2.5" />
              <span>-{percentSavings}%</span>
            </span>
          ) : (
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate max-w-[45%]">
              {product.category || "Täissööt"}
            </span>
          )}
        </div>

        {/* Product Image */}
        <div
          onClick={() => onOpenModal(product)}
          className="relative h-36 sm:h-40 w-full overflow-hidden rounded-xl bg-white cursor-pointer flex items-center justify-center p-2 mb-3"
        >
          <img
            src={imgError || !product.image_url ? fallbackImage : product.image_url}
            alt={product.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {product.weight_kg && (
            <div className="absolute bottom-1.5 right-1.5 rounded-md bg-slate-900/80 backdrop-blur px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-white shadow-xs">
              {product.weight_kg} kg
            </div>
          )}
          {maxSavings > 0 && (
            <div className="absolute top-1.5 right-1.5 rounded-md bg-emerald-500 text-white px-2 py-0.5 text-[10px] sm:text-xs font-bold shadow-xs">
              Säästa kuni {maxSavings.toFixed(2)} €
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenModal(product)}
          className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-emerald-600 transition-colors cursor-pointer min-h-[2.25rem] leading-snug"
          title={product.title}
        >
          {product.title}
        </h3>

        {/* Packaging and Category subtext */}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
          {product.weight_kg && (
            <span className="inline-flex items-center gap-1 font-medium">
              <Scale className="h-3 w-3 text-slate-400" />
              {product.weight_kg} kg
            </span>
          )}
          {product.ean && (
            <span className="text-[10px] text-slate-400 font-mono">
              EAN: {product.ean.slice(-6)}
            </span>
          )}
        </div>
      </div>

      {/* Price & Retailer Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-1">
          <div>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block">
              Parim hind
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black tracking-tight text-emerald-600">
                {lowestPrice !== undefined ? lowestPrice.toFixed(2) : "–"} €
              </span>
            </div>
          </div>

          {bestKgPrice !== undefined && (
            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block">
                Ühikuhind
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {bestKgPrice.toFixed(2)} €/kg
              </span>
            </div>
          )}
        </div>

        {/* Retailer Availability Badge & Action Button */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-600 bg-slate-100/90 rounded-full px-2 py-0.5 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              {product.stores_count || product.offers.length} {product.stores_count === 1 ? "pood" : "poodi"}
            </span>
          </div>

          <button
            onClick={() => onOpenModal(product)}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-emerald-600 transition-all duration-200 shrink-0"
          >
            <span>Võrdle</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
