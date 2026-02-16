import Stripe from "stripe";

export {
  INFINITY,
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
    allow_promotion_codes: true,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${appUrl}/dashboard/settings/billing?success=true`,
    cancel_url: `${appUrl}/dashboard/settings/billing?canceled=true`,
    metadata: { workspaceId },
  });
}

export async function createCustomerPortalSession(customerId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/settings/billing`,
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
    id: "PACK_10",
    name: "10 Images",
    credits: 10,
    priceUsd: 4.99,
    priceCents: 499,
    pricePerImage: "$0.50",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_10 || "",
  },
  {
    id: "PACK_25",
    name: "25 Images",
    credits: 25,
    priceUsd: 9.99,
    priceCents: 999,
    pricePerImage: "$0.40",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_25 || "",
  },
  {
    id: "PACK_50",
    name: "50 Images",
    credits: 50,
    priceUsd: 14.99,
    priceCents: 1499,
    pricePerImage: "$0.30",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_50 || "",
  },
  {
    id: "PACK_100",
    name: "100 Images",
    credits: 100,
    priceUsd: 24.99,
    priceCents: 2499,
    pricePerImage: "$0.25",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_100 || "",
  },
  {
    id: "PACK_250",
    name: "250 Images",
    credits: 250,
    priceUsd: 49.99,
    priceCents: 4999,
    pricePerImage: "$0.20",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_250 || "",
  },
  {
    id: "PACK_500",
    name: "500 Images",
    credits: 500,
    priceUsd: 74.99,
    priceCents: 7499,
    pricePerImage: "$0.15",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_500 || "",
  },
  {
    id: "PACK_1000",
    name: "1000 Images",
    credits: 1000,
    priceUsd: 119.99,
    priceCents: 11999,
    pricePerImage: "$0.12",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_1000 || "",
  },
  {
    id: "PACK_2000",
    name: "2000 Images",
    credits: 2000,
    priceUsd: 199.99,
    priceCents: 19999,
    pricePerImage: "$0.10",
    stripePriceId: process.env.STRIPE_PRICE_TOKEN_2000 || "",
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
    allow_promotion_codes: true,
    line_items: [{ price: pack.stripePriceId, quantity: 1 }],
    mode: "payment",
    success_url: `${appUrl}/dashboard/settings/billing?tokens=success&pack=${pack.id}`,
    cancel_url: `${appUrl}/dashboard/settings/billing?tokens=canceled`,
    metadata: {
      workspaceId,
      tokenPackId: pack.id,
      creditsToAdd: String(pack.credits),
      type: "token_pack",
    },
  });
}
