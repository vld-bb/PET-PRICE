import { NextRequest, NextResponse } from "next/server";
import { updateStoreOfferAdmin, createStoreOfferAdmin } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ success: false, error: "Vigane pakkumise ID" }, { status: 400 });
    }

    const body = await request.json();

    await updateStoreOfferAdmin(numId, {
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      override_price:
        body.override_price !== undefined
          ? body.override_price !== null && body.override_price !== ""
            ? Number(body.override_price)
            : null
          : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Pakkumine edukalt uuendatud!",
    });
  } catch (error: any) {
    console.error("API PUT /api/admin/offers/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.product_id || !body.store_id || !body.url || body.price === undefined) {
      return NextResponse.json(
        { success: false, error: "Puuduvad kohustuslikud väljad (product_id, store_id, url, price)" },
        { status: 400 }
      );
    }

    const newId = await createStoreOfferAdmin({
      product_id: Number(body.product_id),
      store_id: Number(body.store_id),
      url: body.url,
      price: Number(body.price),
      price_per_kg: body.price_per_kg ? Number(body.price_per_kg) : null,
      override_price: body.override_price ? Number(body.override_price) : null,
      in_stock: body.in_stock !== false,
      is_active: body.is_active !== false,
    });

    return NextResponse.json({
      success: true,
      message: "Pakkumine edukalt lisatud!",
      id: newId,
    });
  } catch (error: any) {
    console.error("API POST /api/admin/offers error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
