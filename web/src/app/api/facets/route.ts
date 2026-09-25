import { NextRequest, NextResponse } from "next/server";
import { getFilterFacets } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const species = searchParams.get("animal") || searchParams.get("species") || undefined;
    const facets = await getFilterFacets(species);

    return NextResponse.json({
      success: true,
      facets,
    });
  } catch (error: any) {
    console.error("API /api/facets error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch facets" },
      { status: 500 }
    );
  }
}
