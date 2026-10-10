"use client";
import { useState } from "react";

// Shared email-OTP step (elsemail 6-digit code, 5 min valid).
// Props: email (locked), remember flag, onDone(role).
export default function VerifyEmail({ email, remember, onDone }: { email: string; remember: boolean; onDone: (role: string) => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState("");
  const [shake, setShake] = useState(0);
  const [cool, setCool] = useState(0);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, remember }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error || "Verification failed");
        setShake((s) => s + 1);
        return;
      }
      onDone(j.role || "user");
    } catch {
      setErr("Server unreachable — try again.");
      setShake((s) => s + 1);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (cool > 0 || busy) return;
    setErr("");
    setResent("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setErr(j.error || "Could not resend");
      else {
        setResent("New code sent — use the LATEST mail only (old codes stop working).");
        setCool(60);
        const t = setInterval(() => setCool((v) => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; }), 1000);
      }
    } catch {
      setErr("Server unreachable — try again.");
    }
  }

  return (
    <div key={shake} className={err ? " shake" : ""}>
      <p className="muted small" style={{ marginTop: 0 }}>
        We sent a <b>6-digit code</b> to <b>{email}</b> (valid 5 min). Enter it to activate your account + 10,000 coins.
      </p>
      <form onSubmit={verify}>
        <label>Verification code</label>
        <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" inputMode="numeric" placeholder="123456" maxLength={6} />
        {err && (
          <p className="small" style={{ marginTop: 12 }}>
            <span className="badge bad">{err}</span>
          </p>
        )}
        {resent && <p className="small" style={{ marginTop: 12 }}><span className="badge ok">{resent}</span></p>}
        <div style={{ marginTop: 20 }}>
          <button className="btn btn-lg shine" style={{ width: "100%" }} type="submit" disabled={busy || code.length !== 6}>
            {busy ? "Verifying…" : "Verify & activate"}
          </button>
        </div>
      </form>
      <p className="muted small" style={{ margin: "14px 0 0", textAlign: "center" }}>
        No mail? Check spam, then{" "}
        <button type="button" className="pw-toggle" style={{ position: "static", transform: "none" }} onClick={resend} disabled={cool > 0}>
          {cool > 0 ? `Resend code (${cool}s)` : "Resend code"}
        </button>
      </p>
    </div>
  );
}
