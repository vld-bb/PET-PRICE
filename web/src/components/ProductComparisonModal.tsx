"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, CheckCircle2, AlertCircle, TrendingDown, Scale, Barcode } from "lucide-react";
import { Product, StoreOffer, PriceHistoryPoint } from "@/lib/types";
import StoreBadge from "./StoreBadge";
import SparklineChart from "./SparklineChart";

interface ProductComparisonModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductComparisonModal({
  product,
  onClose,
}: ProductComparisonModalProps) {
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(product);
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch full details with price history when modal opens
  useEffect(() => {
    if (!product) return;
    setDetailedProduct(product);

    let isMounted = true;
    setLoading(true);

    fetch(`/api/products/${product.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.product) {
          setDetailedProduct(data.product);
        }
      })
      .catch((err) => console.error("Error fetching product detail:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product]);

  if (!product) return null;

  const current = detailedProduct || product;

  // Sort offers from lowest to highest price
  const sortedOffers = [...current.offers].sort((a, b) => a.price - b.price);
  const cheapestOffer = sortedOffers[0];
  const mostExpensiveOffer = sortedOffers[sortedOffers.length - 1];

  const maxSavings =
    mostExpensiveOffer && cheapestOffer
      ? Math.max(0, mostExpensiveOffer.price - cheapestOffer.price)
      : 0;

  const percentSavings =
    mostExpensiveOffer && cheapestOffer && maxSavings > 0
      ? Math.round((maxSavings / mostExpensiveOffer.price) * 100)
      : 0;

  // Aggregate price history across offers or take cheapest offer's history
  const allHistoryPoints: PriceHistoryPoint[] = [];
  sortedOffers.forEach((o) => {
    if (o.price_history) {
      allHistoryPoints.push(...o.price_history);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
              Hinnavõrdlus
            </span>
            <span className="text-xs font-medium text-slate-500">
              Võrreldud {sortedOffers.length} poes
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors"
            title="Sulge aken (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Product Overview Row */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="h-32 w-32 shrink-0 rounded-2xl bg-white p-2 border border-slate-100 flex items-center justify-center">
              <img
                src={
                  current.image_url ||
                  "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80"
                }
                alt={current.title}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                  {current.brand || "Lemmikloom"}
                </span>
                <span className="text-xs text-slate-500">{current.category}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                {current.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 pt-1">
                {current.weight_kg && (
                  <span className="flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5 text-slate-400" />
                    <strong>{current.weight_kg} kg</strong> pakend
                  </span>
                )}
                {current.ean && (
                  <span className="flex items-center gap-1 font-mono">
                    <Barcode className="h-3.5 w-3.5 text-slate-400" />
                    EAN: <strong>{current.ean}</strong>
                  </span>
                )}
              </div>

              {maxSavings > 0 && (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-xl">
                  <TrendingDown className="h-4 w-4 text-emerald-600" />
                  <span>
                    Valides odavaima poe säästad kuni{" "}
                    <strong className="text-emerald-700 font-black">{maxSavings.toFixed(2)} € (-{percentSavings}%)</strong>!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Store Comparison Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Hinnad Eesti poodides (odavaim enne)
              </h3>
              <span className="text-xs text-slate-600 font-medium">Reaalajas kontrollitud</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
              {sortedOffers.map((offer, index) => {
                const isCheapest = index === 0;
                const unitPrice =
                  offer.price_per_kg ||
                  (current.weight_kg ? offer.price / current.weight_kg : null);

                return (
                  <div
                    key={offer.id || offer.store_id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 transition-colors ${
                      isCheapest ? "bg-emerald-50/50 hover:bg-emerald-50" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    {/* Store info */}
                    <div className="flex items-center gap-3">
                      <StoreBadge store={offer.store} showDomain />
                      {isCheapest && (
                        <span className="rounded-full bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-wider shadow-xs">
                          Parim hind
                        </span>
                      )}
                    </div>

                    {/* Stock, Price, & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      {/* Stock status */}
                      <div className="flex items-center gap-1.5">
                        {offer.in_stock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Laos
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            <AlertCircle className="h-3 w-3 text-slate-400" /> Otsas
                          </span>
                        )}
                      </div>

                      {/* Savings */}
                      {sortedOffers.length > 1 ? (
                        <div className="hidden sm:flex items-center justify-center min-w-[7rem]">
                          {isCheapest && maxSavings > 0 ? (
                            <span className="bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                              Sääst: {maxSavings.toFixed(2)} € (-{percentSavings}%)
                            </span>
                          ) : (
                            <span className="text-slate-300 font-medium">—</span>
                          )}
                        </div>
                      ) : (
                        <div className="hidden sm:flex items-center justify-center min-w-[7rem]">
                          <span className="text-xs text-slate-400 font-medium">Ainult 1 pakkumine</span>
                        </div>
                      )}


                      {/* Pricing */}
                      <div className="text-right min-w-[5.5rem]">
                        <div className="text-lg font-black text-slate-900 leading-none">
                          {offer.price.toFixed(2)} €
                        </div>
                        {unitPrice && (
                          <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                            {unitPrice.toFixed(2)} €/kg
                          </div>
                        )}
                      </div>

                      {/* Outbound Link Button */}
                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener sponsored"
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                          isCheapest
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        <span>Osta</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price History Sparkline Section */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Hinnamuutuste ajalugu
              </span>
              <span className="text-xs text-slate-600 font-medium">Viimased 45 päeva</span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Jälgi hinnakõikumisi ja osta lemmikloomatoitu soodsaimal võimalikul hetkel.
            </p>

            {cheapestOffer?.price_history && cheapestOffer.price_history.length > 0 ? (
              <SparklineChart data={cheapestOffer.price_history} height={70} />
            ) : allHistoryPoints.length > 0 ? (
              <SparklineChart data={allHistoryPoints} height={70} />
            ) : (
              <div className="text-xs text-slate-600 italic py-2">
                Hinnaajalugu kogutakse igapäevaselt järgmiste kraapimistsüklite käigus.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-600">
          <span>* Hinnad ja laoseis võivad poodides reaalajas muutuda.</span>
        </div>
      </div>
    </div>
  );
}
