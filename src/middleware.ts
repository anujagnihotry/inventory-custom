import { NextRequest, NextResponse } from "next/server";

const TRIAL_EXPIRY = "2027-01-01"; // app stops working on this date (UTC)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: expired page, auth, Next.js internals
  if (
    pathname.startsWith("/trial-expired") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/login") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const todayUtc = new Date().toISOString().split("T")[0];
  if (todayUtc >= TRIAL_EXPIRY) {
    const url = request.nextUrl.clone();
    url.pathname = "/trial-expired";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
