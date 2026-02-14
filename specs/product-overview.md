# No Context - Product Overview

## Vision

No Context is a Slack app that transforms random, out-of-context quotes from `#no-context` channels into AI-generated artwork. When someone posts a decontextualized quote, the bot detects it, generates a unique illustration in the style of a famous artist, and replies in-thread — turning office humor into shareable art.

## How It Works

1. **Install** — A workspace admin installs No Context via Slack and connects it to one or more `#no-context` channels.
2. **Post** — A team member posts a random quote (e.g., `"I don't think that's how microwaves work" — Sarah`).
3. **Detect** — The bot uses Claude to determine if the message is an intentional out-of-context quote (vs. a regular conversation message, link, or bot command).
4. **Generate** — If it's a valid quote, the bot generates an AI illustration based on the quote content, using a configured art style (e.g., "in the style of Picasso").
5. **Reply** — The bot replies in-thread with the generated image and a caption.

## Core Value Proposition

- Turns a beloved workplace tradition into something visual and collectible
- Zero friction — works passively in channels people already use
- Customizable art styles make each workspace's feed unique
- Dashboard provides a gallery of all generated art for the workspace

## Target Audience

- Tech companies, startups, and remote teams that already have `#no-context` or `#out-of-context` Slack channels
- Culture-focused teams that value humor and team bonding
- Companies with 20-500+ employees (sweet spot for active no-context channels)

## Key Differentiators

- AI-powered quote detection (not keyword matching) — understands intent
- Art generation with configurable famous-artist styles
- Per-workspace gallery and dashboard
- Subscription model tied to usage (posts/month), not seats
