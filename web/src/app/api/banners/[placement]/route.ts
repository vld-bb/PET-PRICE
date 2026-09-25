import { NextRequest, NextResponse } from "next/server";
import { getActiveBannerForPlacement, getAllActiveBannersForPlacement, recordBannerImpression } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placement: string }> }
) {
  try {
    const { placement } = await params;
    if (!placement) {
      return NextResponse.json({ success: false, error: "Placement missing" }, { status: 400 });
    }

    const [banner, allBanners] = await Promise.all([
      getActiveBannerForPlacement(placement),
      getAllActiveBannersForPlacement(placement),
    ]);

    if (!banner && allBanners.length === 0) {
      return NextResponse.json({
        success: true,
        banner: null,
        banners: [],
      });
    }

    const primaryBanner = banner || allBanners[0];

    // Asynchronously record impression for the primary banner
    if (primaryBanner) {
      recordBannerImpression(primaryBanner.id).catch((err) => {
        console.error("Failed to record impression:", err);
      });
    }

    return NextResponse.json({
      success: true,
      banner: primaryBanner
        ? {
            id: primaryBanner.id,
            placement_identifier: primaryBanner.placement_identifier,
            title: primaryBanner.title,
            image_url: primaryBanner.image_url,
            target_url: primaryBanner.target_url,
            alt_text: primaryBanner.alt_text,
            client_name: primaryBanner.client_name,
            click_url: `/api/banners/click/${primaryBanner.id}`,
          }
        : null,
      banners: allBanners.map((b) => ({
        id: b.id,
        placement_identifier: b.placement_identifier,
        title: b.title,
        image_url: b.image_url,
        target_url: b.target_url,
        alt_text: b.alt_text,
        client_name: b.client_name,
        click_url: `/api/banners/click/${b.id}`,
      })),
    });
  } catch (error: any) {
    console.error("API GET /api/banners/[placement] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
