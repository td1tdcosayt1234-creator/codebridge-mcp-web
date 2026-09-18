import crypto from "crypto";

// ---- Honeypot anti-bot: hidden "website" field must stay empty ----
export function honeypot(body: Record<string, unknown> | null | undefined): boolean {
  if (!body) return false;
  return !!((body as Record<string, unknown>).website || (body as Record<string, unknown>).url);
}

// ---- Anti-VPN/proxy: best-effort check, fail-open, cached 1h ----
const proxyCache = new Map<string, { v: boolean; at: number }>();
function isPrivateIp(ip: string): boolean {
  return (
    !ip || ip === "local" || ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" ||
    ip.startsWith("10.") || ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || ip.startsWith("100.") || ip === "unknown"
  );
}
export async function isVpn(ip: string): Promise<boolean> {
  if (isPrivateIp(ip)) return false;
  const c = proxyCache.get(ip);
  if (c && Date.now() - c.at < 3600000) return c.v;
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch("https://ipapi.co/" + encodeURIComponent(ip) + "/proxy/", { signal: ctl.signal });
    clearTimeout(to);
    const t = (await r.text()).trim().toLowerCase();
    const v = t === "true";
    proxyCache.set(ip, { v, at: Date.now() });
    return v;
  } catch {
    return false; // fail-open: never block on lookup failure
  }
}

export function newNonce(prefix: string): string {
  return prefix + "_" + crypto.randomBytes(16).toString("hex");
}
