"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "../../components/Reveal";

type Plan = { id: string; name: string; price: string; coins: number };
const META: Record<string, { icon: string; c: string; f: string[] }> = {
  free: { icon: "🌱", c: "Perfect for starting", f: ["10,000 compile tokens free", "Bigger files cost more (1 token ≈ 4 chars)", "Fix-with-compile (AI auto-fix)", "Dashboard: requests, balance, tracking", "Community support"] },
  pro: { icon: "🚀", c: "For serious builders", f: ["200,000 coins / month", "Big files + fix-with-compile included", "Faster cloud queue", "Higher API limits", "Priority support"] },
  team: { icon: "🏢", c: "Team + admin control", f: ["1,000,000 tokens / month, shared", "Full admin dashboard + audit logs", "Per-user balance + quota control", "Self-hosted PC runner guide", "SLA support"] },
};

export default function Pricing(){
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mine, setMine] = useState("free");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/billing/status").then((r) => r.json()).then((j) => {
      if (j?.ok) { setPlans(j.plans || []); setMine(j.plan || "free"); setReady(j.configured); }
    }).catch(() => {});
  }, []);

  const pay = async (id: string) => {
    setErr(""); setBusy(id);
    try {
      const r = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: id }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { location.href = "/login?next=/pricing"; return; }
      if (!r.ok || !j.url) { setErr(j.error || "Checkout failed"); return; }
      location.href = j.url;
    } finally { setBusy(""); }
  };

  const list = plans.length ? plans : [
    { id: "free", name: "Free", price: "$0", coins: 10000 },
    { id: "pro", name: "Pro", price: "$12/mo", coins: 200000 },
    { id: "team", name: "Team", price: "$39/mo", coins: 1000000 },
  ];

  return (<div>
    <div className="page-hero" style={{textAlign:"center"}}>
      <div className="kicker" style={{marginBottom:12}}><span className="pulse-dot" />Simple pricing</div>
      <h1>Pricing — <span className="grad-anim">start free</span></h1>
      <p style={{margin:"0 auto"}}>No card for Free. Pro/Team pay securely via Paddle — coins land automatically after payment.</p>
    </div>
    {mine !== "free" && <p style={{textAlign:"center"}}><span className="badge ok">Your plan: {mine}</span></p>}
    {err && <p style={{textAlign:"center"}}><span className="badge bad">{err}</span></p>}
    <div className="grid g3">{list.map((p, i) => {
      const m = META[p.id] || META.free;
      const isMine = mine === p.id;
      const paid = p.id !== "free";
      return (
        <Reveal key={p.id} delay={i * 100}>
          <div className={"card" + (p.id === "pro" ? " card-glow card-pop" : "")} style={{ height: "100%" }}>
            {p.id === "pro" && <span className="ribbon">★ Most popular</span>}
            <h3 style={{ marginTop: 0 }}>{m.icon} {p.name}</h3>
            <div><span style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-1px" }}>{p.price.split("/")[0]}</span><span className="muted small"> {p.price.includes("/") ? "/" + p.price.split("/")[1] : p.id === "free" ? "forever" : ""}</span></div>
            <div className="muted small">{m.c}</div>
            <ul className="small check">{m.f.map((f) => (<li key={f}>{f}</li>))}</ul>
            <div style={{ marginTop: 14 }}>
              {!paid && (isMine
                ? <span className="badge ok">Current plan</span>
                : <Link className="btn-ghost" style={{ width: "100%", textAlign: "center" }} href="/signup">Choose Free</Link>)}
              {paid && (isMine
                ? <span className="badge ok">Current plan</span>
                : !ready
                  ? <span className="badge warn">Payments coming soon</span>
                  : <button className={p.id === "pro" ? "btn" : "btn-ghost"} style={{ width: "100%" }} disabled={!!busy} onClick={() => pay(p.id)}>{busy === p.id ? "Opening…" : "Pay " + p.price + " →"}</button>)}
            </div>
          </div>
        </Reveal>);
    })}</div>
    <div className="grid g2" style={{marginTop:14}}>
      <Reveal><div className="card" style={{height:"100%"}}><h3>🎁 What is free?</h3><ul className="small check"><li>No credit card, active right after signup</li><li>Nothing to configure — just log in and send requests</li><li>Agent connect + auto compile + dashboard tracking</li></ul></div></Reveal>
      <Reveal delay={120}><div className="card" style={{height:"100%"}}><h3>💳 How payment works?</h3><p className="muted small">Click Pay → secure Paddle checkout → coins auto-credit on success. Login required. Webhook: <code>/api/billing/webhook</code>.</p><Link className="btn-ghost" href="/faq">Read FAQ</Link></div></Reveal>
    </div>
  </div>);
}
