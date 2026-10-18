"use client";
import { useEffect } from "react";

// Monetag — client-side (site already verified in dashboard).
// Loadout (banner + popup exactly once each — no Multitag wrapper stacking):
//   + Vignette fullscreen native banner: Immortal tag (11997991) — also
//     server-rendered in <head> (layout.tsx) so the installer bot sees it
//   + OnClick Popunder popup: Pretty tag (12029909)
//   + In-Page Push banner: Magnificent tag (12029910)
// WHERE IT LOADS:
//   + public host (roun.sryze.cc) EXCEPT auth pages
//   + dash host ONLY on the coin-earn page (/earn)
// NEVER on: /signup, /login (OnClick popunder would hijack form taps),
// dashboard/admin/api (tool UI stays clean).
const VIG_SRC = "https://n6wxm.com/vignette.min.js";
const VIG_ZONE = "11997991";
const ONCLICK_SRC = "https://al5sm.com/tag.min.js";
const ONCLICK_ZONE = "12029909";
const INPAGE_SRC = "https://nap5k.com/tag.min.js";
const INPAGE_ZONE = "12029910";
const PUBLIC_HOSTS = ["roun.sryze.cc", "www.roun.sryze.cc"];
const DASH_HOST = "dash.roun.sryze.cc";
const AUTH_PATHS = ["/signup", "/login"];

function isAuthPath(p: string): boolean {
  return AUTH_PATHS.some((a) => p === a || p.startsWith(a + "/"));
}

function addTag(key: string, src: string, zone: string, toHead: boolean) {
  if (document.querySelector(`script[data-monetag="${key}"]`)) return;
  // layout.tsx may already inject the primary vignette in <head> (no
  // data-monetag attr) so Monetag's installer bot sees it in HTML —
  // same zone = same tag, never load it twice (wasted bytes on slow nets).
  if (document.querySelector(`script[data-zone="${zone}"]`)) return;
  const s = document.createElement("script");
  s.setAttribute("data-zone", zone);
  s.setAttribute("data-cfasync", "false");
  s.setAttribute("data-monetag", key);
  s.async = true;
  // Network-level block (script never loads) = real adblock signal for useAdblock.
  s.onerror = () => { try { (window as unknown as { __mtBlocked?: boolean }).__mtBlocked = true; } catch { /* ignore */ } };
  if (toHead) document.head.appendChild(s);
  else ([document.documentElement, document.body].filter(Boolean).pop() || document.head).appendChild(s);
  s.src = src;
}

export default function MonetagTag() {
  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    try {
      const h = window.location.hostname.toLowerCase();
      const p = window.location.pathname.toLowerCase();
      if (isAuthPath(p)) return;
      const isPublic = PUBLIC_HOSTS.includes(h);
      // /dashboard/earn is served on the dash host as clean URL /earn
      const isEarn = h === DASH_HOST && (p === "/earn" || p.startsWith("/earn/"));
      if (!isPublic && !isEarn) return;
      // Deferred + staggered: ad scripts must never fight first paint.
      // Primary vignette is already in <head> (layout.tsx, same zone is
      // deduped by addTag); remaining tags 1.2s apart so low-end phones stay smooth.
      const run = () => {
        addTag("vignette", VIG_SRC, VIG_ZONE, false);
        timers.push(setTimeout(() => addTag("onclick", ONCLICK_SRC, ONCLICK_ZONE, false), 2400));
        timers.push(setTimeout(() => addTag("inpage", INPAGE_SRC, INPAGE_ZONE, false), 4800));
      };
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
      if (typeof ric === "function") ric(run, { timeout: 4000 });
      else timers.push(setTimeout(run, 2500));
    } catch {
      // ads must never break the app
    }
    return () => { timers.forEach(clearTimeout); };
  }, []);
  return null;
}
