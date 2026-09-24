"use client";
import { useState } from "react";
import Link from "next/link";
import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";

const QUICK = [
  { icon: "plug", title: "MCP will not connect?", body: (<>Web server on? URL correct? Agent restarted after the config change? Key in headers? Full walkthrough on <Link href="/mcp">/mcp</Link>.</>) },
  { icon: "key", title: "Access error?", body: (<>&ldquo;Low balance&rdquo; → earn coins in <Link href="/dashboard/earn">/dashboard/earn</Link>. &ldquo;VPN not allowed&rdquo; → disable VPN. &ldquo;Bot detected&rdquo; → fill forms manually. Details in <Link href="/docs">/docs</Link>.</>) },
  { icon: "help", title: "Something else?", body: (<>Read the <Link href="/faq">FAQ</Link> first — 17 answers ready and most tickets never get opened after that.</>) },
];

const ICONS = {
  plug: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3v6M15 3v6M7 9h10v3a5 5 0 0 1-10 0V9ZM12 17v4" /></svg>,
  key: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="12" r="4" /><path d="M12 12h9m-3 0v3m-3-3v2" /></svg>,
  help: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.6 9.5a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4M12 17h.01" /></svg>,
};

export default function Support() {
  const [s, setS] = useState("");
  const [b, setB] = useState("");
  const [hp, setHp] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!s.trim() || !b.trim()) {
      setMsg("Please write both subject and message.");
      setOk(false);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: s, body: b, website: hp }),
      });
      const j = await r.json().catch(() => ({}));
      setOk(r.ok);
      setMsg(r.ok ? "Ticket sent. The admin will reply from /admin/support." : "Failed: " + (j.error || "try again"));
      if (r.ok) {
        setS("");
        setB("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="prose">
      <PageHero
        kicker="Avg reply: fast"
        title={<>Support — <span className="grad-anim">get help</span></>}
        sub="Open a ticket and the admin will reply. Check the quick fixes below first — most issues solve in a minute."
      />

      <div className="grid g3">
        {QUICK.map((q, i) => (
          <Reveal key={q.title} delay={i * 100}>
            <article className="card" style={{ height: "100%" }}>
              <div className="feat">{ICONS[q.icon as keyof typeof ICONS]}</div>
              <h3>{q.title}</h3>
              <p className="muted small">{q.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={140} variant="scale">
        <div className="card holo" style={{ maxWidth: 620, margin: "30px auto 0" }}>
          <h3>Open a ticket</h3>
          <p className="muted small">Login is optional, but logged-in tickets get matched to you and answered faster. Max 5 tickets/hour.</p>
          <form onSubmit={send}>
            <label>Subject (e.g. build failed, MCP 404)</label>
            <input value={s} onChange={(e) => setS(e.target.value)} placeholder="Short title" />
            <label>Message (what you did, the error, run_id if any)</label>
            <textarea rows={5} value={b} onChange={(e) => setB(e.target.value)} placeholder="Write details…" />
            <input
              name="website"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
            />
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-lg" style={{ width: "100%" }} disabled={busy}>
                {busy ? "Sending…" : "Send ticket"}
              </button>
            </div>
          </form>
          {msg && (
            <p className="small" style={{ marginBottom: 0 }}>
              <span className={"badge " + (ok ? "ok" : "bad")}>{msg}</span>
            </p>
          )}
        </div>
      </Reveal>
    </div>
  );
}
