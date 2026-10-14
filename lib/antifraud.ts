import crypto from "crypto";

// ---- Honeypot anti-bot: hidden "website" field must stay empty ----
export function honeypot(body: Record<string, unknown> | null | undefined): boolean {
  if (!body) return false;
  return !!((body as Record<string, unknown>).website || (body as Record<string, unknown>).url);
}

// ---- Headless / script UA block (browser forms only) ----
const BOT_UA = /(headlesschrome|phantomjs|selenium|puppeteer|playwright|cypress|webdriver|curl|wget|python-requests?|python\/|axios|node-fetch|got\/|scrapy|httpclient|okhttp|java\/|libwww|bot|crawler|spider|scraper)/i;
export function isBotUA(ua: string | null | undefined): boolean {
  const s = (ua || "").trim();
  if (!s) return true; // real browsers always send UA; empty = script
  if (s.length < 20) return true; // too short to be a real browser
  return BOT_UA.test(s);
}

// ---- Form timing trap: humans need >minMs from render to submit ----
export function humanTimingOk(ts: unknown, minMs: number): boolean {
  const t = Number(ts);
  if (!Number.isFinite(t) || t <= 0) return true; // fail-open for old cached pages
  const age = Date.now() - t;
  if (age < 0 || age > 3600000) return false; // future clock or stale replay
  return age >= minMs;
}

// ---- Anti-VPN/proxy: dual-provider, fail-open, cached 1h ----
// Provider A: ipapi.co proxy flag. Provider B: ip-api.com proxy flag.
// Block if EITHER says proxy; allow when both reachable and clean, or all fail.
// Datacenter ("hosting") ranges are NOT blocked — mobile data / shared NAT
// users without any VPN were getting false-blocked.
const proxyCache = new Map<string, { v: boolean; at: number }>();
function isPrivateIp(ip: string): boolean {
  return (
    !ip || ip === "local" || ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" ||
    ip.startsWith("10.") || ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || ip.startsWith("100.") || ip === "unknown"
  );
}
async function flagA(ip: string): Promise<boolean | null> {
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch("https://ipapi.co/" + encodeURIComponent(ip) + "/proxy/", { signal: ctl.signal });
    clearTimeout(to);
    if (!r.ok) return null;
    return (await r.text()).trim().toLowerCase() === "true";
  } catch { return null; }
}
async function flagB(ip: string): Promise<boolean | null> {
  // NOTE: ip-api "hosting" (datacenter exit) is DELIBERATELY ignored —
  // mobile carriers / corporate NATs often sit in flagged ranges and real
  // users without any VPN got blocked. Only the explicit proxy flag counts.
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch("http://ip-api.com/json/" + encodeURIComponent(ip) + "?fields=status,proxy", { signal: ctl.signal });
    clearTimeout(to);
    if (!r.ok) return null;
    const j = await r.json().catch(() => null) as { status?: string; proxy?: boolean } | null;
    if (!j || j.status !== "success") return null;
    return !!j.proxy;
  } catch { return null; }
}
// Short TTL on purpose: a transient misflag clears itself in ~20 min,
// and real VPN users flipping it off don't stay punished for an hour.
const VPN_CACHE_MS = 20 * 60 * 1000;
export async function isVpn(ip: string): Promise<boolean> {
  if (isPrivateIp(ip)) return false;
  if (!/^[0-9a-fA-F:.]{7,45}$/.test(ip)) return false; // garbage IP = allow
  const c = proxyCache.get(ip);
  if (c && Date.now() - c.at < VPN_CACHE_MS) return c.v;
  const [a, b] = await Promise.all([flagA(ip), flagB(ip)]);
  if (a === null && b === null) return false; // fail-open: never block on total lookup failure
  const v = a === true || b === true;
  // Cache clean verdicts longer, blocks shorter (re-check sooner).
  proxyCache.set(ip, { v, at: Date.now() - (v ? VPN_CACHE_MS / 2 : 0) });
  return v;
}

export function newNonce(prefix: string): string {
  return prefix + "_" + crypto.randomBytes(16).toString("hex");
}
