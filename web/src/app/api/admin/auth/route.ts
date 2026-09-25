import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function getExpectedToken(): string {
  return Buffer.from(`admin:${ADMIN_PASSWORD}`).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Vale parool! Palun proovi uuesti." },
        { status: 401 }
      );
    }

    const token = getExpectedToken();
    const response = NextResponse.json({
      success: true,
      message: "Sisselogimine õnnestus!",
    });

    response.cookies.set("petprice_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Autentimise viga" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Välja logitud",
  });

  response.cookies.set("petprice_admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
