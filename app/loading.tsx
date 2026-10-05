export default function Loading() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "40vh", gap: 12 }}>
      <div className="pulse" style={{ width: 48, height: 48 }} />
      <p className="muted">Loading…</p>
    </div>
  );
}
