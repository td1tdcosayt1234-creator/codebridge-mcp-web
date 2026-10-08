import crypto from "crypto";

// Paddle Billing (live) — hosted checkout + webhook fulfillment.
// Secrets come from env: PADDLE_API_KEY, PADDLE_*_PRICE_ID,
// PADDLE_WEBHOOK_SECRET. Never log the key.

export const PLANS = {
  pro: { name: "Pro", coins: 200000 },
  team: { name: "Team", coins: 1000000 },
} as const;
export type PlanId = keyof typeof PLANS;

// Billing cycles. Weekly/annual are optional per gateway — monthly always works.
export const CYCLES = ["weekly", "monthly", "annual"] as const;
export type Cycle = (typeof CYCLES)[number];

export function normalizeCycle(c: unknown): Cycle {
  return c === "weekly" || c === "annual" ? c : "monthly";
}

// Price (USD) + coins per plan+cycle. Annual ≈ 10x monthly price for 12x
// coins ("2 months free"). Weekly ≈ 1/3 monthly.
export const PRICING: Record<PlanId, Record<Cycle, { price: number; coins: number; label: string }>> = {
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
} as const;

export function paddleConfigured(): boolean {
  return (
    (process.env.PADDLE_API_KEY || "").startsWith("pdl_") &&
    !!process.env.PADDLE_PRO_PRICE_ID &&
    !!process.env.PADDLE_TEAM_PRICE_ID
  );
}

export function priceIdFor(plan: PlanId): string {
  return priceIdForCycle(plan, "monthly");
}

// Per-cycle Paddle price IDs. Monthly keeps the legacy env names;
// weekly/annual need their own prices in the Paddle dashboard.
export function priceIdForCycle(plan: PlanId, cycle: Cycle): string {
  const P = plan === "pro" ? "PRO" : "TEAM";
  if (cycle === "weekly") return process.env[`PADDLE_${P}_WEEKLY_PRICE_ID`] || "";
  if (cycle === "annual") return process.env[`PADDLE_${P}_ANNUAL_PRICE_ID`] || "";
  return process.env[`PADDLE_${P}_PRICE_ID`] || "";
}

export function paddleCycleConfigured(plan: PlanId, cycle: Cycle): boolean {
  return (
    (process.env.PADDLE_API_KEY || "").startsWith("pdl_") &&
    !!priceIdForCycle(plan, cycle)
  );
}

function paddleApiBase() {
  return process.env.PADDLE_ENV === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
}

async function paddleFetch(path: string, init?: { method?: string; body?: unknown }) {
  const key = process.env.PADDLE_API_KEY || "";
  const r = await fetch(paddleApiBase() + path, {
    method: init?.method || "GET",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Paddle " + r.status + ": " + (j?.error?.detail || j?.error?.code || "request failed"));
  return j;
}

// Find customer by email, or create one. Returns Paddle customer id.
export async function ensureCustomer(email: string): Promise<string> {
  const found = await paddleFetch("/customers?email=" + encodeURIComponent(email));
  const list = found?.data;
  if (Array.isArray(list) && list.length > 0) return list[0].id as string;
  const created = await paddleFetch("/customers", { method: "POST", body: { email } });
  if (!created?.data?.id) throw new Error("Paddle: customer create failed");
  return created.data.id as string;
}

// Create a subscription transaction and return the hosted checkout URL.
export async function createCheckout(opts: { email: string; userId: string; plan: PlanId; cycle?: Cycle }) {
  const cycle = normalizeCycle(opts.cycle);
  const customerId = await ensureCustomer(opts.email);
  const tx = await paddleFetch("/transactions", {
    method: "POST",
    body: {
      items: [{ price_id: priceIdForCycle(opts.plan, cycle), quantity: 1 }],
      customer_id: customerId,
      collection_mode: "automatic",
      custom_data: { userId: opts.userId, plan: opts.plan, cycle },
    },
  });
  const url = tx?.data?.checkout?.url as string | undefined;
  const txId = tx?.data?.id as string | undefined;
  if (!url) throw new Error("Paddle: no checkout URL returned");
  return { url, transactionId: txId || "", customerId };
}

// Verify Paddle Billing webhook signature.
// Header: "Paddle-Signature: ts=<unix>;h1=<hex>". Signed payload: ts + ":" + rawBody.
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    header.split(";").map((p) => {
      const i = p.indexOf("=");
      return i < 0 ? [p.trim(), ""] : [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    })
  );
  const ts = parts.ts || "";
  const h1 = parts.h1 || "";
  if (!ts || !h1) return false;
  // Fail closed on absurd timestamps (typos/forgery), but keep the window
  // generous: Paddle retries deliveries for up to 3 days.
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (tsNum > nowSec + 600 || tsNum < nowSec - 4 * 24 * 3600) return false;
  const signed = ts + ":" + rawBody;
  const want = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  if (want.length !== h1.length) return false;
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(h1));
}
