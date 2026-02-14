# No Context - Marketing Page Spec

## Overview

A single-page marketing site at `nocontextbot.com` (or similar). Optimized for conversion — the goal is to get visitors to click "Add to Slack."

This is part of the same Next.js app (public routes, no auth required).

## Target Audiences

### Primary: HR / People Ops / Culture Leads

- People who manage Slack channels and care about team culture
- Looking for low-effort ways to boost morale and engagement
- Value prop: "Give your team a reason to laugh together every day — no planning required"
- They're the buyers and installers

### Secondary: Individual Contributors (Quote Posters)

- The people who actually post in #no-context channels
- Already doing this organically — No Context rewards the behavior with art
- Value prop: "Your quotes are already hilarious. Now they're art."
- They drive organic word-of-mouth and push for adoption

---

## Page Sections (Top to Bottom)

---

### 1. Navigation Bar

```
┌─────────────────────────────────────────────────────┐
│  [Logo: No Context]     How It Works  Styles        │
│                         Pricing  FAQ    [Sign In]   │
└─────────────────────────────────────────────────────┘
```

- Sticky on scroll
- Logo left, links center, Sign In right
- "Add to Slack" button appears in nav after scrolling past the hero CTA
- Mobile: hamburger menu

---

### 2. Hero Section

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│          The funniest Slack channel                  │
│          just got an upgrade.                        │
│                                                     │
│    Every out-of-context quote your team posts        │
│    becomes a one-of-a-kind AI-generated painting.    │
│    Boost morale. No meetings required.               │
│                                                     │
│    [Add to Slack — Free to Start]                    │
│                                                     │
│    ┌───────────────────────────────────────┐         │
│    │                                       │         │
│    │  [HERO IMAGE / ANIMATION]             │         │
│    │                                       │         │
│    │  Mock Slack UI showing:               │         │
│    │                                       │         │
│    │  #no-context                          │         │
│    │  ┌──────────────────────────────┐     │         │
│    │  │ 👤 Sarah Chen    2:34 PM     │     │         │
│    │  │ "I'm not saying it was       │     │         │
│    │  │  aliens, but it was          │     │         │
│    │  │  definitely the intern"      │     │         │
│    │  │  — Mike, Engineering         │     │         │
│    │  │                              │     │         │
│    │  │  🎨 reacted by No Context    │     │         │
│    │  │                              │     │         │
│    │  │  ↳ 🤖 No Context  2:34 PM   │     │         │
│    │  │    [Beautiful Van Gogh       │     │         │
│    │  │     style painting of        │     │         │
│    │  │     the scene]               │     │         │
│    │  └──────────────────────────────┘     │         │
│    │                                       │         │
│    └───────────────────────────────────────┘         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Copy:**

- Headline: **"The funniest Slack channel just got an upgrade."**
- Subheadline: "Every out-of-context quote your team posts becomes a one-of-a-kind AI-generated painting. Boost morale. No meetings required."
- CTA: "Add to Slack — Free to Start"
- Hero visual: Static or lightly animated mock of a Slack channel showing a quote → bot reaction → thread reply with generated art. Should look like a real Slack screenshot but polished.

**Why this works:**

- "Funniest Slack channel" — immediately resonates with anyone who has a #no-context channel
- "Boost morale. No meetings required." — speaks directly to HR/culture leads who are tired of forced fun
- Showing the actual Slack UI makes it instantly understandable

---

### 3. Social Proof / Traction Bar

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Turning office humor into art for teams everywhere │
│                                                     │
│  [stat] quotes illustrated  ·  [stat] workspaces    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Early stage (pre-launch): replace with a single testimonial quote or skip entirely
- Post-launch: live counter of total quotes illustrated + workspace count
- Later: company logos

---

### 4. How It Works

