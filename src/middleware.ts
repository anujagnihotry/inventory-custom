import { NextRequest, NextResponse } from "next/server";

// ── License check dates (UTC) ─────────────────────────────────────────────
const CHECK_DATES = ["2026-12-01", "2026-12-15", "2027-01-01", "2027-02-01", "2027-03-01"] as const;
const COOKIE_NAME = "__lic";
const GATE_PATH   = "/license-gate";

// ── HMAC using Web Crypto (Edge Runtime compatible) ───────────────────────
async function signDate(secret: string, date: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(date));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isCookieValid(
  cookieVal: string | undefined,
  activeDate: string,
  secret: string
): Promise<boolean> {
  if (!cookieVal) return false;
  const [date, sig] = cookieVal.split("|");
  if (date !== activeDate) return false;
  const expected = await signDate(secret, date);
  // constant-time comparison not available in Edge — using length+char check
  return sig === expected;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: gate page, license API, auth, Next.js internals, static
  if (
    pathname.startsWith(GATE_PATH) ||
    pathname.startsWith("/api/license") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/login") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Find the most recent check date that has passed (UTC date string)
  const todayUtc = new Date().toISOString().split("T")[0];
  const passed   = CHECK_DATES.filter((d) => d <= todayUtc);

  // No check date has arrived yet — app is fully open
  if (passed.length === 0) return NextResponse.next();

  const activeDate = passed[passed.length - 1];
  const secret     = process.env.LICENSE_COOKIE_SECRET;

  // If not configured (dev/test), fail open
  if (!secret) return NextResponse.next();

  const cookieVal = request.cookies.get(COOKIE_NAME)?.value;
  if (await isCookieValid(cookieVal, activeDate, secret)) {
    return NextResponse.next();
  }

  // Locked — redirect to gate page
  const url = request.nextUrl.clone();
  url.pathname = GATE_PATH;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
