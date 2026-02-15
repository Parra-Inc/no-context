export const mockStripe = {
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
  customers: { create: jest.fn() },
  subscriptions: { retrieve: jest.fn(), update: jest.fn() },
};

export const stripe = mockStripe;
export const TIER_QUOTAS = { FREE: 5, STARTER: 25, TEAM: 100, BUSINESS: 500 };
export const TIER_MAX_CHANNELS = {
  FREE: 1,
  STARTER: 1,
  TEAM: 3,
  BUSINESS: Infinity,
};
export const TIER_IMAGE_SIZE = {
  FREE: "1792x1024",
  STARTER: "1792x1024",
  TEAM: "1792x1024",
  BUSINESS: "1792x1024",
};
export const TIER_HAS_WATERMARK = {
  FREE: true,
  STARTER: false,
  TEAM: false,
  BUSINESS: false,
};
export const PRICE_IDS = {};
export const createCheckoutSession = jest.fn();
export const createCustomerPortalSession = jest.fn();
