import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getAdminStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("API /api/admin/stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
