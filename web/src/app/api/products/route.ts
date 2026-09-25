import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/db";
import { ProductQueryParams } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minPriceStr = searchParams.get("min_price");
    const maxPriceStr = searchParams.get("max_price");
    const brandsStr = searchParams.get("brands");
    const storesStr = searchParams.get("stores");

    const params: ProductQueryParams = {
      search: searchParams.get("search") || undefined,
      pet: searchParams.get("pet") || "all",
      animal: searchParams.get("animal") || undefined,
      type: searchParams.get("type") || "all",
      category_group: searchParams.get("category_group") || searchParams.get("group") || undefined,
      category_slug: searchParams.get("category_slug") || searchParams.get("cat") || searchParams.get("category") || undefined,
      stage: searchParams.get("stage") || "all",
      sort: searchParams.get("sort") || "price_asc",
      min_price: minPriceStr ? parseFloat(minPriceStr) : undefined,
      max_price: maxPriceStr ? parseFloat(maxPriceStr) : undefined,
      brands: brandsStr ? brandsStr.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      stores: storesStr ? storesStr.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    };

    const products = await getProducts(params);
    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error("API /api/products error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
