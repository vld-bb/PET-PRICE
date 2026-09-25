"use client";

import { useState } from "react";
import { PriceHistoryPoint } from "@/lib/types";

interface SparklineChartProps {
  data: PriceHistoryPoint[];
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export default function SparklineChart({
  data,
  width = 240,
  height = 64,
  showLabels = true,
}: SparklineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-16 w-full items-center justify-center text-xs text-slate-400 italic">
        Ajalugu puudub
      </div>
    );
  }

  // Sort chronologically
  const sorted = [...data].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const prices = sorted.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = 12;

  const effectiveWidth = width;
  const effectiveHeight = height;

  const priceRange = maxPrice === minPrice ? 1 : maxPrice - minPrice;

  const points = sorted.map((d, i) => {
    const x =
      sorted.length === 1
        ? effectiveWidth / 2
        : padding + (i / (sorted.length - 1)) * (effectiveWidth - padding * 2);
    const normalizedY = (d.price - minPrice) / priceRange;
    const y = effectiveHeight - padding - normalizedY * (effectiveHeight - padding * 2);
    return { x, y, ...d };
  });

  const pathD =
    points.length === 1
      ? `M 0 ${points[0].y} L ${effectiveWidth} ${points[0].y}`
      : points.reduce(
          (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
          ""
        );

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${effectiveHeight} L ${points[0].x} ${effectiveHeight} Z`
      : "";

  const isPriceDown =
    sorted.length > 1 && sorted[sorted.length - 1].price <= sorted[0].price;

  const strokeColor = isPriceDown ? "#059669" : "#2563eb";
  const fillColor = isPriceDown ? "rgba(5, 150, 105, 0.12)" : "rgba(37, 99, 235, 0.12)";

  return (
    <div className="relative flex flex-col">
      <div className="relative">
        <svg
          viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
          className="w-full overflow-visible"
          style={{ height: `${height}px` }}
        >
          <defs>
            <linearGradient id={`grad-${minPrice}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          {areaD && <path d={areaD} fill={`url(#grad-${minPrice})`} />}

          {/* Sparkline curve */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? "5" : "3"}
              fill={hoveredIndex === i ? strokeColor : "#ffffff"}
              stroke={strokeColor}
              strokeWidth="2"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="pointer-events-none absolute -top-8 transform -translate-x-1/2 rounded bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white shadow-md"
            style={{
              left: `${(points[hoveredIndex].x / effectiveWidth) * 100}%`,
            }}
          >
            {points[hoveredIndex].price.toFixed(2)} €
          </div>
        )}
      </div>

      {showLabels && (
        <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <span>Min: {minPrice.toFixed(2)} €</span>
          <span>Max: {maxPrice.toFixed(2)} €</span>
        </div>
      )}
    </div>
  );
}
