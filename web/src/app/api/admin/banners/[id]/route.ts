import { NextRequest, NextResponse } from "next/server";
import { updateBannerAdmin, deleteBannerAdmin } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ success: false, error: "Vigane bänneri ID" }, { status: 400 });
    }

    const body = await request.json();

    await updateBannerAdmin(numId, {
      placement_id: body.placement_id !== undefined ? Number(body.placement_id) : undefined,
      title: body.title,
      image_url: body.image_url,
      target_url: body.target_url,
      alt_text: body.alt_text !== undefined ? body.alt_text : undefined,
      client_name: body.client_name !== undefined ? body.client_name : undefined,
      weight: body.weight !== undefined ? Math.max(1, Math.min(10, Number(body.weight))) : undefined,
      start_date: body.start_date !== undefined ? body.start_date : undefined,
      end_date: body.end_date !== undefined ? body.end_date : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Bänner edukalt uuendatud!",
    });
  } catch (error: any) {
    console.error("API PUT /api/admin/banners/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ success: false, error: "Vigane bänneri ID" }, { status: 400 });
    }

    await deleteBannerAdmin(numId);
    return NextResponse.json({
      success: true,
      message: "Bänner edukalt kustutatud!",
    });
  } catch (error: any) {
    console.error("API DELETE /api/admin/banners/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
