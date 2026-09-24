import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section fade-up" style={{ textAlign: "center", padding: "110px 0 90px" }}>
      <div className="hero-orbit" aria-hidden="true">
        <div className="ring ring--1" />
        <div className="ring ring--2" />
      </div>
      <div className="kicker" style={{ marginBottom: 16 }}>
        <span className="pulse-dot" />
        Signal lost
      </div>
      <div className="grad-anim text-glow" style={{ fontSize: 118, fontWeight: 800, letterSpacing: "-0.06em", lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ margin: "14px 0 10px", fontSize: 30 }}>This frame never rendered</h1>
      <p className="muted" style={{ maxWidth: 460, margin: "0 auto 26px" }}>
        The page does not exist, or your session cannot see it. Dashboards require login — admin areas return 404 for
        everyone else.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="btn btn-lg shine" href="/">
          Back home
        </Link>
        <Link className="btn-ghost btn-lg" href="/login">
          Login
        </Link>
        <Link className="btn-ghost btn-lg" href="/game">
          Game Studio
        </Link>
      </div>
    </div>
  );
}
