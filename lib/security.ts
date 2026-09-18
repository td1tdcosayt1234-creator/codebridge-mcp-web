import crypto from "crypto";

// ---- Rate limiting (in-memory, per key) ----
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
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
  const f = req.headers.get("x-forwarded-for") || "";
  if (f) return f.split(",")[0].trim().slice(0, 64);
  return "local";
}

// ---- Timing-safe string compare (tokens/secrets) ----
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a || "").digest();
  const hb = crypto.createHash("sha256").update(b || "").digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ---- Password policy ----
export function passwordError(pw: string): string | null {
  if (!pw || pw.length < 8) return "Password must be at least 8 characters.";
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
export function cookieSecure(req: Request): boolean {
  const proto = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  if (proto) return proto === "https";
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(":")[0];
  if (host === "localhost" || host === "127.0.0.1") return false;
  return isProd();
}
