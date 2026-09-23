import crypto from "crypto";

// Paddle Billing (live) — hosted checkout + webhook fulfillment.
// Secrets come from env: PADDLE_API_KEY, PADDLE_PRO_PRICE_ID,
// PADDLE_TEAM_PRICE_ID, PADDLE_WEBHOOK_SECRET. Never log the key.

export const PLANS = {
  pro: { name: "Pro", coins: 200000 },
  team: { name: "Team", coins: 1000000 },
} as const;
export type PlanId = keyof typeof PLANS;

export function paddleConfigured(): boolean {
  return (
    (process.env.PADDLE_API_KEY || "").startsWith("pdl_") &&
    !!process.env.PADDLE_PRO_PRICE_ID &&
    !!process.env.PADDLE_TEAM_PRICE_ID
  );
}

export function priceIdFor(plan: PlanId): string {
  return plan === "pro" ? process.env.PADDLE_PRO_PRICE_ID || "" : process.env.PADDLE_TEAM_PRICE_ID || "";
}

async function paddleFetch(path: string, init?: { method?: string; body?: unknown }) {
  const key = process.env.PADDLE_API_KEY || "";
  const r = await fetch("https://api.paddle.com" + path, {
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
export async function createCheckout(opts: { email: string; userId: string; plan: PlanId }) {
  const customerId = await ensureCustomer(opts.email);
  const tx = await paddleFetch("/transactions", {
    method: "POST",
    body: {
      items: [{ price_id: priceIdFor(opts.plan), quantity: 1 }],
      customer_id: customerId,
      collection_mode: "automatic",
      custom_data: { userId: opts.userId, plan: opts.plan },
    },
  });
  const url = tx?.data?.checkout?.url as string | undefined;
  const txId = tx?.data?.id as string | undefined;
  if (!url) throw new Error("Paddle: no checkout URL returned");
  return { url, transactionId: txId || "", customerId };
}

// Verify Paddle Billing webhook signature.
// Header: "Paddle-Signature: ts=<unix>;h1=<hex>". Signed payload: ts + ";" + rawBody.
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
  const signed = ts + ";" + rawBody;
  const want = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  if (want.length !== h1.length) return false;
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(h1));
}
