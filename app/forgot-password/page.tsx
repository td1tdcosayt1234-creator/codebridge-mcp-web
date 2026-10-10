"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always the same message — never reveal whether the address exists.
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap fade-up">
      <div className="card auth-card">
        <div className="kicker">
          <span className="pulse-dot" />
          Recovery
        </div>
        <h1>
          Forgot <span className="grad-anim">password?</span>
        </h1>
        {done ? (
          <div>
            <p><span className="badge ok">If the address exists, a reset link is on its way (1h, one-time).</span></p>
            <p className="muted small">Check inbox/spam, then open the link to set a new password.</p>
            <p className="muted small" style={{ marginTop: 14, textAlign: "center" }}>
              <Link href="/login" style={{ color: "var(--mint-2)" }}>Back to login</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={go}>
            <p className="muted small" style={{ marginTop: 0 }}>Enter your account email — we send a one-time reset link.</p>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" type="email" placeholder="you@example.com" />
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-lg shine" style={{ width: "100%" }} type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </div>
            <p className="muted small" style={{ margin: "18px 0 0", textAlign: "center" }}>
              <Link href="/login" style={{ color: "var(--mint-2)" }}>Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
