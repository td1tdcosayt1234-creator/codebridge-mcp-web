import crypto from "crypto";

// ---- Rate limiting (in-memory, per key) ----
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  // Bound memory: occasionally drop expired buckets.
  if (buckets.size > 5000) {
    buckets.forEach((b, k) => { if (now > b.reset) buckets.delete(k); });
  }
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= max) return { ok: false, retryAfterSec: Math.ceil((b.reset - now) / 1000) };
  b.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  // Cloudflare Tunnel sets CF-Connecting-IP to the real client IP and
  // overwrites any spoofed value, so prefer it (works without TRUST_PROXY).
  const cf = (req.headers.get("cf-connecting-ip") || "").trim().slice(0, 64);
  if (cf) return cf;
  // Only trust proxy headers when explicitly enabled behind a real reverse
  // proxy that strips client-supplied values. Otherwise the header is
  // client-controlled and would allow IP spoofing past rate limits.
  if (process.env.TRUST_PROXY === "true") {
    const f = req.headers.get("x-forwarded-for") || "";
    if (f) return f.split(",")[0].trim().slice(0, 64);
  }
  return "local";
}

// ---- Tier-1 edge shield: violation score + ESCALATING suspends ----
// Repeated hostile signals (bad tokens, bad signatures, CSRF fails, auth
// fails, bot traps, bypass attempts) from one IP accumulate.
// 20 points in 10 min -> suspend. Each suspend climbs the ladder:
// 10 min -> 30 min -> 1 hour -> 12 hours -> 3 weeks. Legit typos never reach it.
const viol = new Map<string, { score: number; first: number; bannedUntil: number; offenses: number }>();
const BAN_SCORE = 20;
const BAN_WINDOW_MS = 10 * 60 * 1000;
const BAN_TIERS_MIN = [10, 30, 60, 12 * 60, 21 * 24 * 60];
export function banTierMin(offenses: number): number {
  return BAN_TIERS_MIN[Math.min(Math.max(0, offenses), BAN_TIERS_MIN.length - 1)];
}
export function banOffenses(ip: string): number {
  return viol.get(ip)?.offenses || 0;
}
export function isBanned(ip: string): boolean {
  if (!ip || ip === "local") return false;
  const v = viol.get(ip);
  if (!v) return false;
  const now = Date.now();
  if (v.bannedUntil > now) return true;
  if (now - v.first > BAN_WINDOW_MS) viol.delete(ip);
  return false;
}
export function banRemainingSec(ip: string): number {
  const v = viol.get(ip);
  if (!v) return 0;
  return Math.max(0, Math.ceil((v.bannedUntil - Date.now()) / 1000));
}
export function recordViolation(ip: string, weight = 1): void {
  if (!ip || ip === "local") return;
  const now = Date.now();
  if (viol.size > 5000) {
    viol.forEach((v, k) => {
      if (v.bannedUntil < now && now - v.first > BAN_WINDOW_MS) viol.delete(k);
    });
  }
  const v = viol.get(ip) || { score: 0, first: now, bannedUntil: 0, offenses: 0 };
  if (now - v.first > BAN_WINDOW_MS) {
    v.score = 0;
    v.first = now;
    v.bannedUntil = 0;
  }
  v.score += weight;
  // Fresh suspend only when not already serving one — each new suspend climbs
  // the ladder (10m, 30m, 1h, 12h, 3 weeks) and bumps the offense counter.
  if (v.score >= BAN_SCORE && v.bannedUntil <= now) {
    v.bannedUntil = now + banTierMin(v.offenses) * 60 * 1000;
    v.offenses += 1;
  }
  viol.set(ip, v);
}
function banTimeLeft(ip: string): string {
  const s = banRemainingSec(ip);
  if (s <= 0) return "a while";
  if (s < 3600) return Math.ceil(s / 60) + " min";
  if (s < 86400) return Math.floor(s / 3600) + "h " + Math.ceil((s % 3600) / 60) + "m";
  return Math.floor(s / 86400) + " days";
}
export function banResponse(ip = ""): Response {
  const n = ip ? banOffenses(ip) : 0;
  const msg = n > 1
    ? `Suspended for repeated abuse (offense ${n}). Try again in ${banTimeLeft(ip)}.`
    : "Blocked for abuse. Try again later.";
  return Response.json({ error: msg }, { status: 403 });
}

