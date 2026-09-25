import { NextRequest, NextResponse } from "next/server";
import { getAdminProductById, updateProductAdmin } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ success: false, error: "Vigane toote ID" }, { status: 400 });
    }

    const product = await getAdminProductById(numId);
    if (!product) {
      return NextResponse.json({ success: false, error: "Toodet ei leitud" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("API GET /api/admin/products/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ success: false, error: "Vigane toote ID" }, { status: 400 });
    }

    const body = await request.json();

    await updateProductAdmin(numId, {
      title: body.title,
      custom_title: body.custom_title !== undefined ? body.custom_title : undefined,
      custom_description: body.custom_description !== undefined ? body.custom_description : undefined,
      brand: body.brand,
      category: body.category,
      weight_kg: body.weight_kg !== undefined ? (body.weight_kg !== null ? Number(body.weight_kg) : null) : undefined,
      image_url: body.image_url,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      is_featured: body.is_featured !== undefined ? Boolean(body.is_featured) : undefined,
    });

    const updated = await getAdminProductById(numId);
    return NextResponse.json({
      success: true,
      message: "Toode edukalt uuendatud!",
      product: updated,
    });
  } catch (error: any) {
    console.error("API PUT /api/admin/products/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
