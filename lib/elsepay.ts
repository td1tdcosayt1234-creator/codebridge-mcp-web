import { PRICING, normalizeCycle, type PlanId, type Cycle } from "./billing";

// Else Pay (port 3000 gateway) — merchant integration for CodeBridge.
// Merchant created in Else console (/app/console/merchants). Secrets come
// from env, never logged. See .env.example.

export function elseAmountFor(plan: PlanId, cycle: Cycle): number {
  return PRICING[plan][normalizeCycle(cycle)].price;
}

export function elsepayConfigured(): boolean {
  return (
    !!process.env.ELSEPAY_URL &&
    (process.env.ELSEPAY_SECRET || "").startsWith("else_sk_")
  );
}

function base(): string {
  return (process.env.ELSEPAY_URL || "http://localhost:3000").replace(/\/$/, "");
}

function secret(): string {
  return process.env.ELSEPAY_SECRET || "";
}

function headers(): Record<string, string> {
  return { "x-else-secret": secret(), "Content-Type": "application/json" };
}

export function elsepayPublicBase(): string {
  return (
    process.env.ELSEPAY_PUBLIC || process.env.ELSEPAY_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
}

function productEnvFor(plan: PlanId, cycle: Cycle): string {
  const P = plan === "pro" ? "PRO" : "TEAM";
  const C = normalizeCycle(cycle);
  if (C === "weekly") return process.env[`ELSEPAY_${P}_WEEKLY_PRODUCT`] || "";
  if (C === "annual") return process.env[`ELSEPAY_${P}_ANNUAL_PRODUCT`] || "";
  return process.env[`ELSEPAY_${P}_PRODUCT`] || "";
}

export type ElseCharge = {
  charge_id: string;
  amount: number;
  currency: string;
  checkout_url: string;
  status: string;
};

// Ensure the merchant product exists (id in env may be stale after db reset).
// Falls back to amount-based charge when creation fails.
async function ensureProduct(plan: PlanId, cycle: Cycle): Promise<string> {
  const existing = productEnvFor(plan, cycle);
  if (existing) {
    // Verify it still exists on the gateway.
    try {
      const r = await fetch(base() + "/api/v1/products", { headers: headers() });
      if (r.ok) {
        const list = (await r.json()) as Array<{ id?: string }>;
        if (Array.isArray(list) && list.some((p) => p?.id === existing)) return existing;
      }
    } catch { /* fall through to recreate */ }
  }
  const c = normalizeCycle(cycle);
  const cName = c === "weekly" ? "Weekly" : c === "annual" ? "Annual" : "Monthly";
  const name = `CodeBridge ${plan === "pro" ? "Pro" : "Team"} ${cName}`;
  const r = await fetch(base() + "/api/v1/products", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name, price: elseAmountFor(plan, c) }),
  });
  if (!r.ok) throw new Error("Else Pay products " + r.status);
  const j = (await r.json()) as { product_id?: string };
  if (!j?.product_id) throw new Error("Else Pay: no product_id returned");
  return j.product_id;
}

export async function createElseCharge(opts: {
  userId: string;
  plan: PlanId;
  cycle?: Cycle;
  returnUrl: string;
}): Promise<ElseCharge> {
  if (!elsepayConfigured()) throw new Error("Else Pay not configured");
  const cycle = normalizeCycle(opts.cycle);
  const product_id = await ensureProduct(opts.plan, cycle);
  const r = await fetch(base() + "/api/v1/charges", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ product_id, returnUrl: opts.returnUrl }),
  });
  if (!r.ok) throw new Error("Else Pay charges " + r.status);
  const j = (await r.json()) as ElseCharge;
  if (!j?.charge_id) throw new Error("Else Pay: no charge_id returned");
  // Gateway returns a relative checkout path when PUBLIC_URL is unset —
  // prefix with the public base so tunnel users can reach it.
  if (j.checkout_url && j.checkout_url.startsWith("/")) {
    j.checkout_url = elsepayPublicBase() + j.checkout_url;
  }
  return j;
}

export async function getElseCharge(chargeId: string): Promise<{
  charge_id: string;
  status: string;
  amount: number;
  product?: string;
  payer?: string | null;
}> {
  const r = await fetch(base() + "/api/v1/charges/" + encodeURIComponent(chargeId), {
    headers: headers(),
  });
  if (!r.ok) throw new Error("Else Pay lookup " + r.status);
  return (await r.json()) as {
    charge_id: string;
    status: string;
    amount: number;
    product?: string;
    payer?: string | null;
  };
}

// Webhook signature: gateway sends x-else-signature = merchant secretKey.
export function verifyElseWebhook(req: Request): boolean {
  const sig = req.headers.get("x-else-signature") || "";
  const want = secret();
  if (!sig || !want || sig.length !== want.length) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(want);
  return a.length === b.length && require("crypto").timingSafeEqual(a, b);
}

// Amounts are NOT unique across plans (pro monthly $12 == team weekly $12),
// so the paid amount is always validated against the pending checkout record
// (chargeId → plan+cycle), never guessed from the amount alone.
export function expectedElseAmount(plan: PlanId, cycle: Cycle): number {
  return elseAmountFor(plan, normalizeCycle(cycle));
}
