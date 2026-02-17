# Stripe Setup Guide

## Overview

No Context uses Stripe for subscription billing with three paid tiers: Starter, Team, and Business. Each tier has monthly and annual pricing.

## Pricing Tiers

| Tier     | Monthly | Annual (per month) | Images/mo | Channels  |
| -------- | ------- | ------------------ | --------- | --------- |
| Free     | $0      | $0                 | 3         | 1         |
| Starter  | $9      | $7 ($84/yr)        | 25        | 1         |
| Team     | $29     | $24 ($288/yr)      | 100       | 3         |
| Business | $79     | $66 ($792/yr)      | 500       | Unlimited |

## Stripe Resources (Test Mode)

### Products

| Product  | Stripe ID             |
| -------- | --------------------- |
| Starter  | `prod_TyQKzm8V64O2qP` |
| Team     | `prod_TyQKpETzNjzTBE` |
| Business | `prod_TyQKeAE7n8WmVQ` |

### Prices

| Price            | Stripe ID                        | Amount  |
| ---------------- | -------------------------------- | ------- |
| Starter Monthly  | `price_1T0TUSLZJUxFcJI8DvQIJqHa` | $9/mo   |
| Starter Annual   | `price_1T0TUULZJUxFcJI8tIieBAUg` | $84/yr  |
| Team Monthly     | `price_1T0TUWLZJUxFcJI8A5DcHuMc` | $29/mo  |
| Team Annual      | `price_1T0TUYLZJUxFcJI8RvWvXj0V` | $288/yr |
| Business Monthly | `price_1T0TUZLZJUxFcJI8D6LWhL9c` | $79/mo  |
| Business Annual  | `price_1T0TUbLZJUxFcJI8SXetTjkd` | $792/yr |

## Environment Variables

Add these to your `.env` file (see `.env.example`):

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_STARTER_MONTHLY=price_1T0TUSLZJUxFcJI8DvQIJqHa
STRIPE_PRICE_STARTER_ANNUAL=price_1T0TUULZJUxFcJI8tIieBAUg
STRIPE_PRICE_TEAM_MONTHLY=price_1T0TUWLZJUxFcJI8A5DcHuMc
STRIPE_PRICE_TEAM_ANNUAL=price_1T0TUYLZJUxFcJI8RvWvXj0V
STRIPE_PRICE_BUSINESS_MONTHLY=price_1T0TUZLZJUxFcJI8D6LWhL9c
STRIPE_PRICE_BUSINESS_ANNUAL=price_1T0TUbLZJUxFcJI8SXetTjkd
```

## Webhook Setup

### Local Development

Use the Stripe CLI to forward webhook events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET`.

### Production

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret to your production environment variables

## Going Live

When ready for production:

1. Switch to Stripe live mode keys
2. Create new products and prices in live mode (or use the Stripe Dashboard to copy test products)
3. Update all `STRIPE_*` environment variables with live values
4. Set up production webhook endpoint
5. Test the full checkout flow with a real card
