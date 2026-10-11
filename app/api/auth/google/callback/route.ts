import { NextResponse } from "next/server";
import { googleConfigured, googleRedirectUri, googleExchangeCode, googleFetchProfile, safeNext } from "@/lib/google";
import { readDb, writeDb, uid } from "@/lib/db";
import { signJwt } from "@/lib/auth";
import { rateLimit, clientIp, cookieSecure, cookieDomain } from "@/lib/security";
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
    const dom = cookieDomain(req);
    const sec = cookieSecure(req);
    r.cookies.set("g_state", "", { httpOnly: true, path: "/", domain: dom, maxAge: 0, sameSite: "lax", secure: sec });
    r.cookies.set("g_next", "", { httpOnly: true, path: "/", domain: dom, maxAge: 0, sameSite: "lax", secure: sec });
    r.cookies.set("g_rem", "", { httpOnly: true, path: "/", domain: dom, maxAge: 0, sameSite: "lax", secure: sec });
    return r;
  };
  if (!code || !state || !wantState || state !== wantState) {
    return clear(NextResponse.redirect(new URL("/login?err=google_state", req.url)));
  }
  let stage = "exchange";
  try {
    const redirectUri = googleRedirectUri(req);
    const { accessToken } = await googleExchangeCode(code, redirectUri);
    stage = "profile";
    const prof = await googleFetchProfile(accessToken);
    stage = "db";
    if (!prof.verified) return clear(NextResponse.redirect(new URL("/login?err=google_unverified", req.url)));
    const db = await readDb();
    let user = db.users.find((x) => x.email.toLowerCase() === prof.email);
    let isNew = false;
    if (!user) {
      isNew = true;
      // New Google user: unusable password hash (password login impossible),
      // free plan + coins, personal MCP key — same as email signup.
      const passHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
      const adminMail = (process.env.ADMIN_EMAIL || "admin@local.test").trim().toLowerCase();
      const isAdmin = prof.email === adminMail && !db.users.some((x) => x.role === "admin");
      const nameParts = String(prof.name || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
      user = {
        id: uid("u"), email: prof.email, passHash,
        role: isAdmin ? "admin" : "user", plan: isAdmin ? "pro" : "free",
        createdAt: new Date().toISOString(), emailVerified: true, googleId: prof.sub, provider: "google",
        firstName: (nameParts[0] || "").slice(0, 60) || undefined,
        lastName: nameParts.slice(1).join(" ").slice(0, 60) || undefined,
      };
      db.users.push(user);
      db.mcpKeys.push({ userId: user.id, key: newPersonalKey() });
      db.usage.push({ userId: user.id, mcpCalls: 0, githubCalls: 0, balance: 10000, usedTotal: 0 });
      db.events.push({ id: uid("e"), userId: user.id, action: "signup_google", detail: user.email, at: new Date().toISOString() });
    } else {
      // Link Google id on first Google login; never downgrade admin.
      // Google already proved the mailbox — mark verified on link too.
      if (!user.googleId) { user.googleId = prof.sub; user.provider = user.provider || "google"; }
      if (user.emailVerified === false) user.emailVerified = true;
      db.events.push({ id: uid("e"), userId: user.id, action: "login_google", detail: user.email, at: new Date().toISOString() });
    }
    db.attempts = db.attempts.filter((a) => a.email !== user!.email);
    // Tier-2: 2FA enrolled -> tmp cookie, code verified on /login?need2fa=1.
    const { decToken } = await import("@/lib/crypto");
    if (user!.twoFaEnc && decToken(user!.twoFaEnc)) {
      db.events.push({ id: uid("e"), userId: user!.id, action: "login_step1", detail: user!.email + " (google)", at: new Date().toISOString() });
      await writeDb(db);
      const tmp = await signJwt({ sub: user!.id, purpose: "2fa", remember }, "5m");
      const res = clear(NextResponse.redirect(new URL("/login?need2fa=1", req.url)));
      res.cookies.set("g2fa", tmp, { httpOnly: true, path: "/", domain: cookieDomain(req), maxAge: 5 * 60, sameSite: "lax", secure: cookieSecure(req) });
      return res;
    }
    await writeDb(db);
    const token = await signJwt({ sub: user.id, email: user.email, role: user.role }, remember ? "30d" : "24h");
    const role = user.role;
    // First-time Google users go through the onboarding survey; the
    // MCP-only api host can't render /dashboard or /welcome (404 there).
    const cbHost = new URL(req.url).hostname.toLowerCase();
    const origin = cbHost === "api.roun.sryze.cc" ? "https://roun.sryze.cc" : new URL(req.url).origin;
    const dest = wantNext !== "/dashboard" ? wantNext : isNew ? "/welcome" : role === "admin" ? "/admin" : "/dashboard";
    const res = clear(NextResponse.redirect(origin + dest));
    res.cookies.set("session", token, { httpOnly: true, path: "/", domain: cookieDomain(req), maxAge: remember ? 30 * 24 * 3600 : 24 * 3600, sameSite: "lax", secure: cookieSecure(req) });
    return res;
  } catch (e) {
    console.error("[google-cb] stage=" + stage + " err=" + ((e as Error)?.message || e));
    return clear(NextResponse.redirect(new URL("/login?err=google_failed", req.url)));
  }
}
