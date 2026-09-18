import Link from "next/link";
export default function NotFound() {
  return (
    <div style={{ padding: "60px 0", textAlign: "center" }}>
      <h1>404 — Not found</h1>
      <p className="muted">This page does not exist, or you do not have access. The dashboard requires login.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Link className="btn" href="/login">Login</Link>
        <Link className="btn-ghost" href="/">Home</Link>
      </div>
    </div>
  );
}
