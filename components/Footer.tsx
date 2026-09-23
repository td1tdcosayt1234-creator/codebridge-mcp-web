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
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link href="/" className="logo" style={{ marginBottom: 10 }}>
              <span className="logo-orb" aria-hidden="true" />Code<span className="grad-anim">Bridge</span>
            </Link>
            <p className="muted small" style={{ margin: "10px 0 0", maxWidth: 260, lineHeight: 1.7 }}>
              Request → cloud build → result. AI compiles + auto-fixes every file type.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <Link href="/game">🎮 Game Studio</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/mcp">Agent connect</Link>
            {me && <Link href="/dashboard">Dashboard</Link>}
            {me?.role === "admin" && <Link href="/admin">Admin</Link>}
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link href="/docs">Docs</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/support">Support</Link>
            <Link href="/about">About</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign up free</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} CodeBridge • request → cloud build → result</div>
          <div><span className="pulse-dot" /> All systems normal</div>
        </div>
      </div>
    </div>
  );
}
