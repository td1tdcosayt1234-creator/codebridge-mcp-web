"use client";
import { useEffect, useState } from "react";

type Mail = {
  id?: string; messageId?: string; time?: string; from?: string; to?: string;
  subject?: string; text?: string; html?: string; status?: string; dkim?: boolean;
};

export default function Inbox() {
  const [mails, setMails] = useState<Mail[] | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [htmlView, setHtmlView] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/admin/inbox", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error || "Inbox unavailable."); setMails([]); return; }
      setMails(Array.isArray(j.mails) ? j.mails : []);
    } catch {
      setErr("Server unreachable — try again.");
      setMails([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="card"><p className="muted small">Loading inbox…</p></div>;
  if (err && !mails?.length) return <div className="card"><p><span className="badge bad">{err}</span></p><p style={{ marginTop: 12 }}><button className="btn" type="button" onClick={load}>Retry</button></p></div>;

  const list = (mails || []).filter((m) => {
    const s = (q || "").trim().toLowerCase();
    if (!s) return true;
    return ((m.to || "") + " " + (m.from || "") + " " + (m.subject || "")).toLowerCase().includes(s);
  });
  const cur = open ? (mails || []).find((m) => (m.id || m.messageId) === open) : null;

  return (
    <div className="fade-up" style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>Inbox</h3>
            <p className="muted small" style={{ margin: "4px 0 0" }}>Latest {list.length} mail(s) via elsemail API — OTPs, verify links, receipts.</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search to / from / subject…" style={{ minWidth: 220 }} aria-label="Search mails" />
            <button className="btn" type="button" onClick={load}>↻ Refresh</button>
          </div>
        </div>
      </div>

      {err && <p><span className="badge bad">{err}</span></p>}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Time</th><th>To</th><th>Subject</th><th>Status</th><th>DKIM</th></tr></thead>
          <tbody>
            {list.map((m) => {
              const key = m.id || m.messageId || ((m.to || "") + (m.time || ""));
              return (
                <tr key={key} onClick={() => { setOpen(open === key ? null : key); setHtmlView(false); }} style={{ cursor: "pointer" }}>
                  <td className="small" style={{ whiteSpace: "nowrap" }}>{(m.time || "").slice(0, 19).replace("T", " ")}</td>
                  <td className="small">{m.to}</td>
                  <td>{m.subject || <span className="muted">(no subject)</span>}</td>
                  <td><span className={"badge " + (String(m.status || "").toLowerCase().includes("fail") || String(m.status || "").toLowerCase().includes("error") ? "bad" : "ok")}>{m.status || "—"}</span></td>
                  <td>{m.dkim ? <span className="badge ok">✔</span> : <span className="muted">—</span>}</td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={5} className="muted small" style={{ textAlign: "center", padding: 24 }}>No mails found.</td></tr>}
          </tbody>
        </table>
      </div>

      {cur && (
        <div className="card fade-up">
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>{cur.subject || "(no subject)"}</h3>
            <button className="pw-toggle" style={{ position: "static", transform: "none", marginLeft: "auto" }} type="button" onClick={() => setOpen(null)}>✕ Close</button>
          </div>
          <p className="muted small" style={{ margin: "8px 0 0" }}>From: {cur.from || "—"} · To: <b>{cur.to}</b> · {cur.time} · {cur.status}{cur.dkim ? " · DKIM✔" : ""}</p>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button className={"btn" + (!htmlView ? " shine" : "")} type="button" onClick={() => setHtmlView(false)}>Text</button>
            {cur.html && <button className={"btn" + (htmlView ? " shine" : "")} type="button" onClick={() => setHtmlView(true)}>HTML</button>}
          </div>
          {htmlView && cur.html ? (
            <iframe title="mail-html" sandbox="" srcDoc={cur.html} style={{ width: "100%", height: 420, marginTop: 12, border: "1px solid var(--line-2)", borderRadius: 12, background: "#fff" }} />
          ) : (
            <pre className="small" style={{ marginTop: 12, whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 420, overflow: "auto" }}>{cur.text || "(empty body)"}</pre>
          )}
        </div>
      )}
    </div>
  );
}
