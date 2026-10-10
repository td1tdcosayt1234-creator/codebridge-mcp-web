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
    } catch {
      // ads must never break the app
    }
  }, []);
  return null;
}
