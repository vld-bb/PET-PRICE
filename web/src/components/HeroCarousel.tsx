"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, ChevronLeft, ChevronRight, ExternalLink, TrendingDown } from "lucide-react";

interface BannerItem {
  id: number;
  placement_identifier: string;
  title: string;
  image_url: string;
  target_url: string;
  alt_text: string | null;
  client_name: string | null;
  click_url: string;
}

export default function HeroCarousel() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Fetch active banners for home_hero placement
  useEffect(() => {
    let isMounted = true;
    async function loadBanners() {
      try {
        const res = await fetch("/api/banners/home_hero");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.banners && data.banners.length > 0) {
              setBanners(data.banners);
            } else if (data.banner) {
              setBanners([data.banner]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load hero banners:", err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }
    loadBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  // Total slides: Slide 0 is always the Value Proposition, Slide 1..N are marketing banners
  const totalSlides = 1 + banners.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay with 6-second interval (pause on hover)
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, totalSlides, nextSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <section
      aria-label="Avalehe peabännerite karussell"
      className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-slate-900 border border-slate-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding Track */}
      <div
        className="flex transition-transform duration-700 ease-in-out w-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {/* SLIDE 1: Core Value Proposition */}
        <div className="w-full flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-10 md:p-12 text-white min-h-[290px] sm:min-h-[330px] md:min-h-[350px] flex flex-col justify-center">
          {/* Ambient Glows */}
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-16 h-56 w-56 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/25 px-3.5 py-1 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Eesti esimene sõltumatu lemmikloomatoidu hinnavõrdlus</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Säästa lemmikloomatoidult kuni{" "}
              <span className="text-emerald-400 underline decoration-emerald-500/50 underline-offset-4">
                25% igalt kotilt
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
              Võrdleme reaalajas toidupakkumisi ja ühikuhindu (€/kg) Eesti usaldusväärseimatest e-poodidest.
            </p>
          </div>
        </div>

        {/* SLIDE 2+ : Marketing / Sponsor Banners */}
        {banners.map((b) => (
          <div
            key={b.id}
            className="w-full flex-shrink-0 relative overflow-hidden min-h-[290px] sm:min-h-[330px] md:min-h-[350px] flex flex-col justify-center group"
          >
            {/* Banner Background Image */}
            <img
              src={b.image_url}
              alt={b.alt_text || b.title}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 brightness-90 group-hover:brightness-95"
              loading="lazy"
            />

            {/* Gradient Dark Overlay for Legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-black/30 z-10" />

            {/* Content Box */}
            <div className="relative z-20 max-w-2xl p-6 sm:p-10 md:p-12 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold tracking-wide uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{b.client_name || "Partnerpakkumine"}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                {b.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-200 line-clamp-2">
                {b.alt_text || "Kasuta eksklusiivset sooduspakkumist ja telli lemmikule kvaliteetne toit parima hinnaga."}
              </p>

              <div>
                <a
                  href={b.click_url}
                  target="_blank"
                  rel="noopener sponsored"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-6 py-3 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Vaata pakkumist</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Reklaam Badge */}
            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white/80 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-white/10">
              Reklaam
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows (visible if more than 1 slide) */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prevSlide();
            }}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white backdrop-blur-md border border-white/15 transition-all shadow-md hover:scale-105 active:scale-95"
            aria-label="Eelmine slaid"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              nextSlide();
            }}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white backdrop-blur-md border border-white/15 transition-all shadow-md hover:scale-105 active:scale-95"
            aria-label="Järgmine slaid"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Pagination Indicators / Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Mine slaidile ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === idx
                    ? "w-7 h-2 bg-emerald-400 shadow-sm"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
