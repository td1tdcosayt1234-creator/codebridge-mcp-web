"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [me, setMe] = useState<{ role?: string } | null>(null);
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((j) => setMe(j.user || null)).catch(() => setMe(null));
  }, []);
  return (
    <div className="footer">
      <div className="container" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>© {new Date().getFullYear()} CodeBridge • request → cloud build → result</div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/docs">Docs</Link>
          {me && <Link href="/dashboard">Dashboard</Link>}
          {me?.role === "admin" && <Link href="/admin">Admin</Link>}
        </div>
      </div>
    </div>
  );
}
