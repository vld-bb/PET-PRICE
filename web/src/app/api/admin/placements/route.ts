import { NextResponse } from "next/server";
import { getBannerPlacements } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const placements = await getBannerPlacements();
    return NextResponse.json({ success: true, placements });
  } catch (error: any) {
    console.error("API GET /api/admin/placements error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
