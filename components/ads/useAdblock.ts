"use client";
import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    __mtBlocked?: boolean;
  }
}

// Shared adblock detector: bait-element probe + real ad-script failure signal.
// MonetagTag sets window.__mtBlocked when any ad tag fails to load (blocked
// at network level). Bait catches cosmetic/element-hiding blockers.
export function probeAdblock(): boolean {
  try {
    if (typeof window !== "undefined" && window.__mtBlocked) return true;
    const d = document.createElement("div");
    d.className = "adsbox ad-banner sponsored";
    d.style.cssText = "height:1px;width:1px;position:absolute;left:-9999px;";
    document.body.appendChild(d);
    const blocked = d.offsetHeight === 0;
    d.remove();
    return blocked;
  } catch {
    return false;
  }
}

export function useAdblock(): { adblock: boolean; recheck: () => boolean } {
  // DISABLED by owner — always reports no adblock so no UI gate triggers.
  const recheck = useCallback(() => false, []);
  return { adblock: false, recheck };
}
