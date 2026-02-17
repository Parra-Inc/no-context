export const INFINITY = 999999;

export const TIER_QUOTAS: Record<string, number> = {
  FREE: 3,
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
  FREE: "512x512",
  STARTER: "1536x1024",
  TEAM: "1792x1024",
  BUSINESS: "1792x1024",
  ENTERPRISE: "1792x1024",
};

export const TIER_IMAGE_MODEL: Record<string, string> = {
  FREE: "dall-e-2",
  STARTER: "gpt-image-1",
  TEAM: "dall-e-3",
  BUSINESS: "dall-e-3",
  ENTERPRISE: "dall-e-3",
};

export const TIER_IMAGE_QUALITY: Record<string, string | null> = {
  FREE: null,
  STARTER: "medium",
  TEAM: "standard",
  BUSINESS: "hd",
  ENTERPRISE: "hd",
};

export const TIER_LLM_MODEL: Record<string, string> = {
  FREE: "gpt-4.1-nano",
  STARTER: "gpt-4.1-mini",
  TEAM: "claude-haiku-4-5-20251001",
  BUSINESS: "claude-sonnet-4-5-20250929",
  ENTERPRISE: "claude-sonnet-4-5-20250929",
};

export const TIER_IMAGE_QUALITY_LABEL: Record<string, string> = {
  FREE: "Basic",
  STARTER: "Enhanced",
  TEAM: "Premium",
  BUSINESS: "Premium HD",
  ENTERPRISE: "Premium HD",
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
