import crypto from "crypto";
import { clientIp } from "./security";

// Spam tracker fingerprint: sha256(ip + ua), truncated. No raw IP/UA is
// ever stored — just enough to link sockpuppets sharing a device/network.
export function fpOf(req: Request): string {
  try {
    const ip = clientIp(req);
    const ua = (req.headers.get("user-agent") || "").slice(0, 200);
    return crypto.createHash("sha256").update(ip + "|" + ua).digest("hex").slice(0, 16);
  } catch {
    return "";
  }
}

export type SpamRow = {
  userId: string;
  email: string;
  plan: string;
  createdAt: string;
  score: number;
  signals: string[];
  fps: string[];
  earnsToday: number;
  fails24h: number;
  vpn24h: number;
};

// Pure computation over the DB — shared by the API route (and tests).
export function spamReport(db: {
  users: { id: string; email: string; role: string; plan: string; createdAt: string }[];
  events: { userId: string; action: string; at: string; fp?: string }[];
}): { rows: SpamRow[]; clusters: { fp: string; userIds: string[] }[] } {
  const now = Date.now();
  const day = new Date().toISOString().slice(0, 10);
  const in24h = (at: string) => now - new Date(at).getTime() < 24 * 3600 * 1000;

  // fp -> signup userIds (multi-account signal).
  const fpUsers = new Map<string, Set<string>>();
  for (const e of db.events) {
    if (e.action !== "signup" || !e.fp) continue;
    if (!fpUsers.has(e.fp)) fpUsers.set(e.fp, new Set());
    fpUsers.get(e.fp)!.add(e.userId);
  }
  const clusters = [...fpUsers.entries()]
    .filter(([, s]) => s.size > 1)
    .map(([fp, s]) => ({ fp, userIds: [...s] }));

  const rows: SpamRow[] = db.users
    .filter((u) => u.role !== "admin")
    .map((u) => {
      const evs = db.events.filter((e) => e.userId === u.id);
      const signals: string[] = [];
      let score = 0;
      const fps = [...new Set(evs.map((e) => e.fp || "").filter(Boolean))];
      // Multi-account: this user's fps also used by other signups.
      let extra = 0;
      for (const fp of fps) extra += Math.max(0, (fpUsers.get(fp)?.size || 1) - 1);
      if (extra > 0) { score += 3 * extra; signals.push(`${extra} extra account(s) same device/net`); }
      const earnsToday = evs.filter((e) => e.action === "ad_earn" && e.at.slice(0, 10) === day).length;
      if (earnsToday >= 5) {
        const ts = evs.filter((e) => e.action === "ad_earn" && e.at.slice(0, 10) === day).map((e) => new Date(e.at).getTime());
        const spanMin = (Math.max(...ts) - Math.min(...ts)) / 60000;
        if (spanMin < 60) { score += 4; signals.push(`farmed ${earnsToday} ads in ${Math.round(spanMin)}m`); }
      }
      const fails24h = evs.filter((e) => (e.action === "login_fail" || e.action === "lockout") && in24h(e.at)).length;
      if (fails24h >= 5) { score += 3; signals.push(`${fails24h} failed logins/24h`); }
      else if (fails24h >= 2) { score += 1; signals.push(`${fails24h} failed logins/24h`); }
      const vpn24h = evs.filter((e) => e.action === "vpn_block" && in24h(e.at)).length;
      if (vpn24h > 0) { score += 2 * vpn24h; signals.push(`${vpn24h} VPN block(s)/24h`); }
      const ageH = (now - new Date(u.createdAt).getTime()) / 3600000;
      if (ageH < 24 && earnsToday > 0) { score += 2; signals.push("new account earning already"); }
      return { userId: u.id, email: u.email, plan: u.plan, createdAt: u.createdAt, score, signals, fps, earnsToday, fails24h, vpn24h };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);
  return { rows, clusters: clusters.slice(0, 50) };
}
