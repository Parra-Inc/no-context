# No Context - Pricing & Subscriptions

## Pricing Philosophy

Price by **posts per month** (generated images), not by seats. This aligns cost with value delivered and keeps the barrier to entry low. Most `#no-context` channels get 10-50 posts/month depending on company size, so tiers should reflect that.

## Plans

| | Free | Starter | Team | Business |
|---|---|---|---|---|
| **Monthly** | $0 | $9 | $29 | $79 |
| **Annual (per month)** | $0 | $7 | $24 | $66 |
| **Images/month** | 5 | 25 | 100 | 500 |
| **Channels** | 1 | 1 | 3 | Unlimited |
| **Art styles** | Default watercolor | 5 styles | All 15+ styles | All 15+ styles |
| **Image size** | 1024x1024 | 1792x1024 | 1792x1024 | 1792x1024 |
| **Aspect ratio options** | Square only | Square only | 3 presets | All presets |
| **Watermark** | Yes (URL/logo/QR) | No | No | No |
| **Custom style prompts** | — | — | Yes | Yes |
| **Weekly digest** | — | — | Yes | Yes |
| **Custom brand watermark** | — | — | — | Yes |
| **API access** | — | — | — | Yes |
| **Priority generation** | — | — | — | Yes |
| **CSV export** | — | — | — | Yes |
| **History** | 7 days | Full | Full | Full |
| **Download images** | — | Yes | Yes | Yes |

### Free - $0/month

- **5 generated images/month**
- 1 connected channel
- Default art style only (watercolor)
- Lower quality images: 1024x1024 (half the size of paid tiers)
- Images include "Made with No Context" watermark (URL, logo, or QR code)
- 7-day image history in dashboard
- **Purpose**: Let teams try it out and get hooked

### Starter - $9/month

- **25 generated images/month**
- 1 connected channel
- 5 art style options
- Full resolution: 1792x1024
- No watermark
- Full image history in dashboard
- Download images
- **Purpose**: Small teams / low-traffic channels

### Team - $29/month

- **100 generated images/month**
- 3 connected channels
- All art styles (15+)
- Custom style prompts (write your own style description)
- Full gallery with search and favorites
- Weekly digest message in Slack (top quotes of the week)
- **Purpose**: Active teams, the sweet spot

### Business - $79/month

- **500 generated images/month**
- Unlimited connected channels
- Everything in Team
- Custom brand watermark option
- API access for embedding gallery
- Priority image generation (faster queue)
- CSV export of quotes and metadata
- **Purpose**: Large companies, multiple teams

## Annual Pricing (2 months free)

| Tier | Monthly | Annual (total) | Annual (per month) | Savings |
|------|---------|---------------|-------------------|---------|
| Starter | $9 | $84 | $7 | $24/yr |
| Team | $29 | $288 | $24 | $60/yr |
| Business | $79 | $792 | $66 | $156/yr |

## Aspect Ratio Presets

Users can choose from predefined aspect ratios when generating images via a Slack dropdown or dashboard setting. This controls the DALL-E `size` parameter.

| Preset | Dimensions | Use Case |
|--------|-----------|----------|
| Square | 1024x1024 | Profile-style, simple compositions |
| Landscape | 1792x1024 | Default panoramic format |
| Portrait | 1024x1792 | Tall/vertical compositions |

- **Free & Starter**: Square (1024x1024) only
- **Team**: Square, Landscape, Portrait
- **Business**: All presets (same as Team today, but future-proofed for additional ratios)

The workspace default can be set in the dashboard. Individual users can override per-generation if they reply to the bot or use a slash command.

## Overage Handling

- When a workspace hits its monthly limit, the bot reacts with a custom emoji (`:no-context-limit:`) instead of generating an image
- The bot posts a single notification: "This workspace has used all its No Context generations for the month. Upgrade at [dashboard link]"
- No automatic overage charges — hard cap, upgrade to continue
- Unused posts do NOT roll over

## Billing

- Monthly billing via Stripe
- Annual option: 2 months free
- 14-day free trial of Team tier for new signups (no credit card required)
- Stripe Customer Portal for self-service plan changes, cancellation, invoice history

## Stripe Implementation

- Use Stripe Checkout for initial subscription
- Use Stripe Customer Portal for management
- Stripe Webhooks to sync subscription status:
  - `checkout.session.completed` — activate subscription
  - `customer.subscription.updated` — plan changes
  - `customer.subscription.deleted` — cancellation
  - `invoice.payment_failed` — grace period (3 days), then downgrade to Free
- See [stripe-setup.md](stripe-setup.md) for product IDs, price IDs, and webhook setup

## Image Generation Costs (DALL-E 3, Standard Quality)

| Size | Cost per Image | Notes |
|------|---------------|-------|
| 1792x1024 (landscape) | $0.080 | Panoramic format |
| 1024x1792 (portrait) | $0.080 | Vertical format, same cost as landscape |
| 1024x1024 (square) | $0.040 | Square, half the cost |

Based on real usage: $1.92 for 24 generations at 1792x1024 = **$0.08/image** (confirmed).

Free tier at 1024x1024: **$0.04/image** (50% cost reduction).

### Other Per-Generation Costs

| Service | Cost | Notes |
|---------|------|-------|
| Claude Haiku (quote detection) | ~$0.003/message | Runs on every eligible Slack message |
| Total COGS per image (paid) | ~$0.08–0.09 | Image gen + API overhead |
| Total COGS per image (free) | ~$0.04–0.05 | Smaller image + API overhead |

## Margin Analysis

| Tier | Revenue/image | Cost/image | Margin |
|------|--------------|------------|--------|
| Free | $0.00 | ~$0.04 | -$0.04 (acquisition cost) |
| Starter | $0.36 ($9 / 25) | ~$0.08 | $0.28 (78%) |
| Team | $0.29 ($29 / 100) | ~$0.08 | $0.21 (72%) |
| Business | $0.16 ($79 / 500) | ~$0.08 | $0.08 (50%) |

### Free Tier Monthly Cost

- 5 images × $0.04 = **$0.20/workspace/month**
- With watermark (URL, logo, or QR code overlay)
- 7-day history retention only
