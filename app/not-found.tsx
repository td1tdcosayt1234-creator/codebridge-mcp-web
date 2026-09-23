import Link from "next/link";
export default function NotFound() {
  return (
    <div style={{ padding: "70px 0", textAlign: "center" }} className="fade-up">
      <div className="kicker" style={{ marginBottom: 14 }}><span className="pulse-dot" />Lost in space</div>
      <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: "-4px", lineHeight: 1 }} className="grad-anim">404</div>
      <h1 style={{ margin: "12px 0 8px", letterSpacing: "-.5px" }}>Page not found</h1>
      <p className="muted" style={{ maxWidth: 440, margin: "0 auto 22px" }}>This page does not exist, or you do not have access. Dashboards require login — admins get 404 on non-admin areas too.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="btn btn-lg" href="/login">Login →</Link>
        <Link className="btn-ghost btn-lg" href="/">Home</Link>
        <Link className="btn-ghost btn-lg" href="/game">🎮 Game</Link>
      </div>
    </div>
  );
}
