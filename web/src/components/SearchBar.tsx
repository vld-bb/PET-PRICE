"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Barcode, Sparkles } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const POPULAR_SEARCHES = [
  "Royal Canin",
  "Acana",
  "Orijen",
  "Brit Care",
  "Hill's",
  "Josera",
  "Applaws",
  "Carnilove",
];

export default function SearchBar({
  value,
  onChange,
  placeholder = "Otsi brändi, tootenime või EAN triipkoodi järgi (nt. Royal Canin, 15kg, 318255...)",
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounce input updates by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [internalValue, onChange, value]);

  const handleClear = () => {
    setInternalValue("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
          <Search className="h-5 w-5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-3.5 sm:py-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm sm:text-base font-normal"
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {internalValue && (
            <button
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Tühjenda otsing"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-500 select-none">
            <Barcode className="h-3.5 w-3.5 text-slate-400" />
            <span>EAN</span>
          </div>
        </div>
      </div>

      {/* Popular quick-pick badges */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-600 font-medium whitespace-nowrap flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" /> Populaarsed:
        </span>
        {POPULAR_SEARCHES.map((brand) => (
          <button
            key={brand}
            onClick={() => {
              setInternalValue(brand);
              onChange(brand);
            }}
            className={`px-2.5 py-1 rounded-full border transition-all whitespace-nowrap text-xs ${
              internalValue.toLowerCase() === brand.toLowerCase()
                ? "bg-emerald-600 text-white border-emerald-600 font-medium shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {brand}
          </button>
        ))}
      </div>
    </div>
  );
}
