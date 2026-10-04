import { NextResponse } from "next/server";
import { googleConfigured, googleRedirectUri, googleExchangeCode, googleFetchProfile, safeNext } from "@/lib/google";
import { readDb, writeDb, uid } from "@/lib/db";
import { signJwt } from "@/lib/auth";
import { rateLimit, clientIp, cookieSecure } from "@/lib/security";
import { newPersonalKey } from "@/lib/mcpOAuth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Google callback: ?code=...&state=... — verifies state, exchanges code,
// finds/links user by verified email, sets session cookie, redirects.
export async function GET(req: Request) {
  if (!googleConfigured())
    return NextResponse.json({ error: "Google login not configured." }, { status: 503 });
  const rl = rateLimit("google_cb:" + clientIp(req), 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const u = new URL(req.url);
  const code = u.searchParams.get("code") || "";
  const state = u.searchParams.get("state") || "";
  const cookies = req.headers.get("cookie") || "";
  const get = (n: string) => {
    const m = cookies.split(";").map((s) => s.trim()).find((s) => s.startsWith(n + "="));
    return m ? decodeURIComponent(m.slice(n.length + 1)) : "";
  };
  const wantState = get("g_state");
  const wantNext = safeNext(get("g_next"), "/dashboard");
  const remember = get("g_rem") !== "0";
  const clear = (r: NextResponse) => {
    r.cookies.set("g_state", "", { httpOnly: true, path: "/", maxAge: 0 });
    r.cookies.set("g_next", "", { httpOnly: true, path: "/", maxAge: 0 });
    r.cookies.set("g_rem", "", { httpOnly: true, path: "/", maxAge: 0 });
    return r;
  };
  if (!code || !state || !wantState || state !== wantState) {
    return clear(NextResponse.redirect(new URL("/login?err=google_state", req.url)));
  }
  try {
    const redirectUri = googleRedirectUri(req);
    const { accessToken } = await googleExchangeCode(code, redirectUri);
    const prof = await googleFetchProfile(accessToken);
    if (!prof.verified) return clear(NextResponse.redirect(new URL("/login?err=google_unverified", req.url)));
    const db = await readDb();
    let user = db.users.find((x) => x.email.toLowerCase() === prof.email);
    if (!user) {
      // New Google user: unusable password hash (password login impossible),
      // free plan + coins, personal MCP key — same as email signup.
      const passHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      const adminMail = (process.env.ADMIN_EMAIL || "admin@local.test").trim().toLowerCase();
      const isAdmin = prof.email === adminMail && !db.users.some((x) => x.role === "admin");
      user = {
        id: uid("u"), email: prof.email, passHash,
        role: isAdmin ? "admin" : "user", plan: isAdmin ? "pro" : "free",
        createdAt: new Date().toISOString(), googleId: prof.sub, provider: "google",
      };
      db.users.push(user);
      db.mcpKeys.push({ userId: user.id, key: newPersonalKey() });
      db.usage.push({ userId: user.id, mcpCalls: 0, githubCalls: 0, balance: 10000, usedTotal: 0 });
      db.events.push({ id: uid("e"), userId: user.id, action: "signup_google", detail: user.email, at: new Date().toISOString() });
    } else {
      // Link Google id on first Google login; never downgrade admin.
      if (!user.googleId) { user.googleId = prof.sub; user.provider = user.provider || "google"; }
      db.events.push({ id: uid("e"), userId: user.id, action: "login_google", detail: user.email, at: new Date().toISOString() });
    }
    db.attempts = db.attempts.filter((a) => a.email !== user!.email);
    await writeDb(db);
    const token = await signJwt({ sub: user.id, email: user.email, role: user.role }, remember ? "30d" : "24h");
    const role = user.role;
    const dest = wantNext !== "/dashboard" ? wantNext : role === "admin" ? "/admin" : "/dashboard";
    const res = clear(NextResponse.redirect(new URL(dest, req.url)));
    res.cookies.set("session", token, { httpOnly: true, path: "/", maxAge: remember ? 30 * 24 * 3600 : 24 * 3600, sameSite: "lax", secure: cookieSecure(req) });
    return res;
  } catch {
    return clear(NextResponse.redirect(new URL("/login?err=google_failed", req.url)));
  }
}
