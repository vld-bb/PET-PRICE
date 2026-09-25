import { NextRequest, NextResponse } from "next/server";
import { getAdminProducts, createProductAdmin } from "@/lib/db";
import { AdminProductQueryParams } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: AdminProductQueryParams = {
      search: searchParams.get("search") || undefined,
      brand: searchParams.get("brand") || undefined,
      category: searchParams.get("category") || undefined,
      status: (searchParams.get("status") as any) || "all",
      match_status: (searchParams.get("match_status") as any) || "all",
    };

    const products = await getAdminProducts(params);
    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error("API /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch admin products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Toote pealkiri on kohustuslik!" },
        { status: 400 }
      );
    }

    const newId = await createProductAdmin({
      title: body.title,
      slug: body.slug,
      brand: body.brand || null,
      category: body.category || null,
      weight_kg: body.weight_kg ? Number(body.weight_kg) : null,
      image_url: body.image_url || null,
      ean: body.ean || null,
      custom_description: body.custom_description || null,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      is_featured: Boolean(body.is_featured),
    });

    return NextResponse.json({
      success: true,
      message: "Toode edukalt lisatud!",
      id: newId,
    });
  } catch (error: any) {
    console.error("API POST /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
