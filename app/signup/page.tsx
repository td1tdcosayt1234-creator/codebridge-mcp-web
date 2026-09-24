"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [hp, setHp] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const r = useRouter();

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, website: hp }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || "Signup failed");
        setShake((s) => s + 1);
        return;
      }
      r.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap fade-up">
      <div key={shake} className={"card auth-card" + (err ? " shake" : "")}>
        <div className="kicker">
          <span className="pulse-dot" />
          Join free
        </div>
        <h1>
          Sign up — <span className="grad-anim">free</span>
        </h1>
        <p className="muted small" style={{ marginTop: 0 }}>
          <strong className="grad-anim">10,000 coins</strong> included. Password: min 8 characters, letters + numbers.
        </p>
        <form onSubmit={go}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" type="email" placeholder="you@example.com" />
          <label>Password</label>
          <div className="pw-wrap">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
            />
            <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <input
            name="website"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
          />
          <label style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me — 30 days, all tabs
          </label>
          {err && (
            <p className="small" style={{ marginTop: 12 }}>
              <span className="badge bad">{err}</span>
            </p>
          )}
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-lg shine" style={{ width: "100%" }} type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
        <p className="muted small" style={{ margin: "18px 0 0", textAlign: "center" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--mint-2)" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
