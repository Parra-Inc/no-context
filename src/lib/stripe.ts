import Stripe from "stripe";

export {
  TIER_QUOTAS,
  TIER_MAX_CHANNELS,
  TIER_IMAGE_SIZE,
  TIER_HAS_WATERMARK,
  TIER_PRIORITY,
} from "./tier-constants";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export const PRICE_IDS: Record<string, string> = {
  STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
  STARTER_ANNUAL: process.env.STRIPE_PRICE_STARTER_ANNUAL || "",
  TEAM_MONTHLY: process.env.STRIPE_PRICE_TEAM_MONTHLY || "",
  TEAM_ANNUAL: process.env.STRIPE_PRICE_TEAM_ANNUAL || "",
  BUSINESS_MONTHLY: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "",
  BUSINESS_ANNUAL: process.env.STRIPE_PRICE_BUSINESS_ANNUAL || "",
  ENTERPRISE_MONTHLY: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "",
  ENTERPRISE_ANNUAL: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || "",
};

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  workspaceId: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${appUrl}/dashboard/settings?tab=billing&success=true`,
    cancel_url: `${appUrl}/dashboard/settings?tab=billing&canceled=true`,
    metadata: { workspaceId },
  });
}

export async function createCustomerPortalSession(customerId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/settings?tab=billing`,
  });
}

export interface TokenPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  priceCents: number;
  pricePerImage: string;
  stripePriceId: string;
}

export const TOKEN_PACKS: TokenPack[] = [
  {
    id: "SMALL",
    name: "Small Pack",
    credits: 10,
    priceUsd: 5,
    priceCents: 500,
    pricePerImage: "$0.50",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_SMALL || "",
  },
  {
    id: "MEDIUM",
    name: "Medium Pack",
    credits: 30,
    priceUsd: 12,
    priceCents: 1200,
    pricePerImage: "$0.40",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_MEDIUM || "",
  },
  {
    id: "LARGE",
    name: "Large Pack",
    credits: 75,
    priceUsd: 25,
    priceCents: 2500,
    pricePerImage: "$0.33",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_LARGE || "",
  },
  {
    id: "XL",
    name: "XL Pack",
    credits: 200,
    priceUsd: 50,
    priceCents: 5000,
    pricePerImage: "$0.25",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_XL || "",
  },
];

export async function createTokenPackCheckoutSession(
  customerId: string,
  workspaceId: string,
  pack: TokenPack,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: pack.stripePriceId, quantity: 1 }],
    mode: "payment",
    success_url: `${appUrl}/dashboard/settings?tab=billing&tokens=success&pack=${pack.id}`,
    cancel_url: `${appUrl}/dashboard/settings?tab=billing&tokens=canceled`,
    metadata: {
      workspaceId,
      tokenPackId: pack.id,
      creditsToAdd: String(pack.credits),
      type: "token_pack",
    },
  });
}
