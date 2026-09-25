import { NextRequest, NextResponse } from "next/server";
import { recordBannerClick } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const targetUrl = await recordBannerClick(numId);
    if (!targetUrl) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 307 temporary redirect to destination
    const res = NextResponse.redirect(targetUrl, 307);
    res.headers.set("Referrer-Policy", "no-referrer-when-downgrade");
    return res;
  } catch (error) {
    console.error("API GET /api/banners/click/[id] error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
