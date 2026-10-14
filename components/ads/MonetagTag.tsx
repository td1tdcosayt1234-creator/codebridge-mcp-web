"use client";
import { useEffect } from "react";

// Monetag Multitag — client-side (site already verified in dashboard).
// WHERE IT LOADS:
//   + public host (roun.sryze.cc) EXCEPT auth pages
//   + dash host ONLY on the coin-earn page (/earn)
// NEVER on: /signup, /login (OnClick popunder would hijack form taps),
// dashboard/admin/api (tool UI stays clean).
const TAG_SRC = "https://quge5.com/88/tag.min.js";
const TAG_ZONE = "293462";
// Standalone Vignette (extra zone from dashboard).
const VIG_SRC = "https://n6wxm.com/vignette.min.js";
const VIG_ZONE = "11997991";
const VIG_ZONE_2 = "12029788"; // Industrious tag (Vignette Banner, video/interstitial)
// Standalone OnClick popunder (high CPM) + In-Page Push banner.
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

export default function MonetagTag() {
  useEffect(() => {
    try {
      const h = window.location.hostname.toLowerCase();
      const p = window.location.pathname.toLowerCase();
      if (isAuthPath(p)) return;
      const isPublic = PUBLIC_HOSTS.includes(h);
      // /dashboard/earn is served on the dash host as clean URL /earn
      const isEarn = h === DASH_HOST && (p === "/earn" || p.startsWith("/earn/"));
      if (!isPublic && !isEarn) return;
      if (!document.querySelector('script[data-monetag="multitag"]')) {
        const s = document.createElement("script");
        s.src = TAG_SRC;
        s.async = true;
        s.setAttribute("data-zone", TAG_ZONE);
        s.setAttribute("data-cfasync", "false");
        s.setAttribute("data-monetag", "multitag");
        document.head.appendChild(s);
      }
      if (!document.querySelector('script[data-monetag="vignette"]')) {
        // Verbatim mirror of the dashboard snippet: append to body (else
        // documentElement), dataset.zone set before src loads.
        const v = document.createElement("script");
        v.setAttribute("data-zone", VIG_ZONE);
        v.setAttribute("data-cfasync", "false");
        v.setAttribute("data-monetag", "vignette");
        v.async = true;
        ([document.documentElement, document.body].filter(Boolean).pop() || document.head).appendChild(v);
        v.src = VIG_SRC;
      }
      if (!document.querySelector('script[data-monetag="vignette2"]')) {
        const v2 = document.createElement("script");
        v2.setAttribute("data-zone", VIG_ZONE_2);
        v2.setAttribute("data-cfasync", "false");
        v2.setAttribute("data-monetag", "vignette2");
        v2.async = true;
        ([document.documentElement, document.body].filter(Boolean).pop() || document.head).appendChild(v2);
        v2.src = VIG_SRC;
      }
      if (!document.querySelector('script[data-monetag="onclick"]')) {
        const o = document.createElement("script");
        o.setAttribute("data-zone", ONCLICK_ZONE);
        o.setAttribute("data-cfasync", "false");
        o.setAttribute("data-monetag", "onclick");
        o.async = true;
        ([document.documentElement, document.body].filter(Boolean).pop() || document.head).appendChild(o);
        o.src = ONCLICK_SRC;
      }
      if (!document.querySelector('script[data-monetag="inpage"]')) {
        const n = document.createElement("script");
        n.setAttribute("data-zone", INPAGE_ZONE);
        n.setAttribute("data-cfasync", "false");
        n.setAttribute("data-monetag", "inpage");
        n.async = true;
        ([document.documentElement, document.body].filter(Boolean).pop() || document.head).appendChild(n);
        n.src = INPAGE_SRC;
      }
    } catch {
      // ads must never break the app
    }
  }, []);
  return null;
}
