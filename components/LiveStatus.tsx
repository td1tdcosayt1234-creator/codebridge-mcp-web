"use client";
import { useEffect, useState } from "react";

type State = "checking" | "live" | "down";

/** Live runner status pill for the hero: green when /api/health answers. */
export default function LiveStatus() {
  const [st, setSt] = useState<State>("checking");

  useEffect(() => {
    let stop = false;
    const ping = async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const r = await fetch("/api/health", { cache: "no-store", signal: ctrl.signal });
        clearTimeout(t);
        if (!stop) setSt(r.ok ? "live" : "down");
      } catch {
        if (!stop) setSt("down");
      }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  if (st === "live")
    return (
      <span className="chip">
        <span className="pulse-dot" /> runners online
      </span>
    );
  if (st === "down")
    return (
      <span className="chip">
        <b style={{ color: "#f87171" }}>●</b> reconnecting…
      </span>
    );
  return (
    <span className="chip">
      <b>○</b> checking status…
    </span>
  );
}
