import { NextRequest, NextResponse } from "next/server";
import { getBannersAdmin, createBannerAdmin } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banners = await getBannersAdmin();
    return NextResponse.json({ success: true, count: banners.length, banners });
  } catch (error: any) {
    console.error("API GET /api/admin/banners error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.placement_id || !body.title || !body.image_url || !body.target_url) {
      return NextResponse.json(
        { success: false, error: "Puuduvad kohustuslikud väljad (placement_id, title, image_url, target_url)" },
        { status: 400 }
      );
    }

    const newId = await createBannerAdmin({
      placement_id: Number(body.placement_id),
      title: body.title,
      image_url: body.image_url,
      target_url: body.target_url,
      alt_text: body.alt_text || null,
      client_name: body.client_name || null,
      weight: body.weight ? Math.max(1, Math.min(10, Number(body.weight))) : 1,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    });

    return NextResponse.json({
      success: true,
      message: "Bänneri kampaania edukalt loodud!",
      id: newId,
    });
  } catch (error: any) {
    console.error("API POST /api/admin/banners error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
