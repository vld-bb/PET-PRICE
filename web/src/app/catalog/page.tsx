"use client";

import { Suspense } from "react";
import HomePage from "../page";

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Laadimine...</div>}>
      <HomePage />
    </Suspense>
  );
}
