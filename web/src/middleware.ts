import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Simple auth token calculation based on admin password
function getExpectedToken(): string {
  // Simple deterministic token for session verification
  return Buffer.from(`admin:${ADMIN_PASSWORD}`).toString("base64");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin and /api/admin paths
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApiPath = pathname.startsWith("/api/admin");

  if (!isAdminPath && !isAdminApiPath) {
    return NextResponse.next();
  }

  // Allow login page and auth endpoint without authentication
  if (pathname === "/admin/login" || pathname === "/api/admin/auth") {
    return NextResponse.next();
  }

  const expectedToken = getExpectedToken();
  const sessionCookie =
    request.cookies.get("petprice_admin_session")?.value ||
    request.cookies.get("lemmikuhind_admin_session")?.value;

  // 1. Check session cookie
  if (sessionCookie && sessionCookie === expectedToken) {
    return NextResponse.next();
  }

  // 2. Check HTTP Basic Auth header (for direct API access or curl)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    const base64Credentials = authHeader.slice(6);
    try {
      const decoded = Buffer.from(base64Credentials, "base64").toString("utf-8");
      const [, pass] = decoded.split(":");
      if (pass === ADMIN_PASSWORD) {
        return NextResponse.next();
      }
    } catch {
      // Invalid base64, fall through
    }
  }

  // If unauthorized for API requests, return 401
  if (isAdminApiPath) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin authentication required." },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="PetPrice Admin"',
        },
      }
    );
  }

  // If unauthorized for UI pages, redirect to /admin/login
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
