"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import PageHero from "../../components/PageHero";
import Reveal from "../../components/Reveal";
import Tilt from "../../components/Tilt";

type Plan = { id: string; name: string; price: string; coins: number };
type Cycle = "weekly" | "monthly" | "annual";
type CycleInfo = { price: number; coins: number; label: string; paddle?: boolean };

const CYCLE_ORDER: Cycle[] = ["weekly", "monthly", "annual"];
const CYCLE_NAME: Record<Cycle, string> = { weekly: "week", monthly: "month", annual: "year" };
// Fallback mirror of server PRICING (used until /api/billing/status loads).
const FALLBACK_CYCLES: Record<string, Record<Cycle, CycleInfo>> = {
  pro: {
    weekly: { price: 4, coins: 60000, label: "$4/wk" },
    monthly: { price: 12, coins: 200000, label: "$12/mo" },
    annual: { price: 120, coins: 2400000, label: "$120/yr" },
  },
  team: {
    weekly: { price: 12, coins: 300000, label: "$12/wk" },
    monthly: { price: 39, coins: 1000000, label: "$39/mo" },
    annual: { price: 390, coins: 12000000, label: "$390/yr" },
  },
};

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

function TransactionCheckout({ paddle }: { paddle: Paddle | null }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!paddle) return;
    const txn = searchParams.get("_ptxn");
    if (txn) paddle.Checkout.open({ transactionId: txn });
  }, [paddle, searchParams]);
  return null;
}

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mine, setMine] = useState("free");
  const [ready, setReady] = useState(false);
  const [elseReady, setElseReady] = useState(false);
  const [cycles, setCycles] = useState<Record<string, Record<Cycle, CycleInfo>>>(FALLBACK_CYCLES);
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [busy, setBusy] = useState("");
  const [elseBusy, setElseBusy] = useState("");
  const [payChoice, setPayChoice] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"paddle" | "else" | null>(null);
  const closePay = () => {
    setPayChoice(null);
    setPayMethod(null);
  };
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [paddle, setPaddle] = useState<Paddle | null>(null);

  // Paddle.js overlay opens the transaction checkout when the app is opened
  // via the transaction-link returned by the pricing page (`?_ptxn=...`).
  // Widget init is optional — server checkout redirect works without it —
  // so init failures stay silent instead of showing a page error.
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production" | undefined;
    if (!token || !env) return;
    const initPromise = (globalThis as any).__paddleInitPromise || initializePaddle({ token, environment: env });
    (globalThis as any).__paddleInitPromise = initPromise;
    initPromise.then((p: Paddle | undefined) => {
      if (p) setPaddle(p);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          setPlans(j.plans || []);
          setMine(j.plan || "free");
          setReady(j.configured);
          setElseReady(!!j.elsepay?.configured);
          if (j.cycles?.pro && j.cycles?.team) setCycles(j.cycles);
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
        body: JSON.stringify({ plan: id, cycle }),
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

  // Else Pay: earned-$ checkout at the Else gateway, then verify on return.
  const payElse = async (id: string) => {
    setErr("");
    setOkMsg("");
    setElseBusy(id);
    try {
      const r = await fetch("/api/billing/elsepay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: id, cycle }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        location.href = "/login?next=/pricing";
        return;
      }
      if (!r.ok || !j.url) {
        setErr(j.error || "Else Pay checkout failed");
        return;
      }
      try {
        localStorage.setItem("elsepay_charge", String(j.charge_id || ""));
        localStorage.setItem("elsepay_plan", String(id));
      } catch {}
      location.href = j.url;
    } finally {
      setElseBusy("");
    }
  };

  // After returning from Else Pay (?elsepay=pro|team), confirm payment.
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search);
      const ret = q.get("elsepay");
      if (!ret) return;
      const verifyCharge = (charge: string) => {
        if (!charge) {
          setErr("Payment record not found here — open this page in the same browser you paid from, or wait for auto-credit.");
          return;
        }
        fetch("/api/billing/elsepay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ charge_id: charge }),
        })
          .then((r) => r.json())
          .then((j) => {
            if (j?.paid || j?.duplicate) {
              setMine(j.plan || ret);
              setOkMsg("Else Pay confirmed — plan: " + (j.plan || ret) + (j.cycle ? " (" + j.cycle + ")" : ""));
              localStorage.removeItem("elsepay_charge");
            } else if (j?.status) {
              setErr("Else Pay not paid yet (" + j.status + ") — pay first, then reopen this page.");
            } else if (j?.error) {
              setErr(j.error);
            }
          })
          .catch(() => {});
      };
      const charge = localStorage.getItem("elsepay_charge") || "";
      if (charge) {
        verifyCharge(charge);
      } else {
        // Paid on another device/browser — look up own pending checkout.
        fetch("/api/billing/elsepay/pending")
          .then((r) => r.json())
          .then((j) => {
            const first = (j?.pending || []).find((x: { status: string }) => x.status === "created")
              || (j?.pending || [])[0];
            verifyCharge(first?.chargeId || "");
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const list = plans.length
    ? plans
    : [
        { id: "free", name: "Free", price: "$0", coins: 10000 },
        { id: "pro", name: "Pro", price: "$12/mo", coins: 200000 },
        { id: "team", name: "Team", price: "$39/mo", coins: 1000000 },
      ];

  return (
    <div>
      <Suspense fallback={null}>
        <TransactionCheckout paddle={paddle} />
      </Suspense>
      <PageHero
        kicker="Simple pricing"
        title={<>Pricing — <span className="grad-anim text-glow">start free</span></>}
        sub="No card for Free. Pro and Team pay securely through Paddle or with Else earned $ — coins land automatically after payment."
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
      {okMsg && (
        <p style={{ textAlign: "center" }}>
          <span className="badge ok">{okMsg}</span>
        </p>
      )}

      <div className="cycle-toggle" role="tablist" aria-label="Billing period">
        {CYCLE_ORDER.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cycle === c}
            className={"cycle-pill" + (cycle === c ? " active" : "")}
            onClick={() => setCycle(c)}
          >
            {c === "weekly" ? "Weekly" : c === "monthly" ? "Monthly" : "Annual"}
            {c === "annual" && <span className="cycle-save">2 months free</span>}
          </button>
        ))}
      </div>

      <div className="grid g3" style={{ marginTop: 30 }}>
        {list.map((p, i) => {
          const m = META[p.id] || META.free;
          const isMine = mine === p.id;
          const paid = p.id !== "free";
          const hero = p.id === "pro";
          const cyc = paid ? (cycles[p.id]?.[cycle] || FALLBACK_CYCLES[p.id]?.[cycle]) : null;
          const amount = cyc ? "$" + cyc.price : p.price.split("/")[0];
          const per = cyc ? "/ " + CYCLE_NAME[cycle] : (p.price.includes("/") ? "/ " + p.price.split("/")[1] : p.id === "free" ? "forever" : "");
          const feats = paid && cyc
            ? [`${cyc.coins.toLocaleString()} coins / ${CYCLE_NAME[cycle]}`, ...m.f.slice(1)]
            : m.f;
          return (
            <Reveal key={p.id} delay={i * 120} variant="scale">
              <Tilt strength={hero ? 7 : 5}>
                {hero && <span className="price-flag">Most popular</span>}
                <article className={"card" + (hero ? " card-glow holo price-pop" : "")} style={{ height: "100%" }}>
                  <div className="feat">{ICONS[m.icon as keyof typeof ICONS]}</div>
                  <h3 style={{ marginTop: 0 }}>{p.name}</h3>
                  <div key={paid ? cycle : "free"} className="pay-price-swap">
                    <span className="stat-num" style={{ fontSize: 40 }}>{amount}</span>{" "}
                    <span className="muted small">{per}</span>
                  </div>
                  <div className="muted small">{m.c}</div>
                  <ul className="small check">{feats.map((f) => <li key={f}>{f}</li>)}</ul>
                  <div style={{ marginTop: 18 }}>
                    {!paid &&
                      (isMine ? (
                        <span className="badge ok">Current plan</span>
                      ) : (
                        <Link className="btn-ghost btn-block" href="/signup">
                          Choose Free
                        </Link>
                      ))}
                    {paid &&
                      (isMine ? (
                        <span className="badge ok">Current plan</span>
                      ) : !ready && !elseReady ? (
                        <span className="badge warn">Payments coming soon</span>
                      ) : (
                        <button
                          className={(hero ? "btn" : "btn-ghost") + " btn-block"}
                          disabled={!!busy || !!elseBusy}
                          onClick={() => {
                            setErr("");
                            setOkMsg("");
                            setPayMethod(null);
                            setPayChoice(p.id);
                          }}
                        >
                          {busy === p.id || elseBusy === p.id ? "Opening…" : "Pay " + (cyc ? cyc.label : p.price)}
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
              Click Pay → দুই option আসবে: Paddle (card) বা Else $ (earned balance) → coins
              auto-credit on success. Login required. Webhooks:{" "}
              <code>/api/billing/webhook</code> (Paddle), <code>/api/billing/elsepay/webhook</code> (Else).
            </p>
            <Link className="btn-ghost" href="/faq">
              Read FAQ
            </Link>
          </article>
        </Reveal>
      </div>

      {payChoice &&
        (() => {
          const plan = list.find((x) => x.id === payChoice) || {
            id: payChoice,
            name: payChoice,
            price: payChoice === "pro" ? "$12/mo" : "$39/mo",
            coins: payChoice === "pro" ? 200000 : 1000000,
          };
          const meta = META[plan.id] || META.free;
          const mcyc = (cycles[plan.id]?.[cycle] || FALLBACK_CYCLES[plan.id]?.[cycle]) as CycleInfo | undefined;
          const mLabel = mcyc ? mcyc.label : plan.price;
          const mCoins = mcyc ? mcyc.coins : plan.coins;
          const cycleLine = cycle === "annual" ? "Annual — 2 months free" : cycle === "weekly" ? "Weekly billing" : "Monthly billing";
          return (
            <div className="pay-backdrop" onClick={closePay}>
              <div
                className="card pay-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Choose payment method"
              >
                {!payMethod ? (
                  <div className="pay-step" key="method">
                    <h3 style={{ marginTop: 0 }}>Choose payment method</h3>
                    <div className="listrow" style={{ marginBottom: 12 }}>
                      <span>
                        <b>{plan.name}</b> — {mLabel} · {cycleLine}
                        <br />
                        <small>{mCoins.toLocaleString()} coins · {meta.c}</small>
                      </span>
                    </div>
                    <button
                      className="pay-opt"
                      disabled={!ready || !!busy || !!elseBusy}
                      onClick={() => setPayMethod("paddle")}
                    >
                      <span className="pic">💳</span>
                      <span>
                        <b>Paddle</b>
                        <br />
                        <small className="muted">Card / bank · secure hosted checkout</small>
                      </span>
                      <span className="go">›</span>
                    </button>
                    {!ready && (
                      <p className="muted small" style={{ margin: "4px 0 0" }}>
                        Paddle keys not set yet — admin will enable soon
                      </p>
                    )}
                    <button
                      className="pay-opt"
                      disabled={!elseReady || !!busy || !!elseBusy}
                      onClick={() => setPayMethod("else")}
                    >
                      <span className="pic">🪙</span>
                      <span>
                        <b>Else $</b>
                        <br />
                        <small className="muted">Earned balance · no card needed</small>
                      </span>
                      <span className="go">›</span>
                    </button>
                    {!elseReady && (
                      <p className="muted small" style={{ margin: "4px 0 0" }}>
                        Else Pay not configured yet
                      </p>
                    )}
                    <button
                      className="btn-ghost btn-block"
                      style={{ marginTop: 12 }}
                      onClick={closePay}
                    >
                      Cancel
                    </button>
                  </div>
                ) : payMethod === "paddle" ? (
                  <div className="pay-step" key="paddle">
                    <button className="btn-ghost" style={{ marginBottom: 8 }} onClick={() => setPayMethod(null)}>
                      ← All methods
                    </button>
                    <h3 style={{ marginTop: 0 }}>Pay with Paddle 💳</h3>
                    {[
                      ["Plan", plan.name],
                      ["Billing", `${mLabel} · ${CYCLE_NAME[cycle]}`],
                      ["You get", mCoins.toLocaleString() + " coins"],
                    ].map(([k, v], i) => (
                      <div className="listrow pay-row" key={k} style={{ animationDelay: `${i * 70}ms` }}>
                        <span className="muted">{k}</span><b>{v}</b>
                      </div>
                    ))}
                    <ul className="small check" style={{ marginTop: 12 }}>
                      <li>Secure Paddle hosted checkout (card/bank)</li>
                      <li>Coins auto-credit on payment success</li>
                      <li>Receipt sent to your login email</li>
                    </ul>
                    <button
                      className={"btn btn-block" + (busy === payChoice ? " is-loading" : "")}
                      style={{ marginTop: 8 }}
                      disabled={!!busy}
                      onClick={() => {
                        const id = payChoice;
                        closePay();
                        pay(id);
                      }}
                    >
                      {busy === payChoice ? "Opening secure checkout…" : `Confirm — Pay ${mLabel}`}
                    </button>
                    <button className="btn-ghost btn-block" style={{ marginTop: 8 }} onClick={closePay}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="pay-step" key="else">
                    <button className="btn-ghost" style={{ marginBottom: 8 }} onClick={() => setPayMethod(null)}>
                      ← All methods
                    </button>
                    <h3 style={{ marginTop: 0 }}>Pay with Else $ 🪙</h3>
                    {[
                      ["Plan", plan.name],
                      ["Billing", `${mLabel} · ${CYCLE_NAME[cycle]}`],
                      ["You get", mCoins.toLocaleString() + " coins"],
                    ].map(([k, v], i) => (
                      <div className="listrow pay-row" key={k} style={{ animationDelay: `${i * 70}ms` }}>
                        <span className="muted">{k}</span><b>{v}</b>
                      </div>
                    ))}
                    <ul className="small check" style={{ marginTop: 12 }}>
                      <li>Else gateway opens — login with your Else account</li>
                      <li>Pay with earned $ (ads · check-in · spin)</li>
                      <li>Return here — plan auto-activates on verify</li>
                    </ul>
                    <button
                      className={"btn btn-block" + (elseBusy === payChoice ? " is-loading" : "")}
                      style={{ marginTop: 8 }}
                      disabled={!!elseBusy}
                      onClick={() => {
                        const id = payChoice;
                        closePay();
                        payElse(id);
                      }}
                    >
                      {elseBusy === payChoice ? "Creating Else order…" : `Confirm — Pay ${mLabel} with Else $`}
                    </button>
                    <button className="btn-ghost btn-block" style={{ marginTop: 8 }} onClick={closePay}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
