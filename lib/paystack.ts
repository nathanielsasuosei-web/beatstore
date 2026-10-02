import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.paystack.co";

export function paystackEnabled() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

/** Test-mode checkout is available when no live key is set (or it's explicitly allowed). */
export function simulationAllowed() {
  if (!paystackEnabled()) return true;
  return process.env.ENABLE_PAYMENT_SIMULATION === "true";
}

export function paystackPublicKey() {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
}

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

/** Channels that actually work for the store currency. */
export function channelsForCurrency(currency: string): string[] {
  switch (currency.toUpperCase()) {
    case "GHS":
      return ["mobile_money", "card", "bank_transfer"];
    case "NGN":
      return ["card", "bank", "ussd", "bank_transfer", "mobile_money"];
    case "KES":
      return ["mobile_money", "card"];
    case "ZAR":
      return ["card", "eft", "bank_transfer"];
    default:
      return ["card"];
  }
}

export type InitResult =
  | { ok: true; authorizationUrl: string; accessCode: string; reference: string }
  | { ok: false; error: string };

export async function initializeTransaction(input: {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}): Promise<InitResult> {
  try {
    const res = await fetch(`${BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountMinor,
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        channels: input.channels ?? channelsForCurrency(input.currency),
        metadata: input.metadata ?? {},
      }),
      cache: "no-store",
    });

    const json = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { authorization_url: string; access_code: string; reference: string };
    };

    if (!res.ok || !json.status || !json.data) {
      return { ok: false, error: json.message || "Paystack could not start the transaction." };
    }

    return {
      ok: true,
      authorizationUrl: json.data.authorization_url,
      accessCode: json.data.access_code,
      reference: json.data.reference,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Paystack request failed." };
  }
}

export type VerifyResult =
  | { ok: true; status: string; amountMinor: number; currency: string; channel?: string; paidAt?: string }
  | { ok: false; error: string };

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  try {
    const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret()}` },
      cache: "no-store",
    });
    const json = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { status: string; amount: number; currency: string; channel?: string; paid_at?: string };
    };
    if (!res.ok || !json.status || !json.data) {
      return { ok: false, error: json.message || "Could not verify the transaction." };
    }
    return {
      ok: true,
      status: json.data.status,
      amountMinor: json.data.amount,
      currency: json.data.currency,
      channel: json.data.channel,
      paidAt: json.data.paid_at,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Paystack verify failed." };
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const hash = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
