import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, CheckCircle2, AlertCircle, Scale, Barcode, TrendingDown, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import StoreBadge from "@/components/StoreBadge";
import SparklineChart from "@/components/SparklineChart";
import BannerSlot from "@/components/BannerSlot";
import { getProductBySlug, getStores } from "@/lib/db";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Toode ei leitud - PetPrice" };
  return {
    title: `${product.title} - Hinnavõrdlus | PetPrice`,
    description: `Võrdle toote ${product.title} hinda Eesti lemmikloomapoodides: PetCity, Kika, Zoomaailm, Fera, Koerland, Zooplus. Parim hind alates ${product.lowest_price?.toFixed(2)} €.`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const stores = await getStores();
  const sortedOffers = [...product.offers].sort((a, b) => a.price - b.price);
  const cheapestOffer = sortedOffers[0];
  const mostExpensiveOffer = sortedOffers[sortedOffers.length - 1];

  const maxSavings =
    mostExpensiveOffer && cheapestOffer
      ? Math.max(0, mostExpensiveOffer.price - cheapestOffer.price)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header storesCount={stores.length} />

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tagasi hinnavõrdluse avalehele</span>
        </Link>

        {/* Product Card Overview */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="h-56 w-56 shrink-0 rounded-2xl bg-white p-4 border border-slate-100 flex items-center justify-center">
              <img
                src={
                  product.image_url ||
                  "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80"
                }
                alt={product.title}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                  {product.brand}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {product.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {product.custom_title || product.title}
              </h1>

              {product.custom_description && (
                <p className="text-sm text-slate-600 font-normal leading-relaxed pt-1 pb-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  {product.custom_description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-700 pt-1">
                {product.weight_kg && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Scale className="h-4 w-4 text-slate-400" />
                    Pakendi kaal: <strong>{product.weight_kg} kg</strong>
                  </span>
                )}
                {product.ean && (
                  <span className="flex items-center gap-1.5 font-mono text-xs">
                    <Barcode className="h-4 w-4 text-slate-400" />
                    EAN triipkood: <strong>{product.ean}</strong>
                  </span>
                )}
              </div>

              {/* Price Banner */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-baseline gap-4">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">
                    Soodsaim hind Eestis
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-emerald-600">
                    {product.lowest_price?.toFixed(2)} €
                  </span>
                </div>

                {product.best_price_per_kg && (
                  <div className="border-l border-slate-200 pl-4">
                    <span className="text-xs text-slate-500 block font-medium">
                      Parim ühikuhind
                    </span>
                    <span className="text-xl font-bold text-slate-800">
                      {product.best_price_per_kg.toFixed(2)} €/kg
                    </span>
                  </div>
                )}

                {maxSavings > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800 ml-auto">
                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                    <span>Sääst poode võrreldes kuni {maxSavings.toFixed(2)} €!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Offers on Left, Sticky Sidebar on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Offers & Price Trend Column (2 Cols on Desktop) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Multi-Store Comparison Section */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Poodide hinnad (odavaim enne)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vali sobivaim pood ja suundu otse ostu vormistama
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                  {sortedOffers.length} pakkumist
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-2xs">
                {sortedOffers.map((offer, index) => {
                  const isCheapest = index === 0;
                  const unitPrice =
                    offer.price_per_kg ||
                    (product.weight_kg ? offer.price / product.weight_kg : null);

                  return (
                    <div
                      key={offer.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 gap-4 transition-colors ${
                        isCheapest ? "bg-emerald-50/50 hover:bg-emerald-50" : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <StoreBadge store={offer.store} showDomain />
                        {isCheapest && (
                          <span className="rounded-full bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 uppercase tracking-wider shadow-xs">
                            Parim hind
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="flex items-center gap-1.5">
                          {offer.in_stock ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Laos
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                              <AlertCircle className="h-3.5 w-3.5 text-slate-400" /> Tellimisel
                            </span>
                          )}
                        </div>

                        <div className="text-right min-w-[6rem]">
                          <div className="text-xl font-black text-slate-900 leading-none">
                            {(offer.effective_price ?? offer.price).toFixed(2)} €
                          </div>
                          {offer.override_price && offer.override_price !== offer.price && (
                            <div className="text-[10px] text-amber-600 font-semibold line-through">
                              {offer.price.toFixed(2)} €
                            </div>
                          )}
                          {unitPrice && (
                            <div className="text-xs font-bold text-slate-500 mt-1">
                              {unitPrice.toFixed(2)} €/kg
                            </div>
                          )}
                        </div>

                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noopener sponsored"
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-xs ${
                            isCheapest
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          <span>Mine poodi</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price History Sparkline */}
            {cheapestOffer?.price_history && cheapestOffer.price_history.length > 0 && (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs">
                <h2 className="text-base font-black text-slate-900 mb-1">
                  Hinna liikumise trend (viimased nädalad)
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Igapäevaselt salvestatud hindade dünaamika soodsaimas poes ({cheapestOffer.store?.name})
                </p>
                <SparklineChart data={cheapestOffer.price_history} height={80} />
              </div>
            )}
          </div>

          {/* Sidebar Column (1 Col on Desktop, Always Visible, Min-H Protected) */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Product Sidebar Banner Slot */}
              <BannerSlot placement="product_sidebar" className="w-full" />

              {/* Price Transparency & Shopping Tips */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Sõltumatu hinnagarantii</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  PetPrice võrdleb toiduhindu reaalajas otse Eesti juhtivatest lemmikloomapoodidest. Toodete hinnad ja saadavus uuenevad igapäevaselt.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Kontrollitud andmed</span>
                  <span className="font-semibold text-emerald-700">100% erapooletu</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 PetPrice.ee. Kõik õigused kaitstud.</p>
          <a href="mailto:info@petprice.ee" className="hover:text-emerald-600 font-semibold underline decoration-emerald-500/40">
            info@petprice.ee
          </a>
        </div>
      </footer>
    </div>
  );
}
