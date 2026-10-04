import { NextResponse } from "next/server";
import { googleConfigured, googleRedirectUri, googleAuthUrl, newState, safeNext } from "@/lib/google";
import { rateLimit, clientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

// Start Google login: sets anti-CSRF state cookie, redirects to accounts.google.com.
// Query: ?next=/dashboard&remember=1
export async function GET(req: Request) {
  if (!googleConfigured())
    return NextResponse.json({ error: "Google login not configured. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET in .env." }, { status: 503 });
  const rl = rateLimit("google_start:" + clientIp(req), 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const u = new URL(req.url);
  const next = safeNext(u.searchParams.get("next"), "/dashboard");
  const remember = u.searchParams.get("remember") === "0" ? "0" : "1";
  const state = newState();
  const redirectUri = googleRedirectUri(req);
  const res = NextResponse.redirect(googleAuthUrl(state, redirectUri));
  const secure = redirectUri.startsWith("https://");
  res.cookies.set("g_state", state, { httpOnly: true, path: "/", maxAge: 5 * 60, sameSite: "lax", secure });
  res.cookies.set("g_next", next, { httpOnly: true, path: "/", maxAge: 5 * 60, sameSite: "lax", secure });
  res.cookies.set("g_rem", remember, { httpOnly: true, path: "/", maxAge: 5 * 60, sameSite: "lax", secure });
  return res;
}
