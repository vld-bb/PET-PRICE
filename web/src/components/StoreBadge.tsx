"use client";

import { useState } from "react";
import { Store } from "@/lib/types";

interface StoreBadgeProps {
  store?: Store;
  showDomain?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StoreBadge({ store, showDomain = false }: StoreBadgeProps) {
  const [logoError, setLogoError] = useState(false);

  if (!store) {
    return <span className="text-xs text-slate-500 font-medium">Tundmatu pood</span>;
  }

  const domainPrefix = store.domain ? store.domain.split(".")[0] : ((store as any).slug || "store");

  const storeLogoMap: Record<string, string> = {
    petcity: "/stores/petcity.svg",
    kika: "/stores/kika.avif",
    zoomaailm: "/stores/zoomaailm.webp",
    fera: "/stores/fera.webp",
    koerland: "/stores/koerland.avif",
    zooplus: "/stores/zooplus.svg",
  };

  const primaryLogo = storeLogoMap[domainPrefix] || `/stores/${domainPrefix}.svg`;
  const logoSrc = (store.logo_url && !store.logo_url.includes("unsplash.com"))
    ? store.logo_url
    : primaryLogo;

  return (
    <div className="flex items-center gap-2.5">
    <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-slate-900 leading-tight truncate">{store.name}</span>
        {showDomain && (
          <span className="text-[10px] text-slate-500 font-normal truncate">{store.domain}</span>
        )}
      </div>
    </div>
  );
}
