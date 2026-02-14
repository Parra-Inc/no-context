import Stripe from "stripe";

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
};

export const TIER_QUOTAS: Record<string, number> = {
  FREE: 5,
  STARTER: 25,
  TEAM: 100,
  BUSINESS: 500,
};

export const TIER_MAX_CHANNELS: Record<string, number> = {
  FREE: 1,
  STARTER: 1,
  TEAM: 3,
  BUSINESS: Infinity,
};

export const TIER_IMAGE_SIZE: Record<string, string> = {
  FREE: "1792x1024",
  STARTER: "1792x1024",
  TEAM: "1792x1024",
  BUSINESS: "1792x1024",
};

export const TIER_HAS_WATERMARK: Record<string, boolean> = {
  FREE: true,
  STARTER: false,
  TEAM: false,
  BUSINESS: false,
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
