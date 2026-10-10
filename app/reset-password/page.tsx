"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const q = useSearchParams();
  const token = q.get("token") || "";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [done, setDone] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw !== pw2) {
      setErr("Passwords do not match.");
      setShake((s) => s + 1);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error || "Reset failed");
        setShake((s) => s + 1);
        return;
      }
      setDone(true);
    } catch {
      setErr("Server unreachable — try again.");
      setShake((s) => s + 1);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="card auth-card">
        <p><span className="badge bad">No reset token — open the link from your mail.</span></p>
        <p className="muted small" style={{ textAlign: "center" }}>
          <Link href="/forgot-password" style={{ color: "var(--mint-2)" }}>Request a new link</Link>
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card auth-card">
        <p><span className="badge ok">Password set — log in with the new one.</span></p>
        <div style={{ marginTop: 16 }}>
          <Link className="btn btn-lg shine" style={{ width: "100%" }} href="/login">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div key={shake} className={"card auth-card" + (err ? " shake" : "")}>
      <div className="kicker">
        <span className="pulse-dot" />
        Recovery
      </div>
      <h1>
        New <span className="grad-anim">password</span>
      </h1>
      <p className="muted small" style={{ marginTop: 0 }}>Min 12 characters, letters + numbers.</p>
      <form onSubmit={go}>
        <label>New password</label>
        <div className="pw-wrap">
          <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" placeholder="••••••••" />
          <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"}</button>
        </div>
        <label>Repeat password</label>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" placeholder="••••••••" />
        {err && (
          <p className="small" style={{ marginTop: 12 }}>
            <span className="badge bad">{err}</span>
          </p>
        )}
        <div style={{ marginTop: 20 }}>
          <button className="btn btn-lg shine" style={{ width: "100%" }} type="submit" disabled={busy}>
            {busy ? "Saving…" : "Set password"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="auth-wrap fade-up">
      <Suspense fallback={<div className="card auth-card"><p className="muted small">Loading…</p></div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
