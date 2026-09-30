import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const CHECK_DATES = ["2026-12-01", "2026-12-15", "2027-01-01"];
const COOKIE_NAME = "__lic";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 18; // 18 days — safely covers the longest gap

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password: string = (body.password ?? "").trim();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Determine which check date is currently active
    const todayUtc  = new Date().toISOString().split("T")[0];
    const passed    = CHECK_DATES.filter((d) => d <= todayUtc);
    const activeDate = passed.at(-1);

    if (!activeDate) {
      return NextResponse.json({ error: "No active license check" }, { status: 400 });
    }

    // Load the bcrypt hash for this check date from DB
    const record = await prisma.licenseCheck.findFirst({
      where: { checkDate: new Date(activeDate + "T00:00:00Z") },
    });

    if (!record) {
      return NextResponse.json(
        { error: "License not configured for this date. Contact your administrator." },
        { status: 500 }
      );
    }

    // Verify password against stored hash
    const valid = await bcrypt.compare(password, record.passwordHash);

    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Mark verified in DB
    await prisma.licenseCheck.update({
      where: { id: record.id },
      data: { verified: true, verifiedAt: new Date() },
    });

    // Build signed cookie: "2026-12-01|<hmac>"
    const secret     = process.env.LICENSE_COOKIE_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    const sig        = await signDate(secret, activeDate);
    const cookieVal  = `${activeDate}|${sig}`;

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, cookieVal, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (err) {
    console.error("License verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
