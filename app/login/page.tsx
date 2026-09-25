"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Single-login: already-logged-in user never sees the form again,
// and post-login uses a full reload so server gates read the fresh cookie.
function dest(fallbackRole: string): string {
  if (typeof window === "undefined") return "/";
  const nx = new URLSearchParams(window.location.search).get("next") || "";
  if (nx.startsWith("/") && !nx.startsWith("//")) return nx;
  return fallbackRole === "admin" ? "/admin" : "/dashboard";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hp, setHp] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((x) => x.json())
      .then((j) => {
        if (j?.user) window.location.href = dest(j.user.role);
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, website: hp }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error || "Login failed");
        setShake((s) => s + 1);
        return;
      }
      // Full reload (not router.push): server layouts/middleware must
      // re-read the freshly-set session cookie, otherwise they bounce
      // straight back to /login with a stale cached payload.
      window.location.href = dest(j.role);
    } catch {
      setErr("Server unreachable — address/server check kore abar try koro.");
      setShake((s) => s + 1);
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="auth-wrap fade-up">
        <div className="card auth-card">
          <p className="muted small">Checking session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap fade-up">
      <div key={shake} className={"card auth-card" + (err ? " shake" : "")}>
        <div className="kicker">
          <span className="pulse-dot" />
          Welcome back
        </div>
        <h1>
          Login to <span className="grad-anim">CodeBridge</span>
        </h1>
        <p className="muted small" style={{ marginTop: 0 }}>
          Local admin is set via <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code> in <code>.env</code>. Accounts
          lock for 15 minutes after 5 wrong tries.
        </p>
        <form onSubmit={go}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" type="email" />
          <label>Password</label>
          <div className="pw-wrap">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <label style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me — 30 days, all tabs
          </label>
          {err && (
            <p className="small" style={{ marginTop: 12 }}>
              <span className="badge bad">{err}</span>
            </p>
          )}
          <input
            name="website"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
          />
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-lg shine" style={{ width: "100%" }} type="submit" disabled={busy}>
              {busy ? "Logging in…" : "Login"}
            </button>
          </div>
        </form>
        <p className="muted small" style={{ margin: "14px 0 0", textAlign: "center" }}>
          Tip: login works per address — localhost, tailnet IP and tunnel URL each need their own login. Pick one and
          bookmark it.
        </p>
        <p className="muted small" style={{ margin: "18px 0 0", textAlign: "center" }}>
          No account yet?{" "}
          <Link href="/signup" style={{ color: "var(--mint-2)" }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
