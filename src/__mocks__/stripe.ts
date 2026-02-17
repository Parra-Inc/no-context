export const mockStripe = {
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
  customers: { create: jest.fn() },
  subscriptions: { retrieve: jest.fn(), update: jest.fn() },
};

export const stripe = mockStripe;
export const TIER_QUOTAS = {
  FREE: 3,
  STARTER: 25,
  TEAM: 100,
  BUSINESS: 500,
  ENTERPRISE: 2000,
};
export const INFINITY = 999999;
export const TIER_MAX_CHANNELS = {
  FREE: 1,
  STARTER: 1,
  TEAM: 3,
  BUSINESS: INFINITY,
  ENTERPRISE: INFINITY,
};
export const TIER_IMAGE_SIZE = {
  FREE: "1792x1024",
  STARTER: "1792x1024",
  TEAM: "1792x1024",
  BUSINESS: "1792x1024",
  ENTERPRISE: "1792x1024",
};
export const TIER_HAS_WATERMARK = {
  FREE: true,
  STARTER: false,
  TEAM: false,
  BUSINESS: false,
  ENTERPRISE: false,
};
export const PRICE_IDS = {};
export const createCheckoutSession = jest.fn();
export const createCustomerPortalSession = jest.fn();
export const TOKEN_PACKS = [
  {
    id: "PACK_10",
    name: "10 Images",
    credits: 10,
    priceUsd: 4.99,
    priceCents: 499,
    pricePerImage: "$0.50",
    stripePriceId: "price_test_10",
  },
  {
    id: "PACK_25",
    name: "25 Images",
    credits: 25,
    priceUsd: 9.99,
    priceCents: 999,
    pricePerImage: "$0.40",
    stripePriceId: "price_test_25",
  },
  {
    id: "PACK_50",
    name: "50 Images",
    credits: 50,
    priceUsd: 14.99,
    priceCents: 1499,
    pricePerImage: "$0.30",
    stripePriceId: "price_test_50",
  },
  {
    id: "PACK_100",
    name: "100 Images",
    credits: 100,
    priceUsd: 24.99,
    priceCents: 2499,
    pricePerImage: "$0.25",
    stripePriceId: "price_test_100",
  },
  {
    id: "PACK_250",
    name: "250 Images",
    credits: 250,
    priceUsd: 49.99,
    priceCents: 4999,
    pricePerImage: "$0.20",
    stripePriceId: "price_test_250",
  },
  {
    id: "PACK_500",
    name: "500 Images",
    credits: 500,
    priceUsd: 74.99,
    priceCents: 7499,
    pricePerImage: "$0.15",
    stripePriceId: "price_test_500",
  },
  {
    id: "PACK_1000",
    name: "1000 Images",
    credits: 1000,
    priceUsd: 119.99,
    priceCents: 11999,
    pricePerImage: "$0.12",
    stripePriceId: "price_test_1000",
  },
  {
    id: "PACK_2000",
    name: "2000 Images",
    credits: 2000,
    priceUsd: 199.99,
    priceCents: 19999,
    pricePerImage: "$0.10",
    stripePriceId: "price_test_2000",
  },
];
export const createTokenPackCheckoutSession = jest.fn();
