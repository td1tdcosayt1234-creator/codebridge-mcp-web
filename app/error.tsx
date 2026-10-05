"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="prose" style={{ textAlign: "center", padding: "40px 0" }}>
      <h2>⚠️ Something broke</h2>
      <p className="muted small">{String(error?.message || "Unknown error").slice(0, 200)}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
        <button className="btn" onClick={reset}>Try again</button>
        <a className="btn-ghost" href="/">Home</a>
      </div>
    </div>
  );
}
