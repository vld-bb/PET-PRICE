"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, Sparkles } from "lucide-react";

interface BannerData {
  id: number;
  placement_identifier: string;
  title: string;
  image_url: string;
  target_url: string;
  alt_text: string | null;
  client_name: string | null;
  click_url: string;
}

interface BannerSlotProps {
  placement: "header_top" | "home_hero" | "catalog_leaderboard" | "product_sidebar" | string;
  className?: string;
  showBorder?: boolean;
}

export default function BannerSlot({
  placement,
  className = "",
  showBorder = true,
}: BannerSlotProps) {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchBanner() {
      try {
        const res = await fetch(`/api/banners/${placement}`);
        if (!res.ok) throw new Error("Failed to fetch banner");
        const data = await res.json();
        if (isMounted) {
          setBanner(data.banner || null);
        }
      } catch (err) {
        if (isMounted) setBanner(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchBanner();

    return () => {
      isMounted = false;
    };
  }, [placement]);

  if (loading) {
    if (placement === "product_sidebar") {
      return (
        <div
          className={`w-full min-h-[250px] rounded-2xl bg-slate-100/90 animate-pulse border border-slate-200/80 p-5 flex flex-col justify-end shadow-2xs ${className}`}
        >
          <div className="h-3 w-20 bg-slate-200 rounded-md mb-2" />
          <div className="h-4 w-3/4 bg-slate-200 rounded-md mb-2" />
          <div className="h-3 w-1/3 bg-slate-200 rounded-md" />
        </div>
      );
    }
    return null;
  }

  if (!banner) {
    if (placement === "product_sidebar") {
      return (
        <div
          className={`w-full min-h-[250px] rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 p-6 flex flex-col items-center justify-center text-center shadow-2xs ${className}`}
        >
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full mb-2">
            Sponsoreeritud partner
          </span>
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            Partnerpakkumiste ala
          </h4>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-3">
            Oled lemmikloomapoe esindaja? Kuva oma kampaaniat ja sooduskoode tuhandetele loomaomanikele.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            <span>info@petprice.ee</span>
          </span>
        </div>
      );
    }
    return null;
  }

  // Custom styling tailored to placement
  if (placement === "header_top") {
    return (
      <div className={`w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white text-xs py-1.5 px-4 shadow-sm ${className}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a
            href={banner.click_url}
            target="_blank"
            rel="noopener sponsored"
            className="flex items-center gap-2 hover:underline transition-all group flex-1 justify-center text-center truncate"
          >
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" />
              Sooduspakkumine
            </span>
            <span className="font-medium text-emerald-100 group-hover:text-white truncate">
              {banner.title}
            </span>
            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 flex-shrink-0" />
          </a>
        </div>
      </div>
    );
  }

  if (placement === "home_hero") {
    return (
      <div className={`w-full ${className}`}>
        <a
          href={banner.click_url}
          target="_blank"
          rel="noopener sponsored"
          className="group relative block w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-stone-200 bg-stone-900"
        >
          <div className="relative w-full h-44 sm:h-52 md:h-60 overflow-hidden">
            <img
              src={banner.image_url}
              alt={banner.alt_text || banner.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100"
              loading="lazy"
            />
            {/* Rich gradient overlay for typography readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent flex items-center p-6 md:p-8">
              <div className="max-w-xl text-white">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold tracking-wide uppercase shadow-sm mb-3">
                  <Sparkles className="w-3 h-3" />
                  {banner.client_name || "Partnerpakkumine"}
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-white mb-2 drop-shadow-sm">
                  {banner.title}
                </h3>
                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 group-hover:text-emerald-200 group-hover:translate-x-1 transition-all">
                  <span>Vaata pakkumist</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Sponsored transparency badge */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white/80 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded border border-white/10">
              Reklaam
            </div>
          </div>
        </a>
      </div>
    );
  }

  if (placement === "catalog_leaderboard") {
    return (
      <div className={`w-full ${className}`}>
        <a
          href={banner.click_url}
          target="_blank"
          rel="noopener sponsored"
          className="group relative block w-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-stone-200 bg-stone-900"
        >
          <div className="relative w-full h-28 sm:h-32 overflow-hidden">
            <img
              src={banner.image_url}
              alt={banner.alt_text || banner.title}
              className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center px-6">
              <div className="text-white max-w-lg">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                  {banner.client_name || "Sponsoreeritud"}
                </span>
                <p className="font-bold text-base sm:text-lg text-white mt-1 group-hover:text-emerald-200 transition-colors line-clamp-1">
                  {banner.title}
                </p>
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-black/60 text-white/70 text-[9px] uppercase px-1.5 py-0.5 rounded">
              Reklaam
            </div>
          </div>
        </a>
      </div>
    );
  }

  if (placement === "product_sidebar") {
    return (
      <div className={`w-full min-h-[250px] ${className}`}>
        <a
          href={banner.click_url}
          target="_blank"
          rel="noopener sponsored"
          className="group relative block w-full min-h-[250px] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 bg-slate-900"
        >
          <div className="relative w-full min-h-[250px] h-64 sm:h-72 overflow-hidden">
            <img
              src={banner.image_url}
              alt={banner.alt_text || banner.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex flex-col justify-end p-5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 mb-1">
                {banner.client_name || "Eripakkumine"}
              </span>
              <p className="font-bold text-sm sm:text-base text-white line-clamp-2 group-hover:text-emerald-200 transition-colors">
                {banner.title}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                <span>Tutvu lähemalt</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white/80 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border border-white/10">
              Reklaam
            </div>
          </div>
        </a>
      </div>
    );
  }

  // Generic fallback rendering
  return (
    <div className={`w-full ${className}`}>
      <a
        href={banner.click_url}
        target="_blank"
        rel="noopener sponsored"
        className="group relative block w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-900 hover:shadow-md transition-all"
      >
        <div className="relative w-full h-32 overflow-hidden">
          <img
            src={banner.image_url}
            alt={banner.alt_text || banner.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center px-4">
            <h4 className="text-white font-bold text-base group-hover:underline">{banner.title}</h4>
          </div>
          <span className="absolute top-2 right-2 bg-black/60 text-white/70 text-[9px] uppercase px-1.5 py-0.5 rounded">
            Reklaam
          </span>
        </div>
      </a>
    </div>
  );
}
