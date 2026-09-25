import { NextResponse } from "next/server";
import { getStores, getDatabaseStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [stores, stats] = await Promise.all([getStores(), getDatabaseStats()]);
    return NextResponse.json({
      success: true,
      stores,
      stats,
    });
  } catch (error: any) {
    console.error("API /api/stores error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch stores" },
      { status: 500 }
    );
  }
}
