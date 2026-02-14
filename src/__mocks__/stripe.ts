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
export const PRICE_IDS = {};
export const createCheckoutSession = jest.fn();
export const createCustomerPortalSession = jest.fn();
