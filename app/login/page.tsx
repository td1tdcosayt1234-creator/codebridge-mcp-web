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
  const [googleOn, setGoogleOn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/google/status", { cache: "no-store" })
      .then((x) => x.json())
      .then((j) => { if (j?.google) setGoogleOn(true); })
      .catch(() => {});
    fetch("/api/auth/me", { cache: "no-store" })
      .then((x) => x.json())
      .then((j) => {
        if (j?.user) window.location.href = dest(j.user.role);
        else {
          const q = new URLSearchParams(window.location.search);
          if (q.get("exists") === "1") {
            const em = q.get("email") || "";
            if (em) setEmail(em);
            setErr("Account already exists. Please log in.");
            setShake((s) => s + 1);
          }
          setChecking(false);
        }
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
        {googleOn && (
          <>
            <div className="or-div">or</div>
            <div style={{ marginTop: 12 }}>
              <a
                className="btn-google"
                href={"/api/auth/google?next=" + encodeURIComponent(new URLSearchParams(window.location.search).get("next") || "/dashboard")}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.4 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.5 0 10.2 0 12s.5 3.5 1.4 5.1l3.8-2.7z"/><path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.5 2.6 1.4 6.9l3.8 2.9c.9-2.9 3.6-5.1 6.8-5.1z"/></svg>
                Continue with Google
              </a>
            </div>
          </>
        )}
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
