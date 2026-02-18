# LinkedIn Ad Campaign: Make Your Slack Workspace Fun

## Campaign Overview

| Field        | Value                                        |
| ------------ | -------------------------------------------- |
| Platform     | LinkedIn                                     |
| Objective    | Conversions (Slack installs)                 |
| Budget       | ~$300/mo                                     |
| Landing page | nocontextbot.com                             |
| Format       | Single Image 1200x628                        |
| Naming       | `LI_Conv_HR-PeopleManagers_SlackFun_Default` |

## Target Audience

HR departments, people managers, team leads, people ops, culture leads — anyone responsible for keeping teams happy and engaged.

**LinkedIn targeting:**

- Job functions: Human Resources, People Operations
- Job titles: People Manager, HR Manager, Team Lead, Head of People, Culture Lead, Office Manager
- Interests: Employee engagement, team building, workplace culture
- Company size: 50-5000 (big enough for Slack, small enough to care about fun)

## Core Message

**Make your Slack workspace fun.** No Context Bot turns your team's funniest quotes into AI-generated paintings. Zero effort. Instant morale.

## Ad Copy (LinkedIn post text, paired with each image)

All ads link to **nocontextbot.com** with CTA button **"Learn More"**

---

## Ad 1: `01-make-slack-fun.html`

**Angle:** The hook — make Slack fun
**Headline on image:** Make your Slack workspace actually fun.
**Subtext on image:** Funny quotes go in. AI paintings come out.
**Visual:** Left: headline + subtext + logo. Right: 3 tilted gallery cards (duck-ghibli, goat-cubism, plants-watercolor) with slight rotations, showing the art output.
**LinkedIn post text:** Your team already says hilarious things at work. No Context Bot turns those quotes into AI-generated paintings — automatically. Install it in your Slack workspace and watch the magic happen. Free to start.

## Ad 2: `02-quote-to-art.html`

**Angle:** Show the transformation
**Headline on image:** From Slack quote to masterpiece.
**Visual:** Left: mini Slack message mockup with a funny quote in Georgia italic. Right: the generated art (raccoon-pixel). Arrow or visual transition between them. Logo bottom-left.
**LinkedIn post text:** "The raccoon is in the server room again." Your team said it. No Context Bot painted it. Install in 60 seconds, works with any Slack workspace.

## Ad 3: `03-zero-effort.html`

**Angle:** No work for the manager
**Headline on image:** Install once. Fun forever.
**Subtext on image:** No Context Bot does the rest.
**Visual:** Big headline with "once" in purple skewed highlight. Row of 5 small art thumbnails below. Logo bottom-left.
**LinkedIn post text:** Looking for a team morale win that doesn't require planning a single event? No Context Bot watches your #no-context channel and turns quotes into art. Set it up in a minute. Never think about it again.

## Ad 4: `04-morale-boost.html`

**Angle:** Morale / engagement language for HR
**Headline on image:** The easiest morale boost you'll ever ship.
**Subtext on image:** Your team's quotes, turned into art.
**Visual:** Left: headline + subtext. Right: Slack thread mockup — user posts quote, bot replies with art (love-popart). Emoji reactions visible. Logo bottom-left.
**LinkedIn post text:** Employee engagement doesn't have to mean another survey or offsite. No Context Bot turns your team's funniest Slack moments into AI art. It's the culture win nobody asked for — but everyone loves.

## Ad 5: `05-20-styles.html`

**Angle:** Visual variety stops the scroll
**Headline on image:** 20+ art styles. Powered by your team.
**Visual:** 3x2 grid of gallery images with slight rotations and style label badges (Ghibli, Cubism, Pixel Art, Pop Art, Watercolor, Van Gogh). Logo bottom-left.
**LinkedIn post text:** Van Gogh. Pixel art. Studio Ghibli. Pop art. Your team's out-of-context quotes deserve better than a text channel. No Context Bot turns them into paintings in 20+ styles. Free to try.

---

## Design Specs

- Dimensions: 1200x628px (body style), exported at 2x
- Background: #fafaf8 (cream)
- Borders: 2px solid #1A1A1A
- Shadows: shadow-[4px_4px_0px_0px_#1A1A1A]
- Primary accent: #7C3AED (purple)
- Light accent: #EDE9FE
- Muted text: #4A4A4A
- Font: Inter (Google Fonts CDN), Georgia italic for quotes
- Tailwind CDN for styling
- Logo (logo-with-bot.png) on every ad, small, bottom-left
- No QR codes
- Text under 20% of image area

## Screenshot Script Update

- Read width/height from each HTML file's body style
- Remove hardcoded WIDTH/HEIGHT constants
- Pass dimensions to setViewport per-file

## Campaign Strategy

**With $300/mo on LinkedIn:**

- Run 1 campaign, 1 ad set, all 5 ads rotating
- Let LinkedIn optimize delivery for conversions
- After 2 weeks, pause bottom 2 performers, keep top 3
- Refresh creative monthly to avoid fatigue
- Expected: $5-12 CPC on LinkedIn for this audience
