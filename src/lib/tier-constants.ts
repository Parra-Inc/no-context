export const INFINITY = 999999;

export const TIER_QUOTAS: Record<string, number> = {
  FREE: 5,
  STARTER: 25,
  TEAM: 100,
  BUSINESS: 500,
  ENTERPRISE: 2000,
};

export const TIER_MAX_CHANNELS: Record<string, number> = {
  FREE: 1,
  STARTER: 1,
  TEAM: 3,
  BUSINESS: INFINITY,
  ENTERPRISE: INFINITY,
};

export const TIER_IMAGE_SIZE: Record<string, string> = {
  FREE: "1792x1024",
  STARTER: "1792x1024",
  TEAM: "1792x1024",
  BUSINESS: "1792x1024",
  ENTERPRISE: "1792x1024",
};

export const TIER_HAS_WATERMARK: Record<string, boolean> = {
  FREE: true,
  STARTER: false,
  TEAM: false,
  BUSINESS: false,
  ENTERPRISE: false,
};

export const TIER_PRIORITY: Record<string, number> = {
  BUSINESS: 1,
  TEAM: 2,
  STARTER: 3,
  FREE: 4,
};
