"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";
import Tilt from "../../components/Tilt";

type Plan = { id: string; name: string; price: string; coins: number };

const META: Record<string, { icon: string; c: string; f: string[] }> = {
  free: { icon: "seed", c: "Perfect for starting", f: ["10,000 compile tokens free", "Bigger files cost more (1 token ≈ 4 chars)", "Fix-with-compile (AI auto-fix)", "Dashboard: requests, balance, tracking", "Community support"] },
  pro: { icon: "bolt", c: "For serious builders", f: ["200,000 coins / month", "Big files + fix-with-compile included", "Faster cloud queue", "Higher API limits", "Priority support"] },
  team: { icon: "team", c: "Team + admin control", f: ["1,000,000 tokens / month, shared", "Full admin dashboard + audit logs", "Per-user balance + quota control", "Self-hosted PC runner guide", "SLA support"] },
};

const ICONS = {
  seed: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21V9m0 0c0-3 2-5 5-5 0 3-2 5-5 5Zm0 4c0-3-2-5-5-5 0 3 2 5 5 5Z" /></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>,
  team: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6m1 9a5 5 0 0 1 4 5" /></svg>,
  gift: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11h18v9H3zM12 7v13M12 7H8.5a2.5 2.5 0 1 1 2.3-3.5L12 7Zm0 0h3.5a2.5 2.5 0 1 0-2.3-3.5L12 7Z" /></svg>,
  card: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h3" /></svg>,
};

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mine, setMine] = useState("free");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          setPlans(j.plans || []);
          setMine(j.plan || "free");
          setReady(j.configured);
        }
      })
      .catch(() => {});
  }, []);

  const pay = async (id: string) => {
    setErr("");
    setBusy(id);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: id }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        location.href = "/login?next=/pricing";
        return;
      }
      if (!r.ok || !j.url) {
        setErr(j.error || "Checkout failed");
        return;
      }
      location.href = j.url;
    } finally {
      setBusy("");
    }
  };

  const list = plans.length
    ? plans
    : [
        { id: "free", name: "Free", price: "$0", coins: 10000 },
        { id: "pro", name: "Pro", price: "$12/mo", coins: 200000 },
        { id: "team", name: "Team", price: "$39/mo", coins: 1000000 },
      ];

  return (
    <div>
      <PageHero
        kicker="Simple pricing"
        title={<>Pricing — <span className="grad-anim text-glow">start free</span></>}
        sub="No card for Free. Pro and Team pay securely through Paddle — coins land automatically after payment."
      />

      {mine !== "free" && (
        <p style={{ textAlign: "center" }}>
          <span className="badge ok">Your plan: {mine}</span>
        </p>
      )}
      {err && (
        <p style={{ textAlign: "center" }}>
          <span className="badge bad">{err}</span>
        </p>
      )}

      <div className="grid g3" style={{ marginTop: 18 }}>
        {list.map((p, i) => {
          const m = META[p.id] || META.free;
          const isMine = mine === p.id;
          const paid = p.id !== "free";
          const hero = p.id === "pro";
          return (
            <Reveal key={p.id} delay={i * 120} variant="scale">
              <Tilt strength={hero ? 7 : 5}>
                <article className={"card" + (hero ? " card-glow holo" : "")} style={{ height: "100%" }}>
                  {hero && <span className="ribbon">Most popular</span>}
                  <div className="feat">{ICONS[m.icon as keyof typeof ICONS]}</div>
                  <h3 style={{ marginTop: 0 }}>{p.name}</h3>
                  <div>
                    <span className="stat-num" style={{ fontSize: 40 }}>{p.price.split("/")[0]}</span>{" "}
                    <span className="muted small">
                      {p.price.includes("/") ? "/ " + p.price.split("/")[1] : p.id === "free" ? "forever" : ""}
                    </span>
                  </div>
                  <div className="muted small">{m.c}</div>
                  <ul className="small check">{m.f.map((f) => <li key={f}>{f}</li>)}</ul>
                  <div style={{ marginTop: 18 }}>
                    {!paid &&
                      (isMine ? (
                        <span className="badge ok">Current plan</span>
                      ) : (
                        <Link className="btn-ghost" style={{ width: "100%" }} href="/signup">
                          Choose Free
                        </Link>
                      ))}
                    {paid &&
                      (isMine ? (
                        <span className="badge ok">Current plan</span>
                      ) : !ready ? (
                        <span className="badge warn">Payments coming soon</span>
                      ) : (
                        <button
                          className={hero ? "btn" : "btn-ghost"}
                          style={{ width: "100%" }}
                          disabled={!!busy}
                          onClick={() => pay(p.id)}
                        >
                          {busy === p.id ? "Opening…" : "Pay " + p.price}
                        </button>
                      ))}
                  </div>
                </article>
              </Tilt>
            </Reveal>
          );
        })}
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Reveal variant="left">
          <article className="card" style={{ height: "100%" }}>
            <div className="feat">{ICONS.gift}</div>
            <h3>What is free?</h3>
            <ul className="small check">
              <li>No credit card, active right after signup</li>
              <li>Nothing to configure — just log in and send requests</li>
              <li>Agent connect + real builds + dashboard tracking</li>
            </ul>
          </article>
        </Reveal>
        <Reveal variant="right" delay={120}>
          <article className="card" style={{ height: "100%" }}>
            <div className="feat">{ICONS.card}</div>
            <h3>How payment works</h3>
            <p className="muted small">
              Click Pay → secure Paddle checkout → coins auto-credit on success. Login required. Webhook:{" "}
              <code>/api/billing/webhook</code>.
            </p>
            <Link className="btn-ghost" href="/faq">
              Read FAQ
            </Link>
          </article>
        </Reveal>
      </div>
    </div>
  );
}