// ---- Timing-safe string compare (tokens/secrets) ----
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a || "").digest();
  const hb = crypto.createHash("sha256").update(b || "").digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ---- CSRF: state-changing browser requests must come from our own origin.
// API clients (MCP, runner, curl with a bearer token) send no Origin and are
// allowed via their Authorization header. A bare no-Origin request carrying
// only cookies (classic CSRF shape) is rejected.
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  const claimed = origin || referer;
  if (!claimed) return false;
  try {
    const o = new URL(claimed);
    // x-forwarded-host is client-controlled — trust it only behind a
    // sanitising reverse proxy, same rule as clientIp().
    const host = (
      (process.env.TRUST_PROXY === "true" && req.headers.get("x-forwarded-host")) ||
      req.headers.get("host") ||
      ""
    )
      .split(":")[0]
      .toLowerCase();
    return o.hostname.toLowerCase() === host;
  } catch {
    return false;
  }
}

export function hasBearer(req: Request): boolean {
  const h = req.headers.get("authorization") || "";
  return h.toLowerCase().startsWith("bearer ") && h.slice(7).trim().length > 0;
}

export function csrfCheck(req: Request): boolean {
  return hasBearer(req) || sameOrigin(req);
}

export function csrfBlock(): Response {
  return Response.json({ error: "Cross-site request rejected." }, { status: 403 });
}

// ---- Password policy ----
export function passwordError(pw: string): string | null {
  if (!pw || pw.length < 12) return "Password must be at least 12 characters.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must include letters and numbers.";
  return null;
}

// ---- Input caps ----
export function clampText(s: unknown, max: number): string {
  return String(s || "").slice(0, max);
}

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

// Secure cookies only when actually served over HTTPS (proxy header or localhost dev).
function isLocalHost(host: string): boolean {
  const h = (host || "").split(":")[0].trim().toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}
function isPrivateHost(host: string): boolean {
  const h = (host || "").split(":")[0].trim();
  if (isLocalHost(h)) return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h) || /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./.test(h)) return true;
  const m172 = h.match(/^172\.(\d+)\./);
  if (m172) { const n = Number(m172[1]); if (n >= 16 && n <= 31) return true; }
  if (h.startsWith("[")) return true; // IPv6 literals (link-local/tailnet)
  return false;
}
export function cookieSecure(req: Request): boolean {
  // Trust the proto header only behind a sanitising reverse proxy —
  // otherwise any same-origin page could flip the Secure flag.
  const proto = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim().toLowerCase();
  if (proto === "https" && process.env.TRUST_PROXY === "true") return true;
  if (proto === "http") return false;
  // Without a trusted proxy we cannot prove TLS: set Secure only for public
  // hosts in production (plain-HTTP tailnet/LAN stays working), never locally.
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  if (isLocalHost(host) || isPrivateHost(host)) return false;
  return isProd();
}

// The site is split across subdomains (roun.sryze.cc public, dash./admin, api./MCP),
// so the session cookie must be shared by the whole parent domain. Browsers
// reject Domain= for localhost/LAN, so dev keeps host-only cookies.
export function cookieDomain(req: Request): string | undefined {
  const h = ((req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(",")[0].trim().toLowerCase().split(":")[0]);
  if (h === "roun.sryze.cc" || h.endsWith(".roun.sryze.cc") || h === "www.roun.sryze.cc") {
    return ".roun.sryze.cc";
  }
  return undefined;
}
