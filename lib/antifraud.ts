// ---- ALL BLOCKERS DISABLED by owner (2026-10-16): every check below is a
// pass-through. Exports kept so call sites compile unchanged. ----
import crypto from "crypto";

// ---- Honeypot anti-bot: DISABLED (always passes) ----
export function honeypot(body: Record<string, unknown> | null | undefined): boolean {
  void body;
  return false;
}

// ---- Headless / script UA block: DISABLED (always passes) ----
const BOT_UA = /(headlesschrome|phantomjs|selenium|puppeteer|playwright|cypress|webdriver|curl|wget|python-requests?|python\/|axios|node-fetch|got\/|scrapy|httpclient|okhttp|java\/|libwww|bot|crawler|spider|scraper)/i;
export function isBotUA(ua: string | null | undefined): boolean {
  void ua; void BOT_UA;
  return false;
}

// ---- Form timing trap: DISABLED (always passes) ----
export function humanTimingOk(ts: unknown, minMs: number): boolean {
  void ts; void minMs;
  return true;
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
// Owner / office allowlist: comma-separated IPs that skip the VPN check.
// Needed because RDP / office / datacenter egress IPs are flagged
// "proxy" by IP-intel providers even with no VPN in use.
function allowlisted(ip: string): boolean {
  const raw = (process.env.VPN_ALLOWLIST || "").split(",").map((s) => s.trim()).filter(Boolean);
  return !!ip && raw.includes(ip);
}
export async function isVpn(ip: string): Promise<boolean> {
  void ip;
  return false; // DISABLED by owner — all networks allowed.
}

export function newNonce(prefix: string): string {
  return prefix + "_" + crypto.randomBytes(16).toString("hex");
}
