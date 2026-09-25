"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [me, setMe] = useState<{ role?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setMe(j.user || null))
      .catch(() => setMe(null));
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link href="/" className="logo" style={{ marginBottom: 14 }}>
              <span className="logo-mark" aria-hidden="true" />
              <span className="logo-word">
                Code<em>Bridge</em>
              </span>
            </Link>
            <p className="muted small" style={{ margin: 0, maxWidth: 310, lineHeight: 1.75 }}>
              Request → cloud build → result. AI compiles and auto-fixes every project type, then hands the
              artifact back to you or your agent.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              <span className="chip">
                <b>10k</b> free coins
              </span>
              <span className="chip">no card</span>
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <Link href="/game">Game Studio</Link>
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
            {me ? (
              <Link href={me.role === "admin" ? "/admin" : "/dashboard"}>
                {me.role === "admin" ? "Admin" : "Dashboard"}
              </Link>
            ) : (
              <>
                <Link href="/login">Login</Link>
                <Link href="/signup">Sign up free</Link>
              </>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} CodeBridge — request → cloud build → result</span>
          <span className="status">
            <i />
            All systems normal
          </span>
        </div>
      </div>
    </footer>
  );
}