Three steps. Clean, visual, simple. Each step has an icon/illustration and a short description.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              How It Works                            │
│                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │              │ │              │ │              ││
│  │  [icon:      │ │  [icon:      │ │  [icon:      ││
│  │   #channel]  │ │   quote]     │ │   painting]  ││
│  │              │ │              │ │              ││
│  │  1. Set up   │ │  2. Drop a   │ │  3. Get art  ││
│  │  your        │ │  quote       │ │              ││
│  │  channel     │ │              │ │              ││
│  │              │ │              │ │              ││
│  │  Create a    │ │  Hear        │ │  No Context  ││
│  │  #no-context │ │  something   │ │  turns it    ││
│  │  channel in  │ │  hilarious   │ │  into a      ││
│  │  Slack and   │ │  at work?    │ │  unique      ││
│  │  install No  │ │  Post the    │ │  painting    ││
│  │  Context.    │ │  quote.      │ │  and replies ││
│  │  Takes 2     │ │  That's it.  │ │  in the      ││
│  │  minutes.    │ │              │ │  thread.     ││
│  │              │ │              │ │  Seconds     ││
│  │              │ │              │ │  later.      ││
│  └──────────────┘ └──────────────┘ └──────────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Step 1: Set up your channel**

> Create a #no-context channel in Slack and install No Context. Takes 2 minutes.

**Step 2: Drop a quote**

> Hear something hilarious at work? Post the quote. That's it.

**Step 3: Get art**

> No Context turns it into a unique painting and replies in the thread. Seconds later.

**Design notes:**

- Horizontal layout on desktop, vertical stack on mobile
- Each step connected by a subtle arrow or dotted line
- Icons should be playful but clean — line art or simple illustrations, not emoji

---

### 5. The Morale Section

Shows what the product actually does for teams — turns throwaway Slack moments into something worth keeping.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│         Your team's best lines deserve              │
│         better than a Slack thread.                 │
│                                                     │
│  Every team has a #no-context channel. It's the     │
│  best part of Slack. But the quotes just scroll     │
│  away.                                              │
│                                                     │
│  No Context turns them into generated art. Pin      │
│  them, print them, put them on the office wall.     │
│                                                     │
│  ┌────────────────────────────────────────────┐     │
│  │  [Grid of 6 example generated images,      │     │
│  │   each with the quote overlaid at bottom,  │     │
│  │   showing variety of styles and quotes]     │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Copy:**

- Headline: **"Your team's best lines deserve better than a Slack thread."**
- Body: "Every team has a #no-context channel. It's the best part of Slack. But the quotes just scroll away.\n\nNo Context turns them into generated art. Pin them, print them, put them on the office wall."

**Why this works:**

- States the problem directly — quotes get lost in Slack
- Short and concrete — no fluff
- Pairs with a grid of example images that show the product

---

### 6. Art Styles Showcase

Interactive section where visitors can see the same quote rendered in different styles.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│        Choose your team's aesthetic.                 │
│                                                     │
│  Pick from 15+ art styles      │
│                                                     │
│  [Watercolor*] [Picasso] [Van Gogh] [Pop Art]       │
│  [Hokusai] [Dali] [Ghibli] [Pixel Art] [Sketch]    │
│  [Basquiat] [Mondrian] [Rockwell] [Comic]           │
│  [Stained Glass] [Impressionist]                    │
│                                                     │
│  * = currently selected                             │
│                                                     │
│  ┌───────────────────────────────────────┐          │
│  │                                       │          │
│  │  [Large preview image of quote        │          │
│  │   rendered in the selected style]     │          │
│  │                                       │          │
│  │  "The printer is on fire again and    │          │
│  │   honestly I think it's personal"     │          │
│  │   — Jeff, Operations                  │          │
│  │                                       │          │
│  └───────────────────────────────────────┘          │
│                                                     │
│  Style: Watercolor — Soft washes of color with      │
│  loose brushstrokes and dreamy edges.               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Clicking a style tab swaps the preview image (pre-generated, not live)
- All previews use the same quote so you can compare styles
- Below the image: style name + one-line description
- On mobile: styles become a horizontal scrollable pill list

---

### 7. Example Gallery

A curated grid of the best examples — different quotes, different styles. This is the "wow" section.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│               See it in action.                     │
│                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │        │ │        │ │        │ │        │      │
│  │ [img]  │ │ [img]  │ │ [img]  │ │ [img]  │      │
│  │        │ │        │ │        │ │        │      │
│  │"I told │ │"That's │ │"The    │ │"Why is │      │
│  │ you    │ │ not a  │ │ server │ │ there  │      │
│  │ not to │ │feature"│ │ is     │ │ a duck │      │
│  │ touch  │ │— PM    │ │ just   │ │ in the │      │
│  │ prod"  │ │        │ │ vibes" │ │ server │      │
│  │— CTO   │ │ Pop Art│ │— DevOps│ │ room?" │      │
│  │        │ │        │ │        │ │— CEO   │      │
│  │ Cubism │ │        │ │Hokusai │ │        │      │
│  └────────┘ └────────┘ └────────┘ │Ghibli  │      │
│                                   └────────┘      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │  ...   │ │  ...   │ │  ...   │ │  ...   │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- 8-12 examples in a masonry or uniform grid
- Each card: image, quote text, attribution, style name
- Hover effect: slight zoom on image
- These should be pre-generated with intentionally funny quotes that feel authentic
- Mix of departments (Engineering, Sales, HR, Marketing, CEO) to show it's for the whole company

**Example quotes to pre-generate:**

1. "I told you not to touch production on a Friday" — CTO
2. "That's not a feature, that's a cry for help" — Product Manager
3. "The server is just vibes at this point" — DevOps
4. "Why is there a duck in the server room?" — CEO
5. "I don't think that's how microwaves work" — Intern
6. "We should just delete everything and start over" — Senior Engineer
7. "The printer is haunted and I have evidence" — Office Manager
8. "My code works and I'm choosing not to question it" — Junior Dev
9. "Can we circle back to why there's a goat on the Zoom call?" — HR
10. "I'll fix it in post" — Designer

---

### 8. Features Section

Two-column layout: feature list on left, rotating screenshots on right.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Everything happens automatically.                  │
│                                                     │
│  ┌─────────────────────┐ ┌────────────────────┐    │
│  │                     │ │                    │    │
│  │ Smart Detection     │ │  [Screenshot of    │    │
│  │ AI knows the        │ │   feature in       │    │
│  │ difference between  │ │   action — rotates │    │
│  │ a real quote and    │ │   as user hovers   │    │
│  │ regular chat. No    │ │   feature items]   │    │
│  │ keywords. No tags.  │ │                    │    │
│  │ Just post.          │ │                    │    │
│  │                     │ │                    │    │
│  │ 15+ Art Styles      │ │                    │    │
│  │ From Picasso to     │ │                    │    │
│  │ Pixel Art. Set a    │ │                    │    │
│  │ default or let each │ │                    │    │
│  │ channel have its    │ │                    │    │
│  │ own vibe.           │ │                    │    │
│  │                     │ │                    │    │
│  │ Quote Gallery       │ │                    │    │
│  │ Every generated     │ │                    │    │
│  │ image saved to a    │ │                    │    │
│  │ searchable gallery. │ │                    │    │
│  │ Favorite the best   │ │                    │    │
│  │ ones. Download and  │ │                    │    │
│  │ share them.         │ │                    │    │
│  │                     │ │                    │    │
│  │ Zero Maintenance    │ │                    │    │
│  │ Install once. It    │ │                    │    │
│  │ runs itself. No     │ │                    │    │
│  │ commands to learn,  │ │                    │    │
│  │ no triggers to set  │ │                    │    │
│  │ up. It just works.  │ │                    │    │
│  │                     │ │                    │    │
│  └─────────────────────┘ └────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features with copy:**

**Smart Detection**

> AI knows the difference between a real quote and regular chat. No keywords. No tags. Just post.

**15+ Art Styles**

> From Picasso to Pixel Art. Set a default or let each channel have its own vibe.

**Quote Gallery**

> Every generated image saved to a searchable dashboard. Favorite the best ones. Download and share.

**Zero Maintenance**

> Install once. It runs itself. No commands to learn, no triggers to set up. It just works.

**Weekly Digest** (Team plan)

> Get a roundup of the week's best quotes delivered to your channel every Friday.

**Custom Styles** (Team plan)

> Write your own style prompt. "In the style of a 90s cereal box" — sure, why not.

---

### 9. Pricing Section

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              Simple, transparent pricing.            │
│      Pay for what you create, not per seat.          │
│                                                     │
│  [Monthly]  [Annual — Save 17%]                     │
│                                                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│  │           │ │           │ │ POPULAR   │ │           │
│  │  Free     │ │  Starter  │ │  Team     │ │  Business │
│  │           │ │           │ │           │ │           │
│  │  $0/mo    │ │  $9/mo    │ │  $29/mo   │ │  $79/mo   │
│  │           │ │           │ │           │ │           │
│  │  5 images │ │  25 images│ │ 100 images│ │ 500 images│
│  │  1 channel│ │  1 channel│ │ 3 channels│ │ Unlimited │
│  │  1 style  │ │  5 styles │ │ All styles│ │ All styles│
│  │  Watermark│ │  No wmk   │ │ Custom    │ │ Custom    │
│  │  7-day    │ │  Full     │ │ Full      │ │ Full      │
│  │  history  │ │  history  │ │ history   │ │ history   │
│  │           │ │  Download │ │ Download  │ │ Download  │
│  │           │ │           │ │ Weekly    │ │ Weekly    │
│  │           │ │           │ │ digest    │ │ digest    │
│  │           │ │           │ │ Custom    │ │ Custom    │
│  │           │ │           │ │ prompts   │ │ prompts   │
│  │           │ │           │ │           │ │ API access│
│  │           │ │           │ │           │ │ Priority  │
│  │           │ │           │ │           │ │ queue     │
│  │           │ │           │ │           │ │ CSV export│
│  │           │ │           │ │           │ │           │
│  │ [Get      │ │[Start     │ │[Try Free  │ │[Start     │
│  │  Started] │ │ Free]     │ │ 14 Days]  │ │ Free]     │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘
│                                                     │
│  All plans include AI quote detection, Slack        │
│  integration, and dashboard access. No per-seat     │
│  pricing — your whole team uses it.                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Pricing headline:** "Simple, transparent pricing."
**Subheadline:** "Pay for what you create, not per seat."

Key copy decisions:

- Emphasize "not per seat" — this is unusual for Slack apps and a selling point
- Team tier highlighted with "POPULAR" badge and a subtle border/glow
- All CTAs say "Start Free" or "Try Free 14 Days" — remove friction
- Bottom note: "No per-seat pricing — your whole team uses it."
- Annual toggle shows savings inline (e.g., "$24/mo billed annually")

---

### 10. FAQ Section

Accordion-style. Questions answered in a conversational, friendly tone.

**What is a #no-context channel?**

> It's a Slack channel where people post funny quotes they overhear at work — completely stripped of context. "I can't believe the hamster survived" hits different when you have no idea what meeting that came from. Many companies already have one. If yours doesn't, you're about to start one.

**How does the AI know it's a real quote?**

> We use AI to understand the intent of each message. It can tell the difference between someone dropping a hilarious out-of-context quote and someone asking "what's for lunch?" No keywords, no special formatting needed. Just post naturally.

**Do we need to already have a #no-context channel?**

> Nope! You can create one as part of setup. In fact, installing No Context is a great excuse to start one. People will start posting once they see the art being generated.

**What happens when we hit our monthly limit?**

> The bot lets you know with a friendly message and stops generating images for the rest of the month. No surprise charges, ever. Unused images don't roll over. Upgrade anytime to keep the art flowing.

**Does our whole team need accounts?**

> No. One person installs it, everyone benefits. There's no per-seat pricing. Anyone in the connected Slack channel can post quotes and see generated art. The dashboard is accessible to the whole workspace.

**What art styles are available?**

> We have 15+ styles including Watercolor, Picasso (Cubism), Van Gogh, Pop Art, Hokusai, Dali, Studio Ghibli, Pixel Art, and more. On Team plans and above, you can write your own custom style prompts.

**Can I cancel anytime?**

> Yes. No contracts, no cancellation fees. Cancel from your dashboard and you'll keep access through the end of your billing period.

**Is our data private?**

> Absolutely. Your quotes and images are only accessible to your workspace. We don't share, sell, or use your quotes for training. You own your content.

**Does it work in private channels?**

> Currently No Context only works in public channels. Private channel support is on our roadmap.

**Can we use this for other channels besides #no-context?**

> Yes! It works in any channel where people post out-of-context quotes. Common channel names include #no-context, #out-of-context, #overheard, #random-quotes, and #things-people-say. Connect up to 3 channels on the Team plan.

---

### 11. Final CTA Section

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     Your team is already saying funny things.       │
│     Now they can be art.                            │
│                                                     │
│         [Add to Slack — It's Free]                  │
│                                                     │
│     Set up takes 2 minutes. No credit card          │
│     required.                                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Headline:** "Your team is already saying funny things. Now they can be art."
**CTA:** "Add to Slack — It's Free"
**Sub-CTA:** "Set up takes 2 minutes. No credit card required."

---

### 12. Footer

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  No Context                                         │
│                                                     │
│  Product        Company        Legal                │
│  Features       About          Privacy Policy       │
│  Pricing        Support        Terms of Service     │
│  Gallery        Contact                             │
│                                                     │
│  © 2026 No Context. Made with humor and vibes.         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Design Direction

### Color Palette

- **Background**: Clean white or very light warm gray (#FAFAF8) — let the art be the color
- **Text**: Near-black (#1A1A1A) for headings, dark gray (#4A4A4A) for body
- **Accent**: A warm violet/purple (#7C3AED) — creative, fun, not corporate
- **Secondary accent**: Soft coral (#F97066) for highlights and badges
- **Cards**: White with subtle shadow, rounded corners (12-16px radius)
- Dark mode: not needed for marketing page — keep it light and gallery-like

### Typography

- **Headings**: A display serif or rounded sans-serif — something with personality (e.g., "Cabinet Grotesk", "General Sans", or "Satoshi")
- **Body**: Clean sans-serif (Inter, or same as heading font in regular weight)
- **Quote text**: Italic serif for displayed quotes to make them feel like real quotes

### Visual Style

- Gallery-like: generous whitespace, images as the hero
- Rounded, friendly shapes — not sharp corporate edges
- Illustrations and icons should feel hand-drawn or painterly to match the art theme
- Every section should have at least one generated art example visible — the product IS the visual

### Animations

- Scroll-triggered fade-in / slide-up for sections (subtle, not distracting)
- Hero Slack mock: subtle typing animation → message appears → emoji reaction → thread reply with image fading in
- Art style selector: smooth crossfade between preview images
- Pricing toggle: smooth height transition between monthly/annual

### Responsive Behavior

- **Desktop** (1200px+): Full layout as wireframed above
- **Tablet** (768-1199px): 2-column grids become single column, features section stacks
- **Mobile** (<768px): Single column throughout, horizontal scroll for art styles, pricing cards stack vertically, hamburger nav

---

## SEO & Meta

- **Title**: "No Context — Turn Slack Quotes into AI Art"
- **Description**: "No Context is a Slack app that turns your team's funniest out-of-context quotes into AI-generated paintings. 15+ art styles. Zero effort. Boost team morale."
- **OG Image**: A 1200x630 collage showing 4-6 generated art examples with the No Context logo
- **Keywords**: no context slack, slack app, team culture, office quotes, AI art, workplace humor
- Structured data: SaaS product schema with pricing

---

## Pages (Beyond Landing)

- `/privacy` — Privacy policy
- `/terms` — Terms of service
- `/support` — Contact / support info (email + optional FAQ link)
