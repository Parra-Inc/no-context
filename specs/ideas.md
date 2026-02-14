# Product Ideas

A running list of feature ideas for future iterations. Nothing here is committed — just a place to capture thoughts.

## Instructions

- When an idea has been implemented, remove it from this list and add it to the respective spec document

## Engagement & Social

- **Cross-channel @mention generation** — if someone @mentions the bot in a different channel (not the designated quote channel), the bot generates art from the context of that thread and replies inline. The bot should be smart enough to infer what the user is referring to — whether it's the original post in the thread, the most recent reply, or a specific earlier comment — based on conversational cues and message proximity

- **Reactions & voting** — let people react to generated images in Slack, surface the most-loved ones
- **Leaderboard** — who gets quoted the most? Most popular art? Fun stats per workspace
- **"Quote of the week" auto-post** — beyond the weekly digest, crown a single winner and post it prominently
- **"Quote of the week" admin pick** — let an admin manually select a quote as the "Quote of the Week" from the dashboard; featured quote gets highlighted in the gallery, pinned in the Slack channel, and included in the weekly digest with a special badge. Paid tiers also get an auto-select option that automatically picks the top-voted or most-reacted quote of the week if no manual selection is made
- **Share to social** — one-click share to Twitter/LinkedIn with a branded watermark
- **Anonymous mode** — option to strip the author name so people feel safer posting spicy quotes
- **Quote nominations** — let users nominate someone else's message as a quote with a slash command or emoji shortcut, so it's not just self-serve
- **Daily prompt** — post a fun question each morning ("What's your hot take on tabs vs spaces?") to spark quotable responses
- **Quote remixes** — let users submit an alternate phrasing or follow-up to an existing quote, displayed alongside the original

## Art & Generation

- **Style roulette** — random style per quote for workspaces that can't decide
- **Multi-panel art** — combine 2-3 quotes from the same day into a comic strip
- **Animated art** — short looping video/gif output for select styles
- **Community styles** — let users submit and share custom style prompts across workspaces
- **Seasonal styles** — auto-rotate holiday/seasonal themes (spooky October, cozy December, etc.)
- **Regenerate** — button to re-roll the art if the first generation wasn't great
- **Style mashups** — combine two styles ("Ghibli meets Pixel Art")
- **Before/after toggle** — show the raw quote text side-by-side with the generated art so viewers get the full context
- **Art style preview grid** — when choosing a style, show a thumbnail preview of the same quote rendered in each available style

## Platform & Integrations

- **Microsoft Teams support** — expand beyond Slack
- **Discord support** — lots of communities would use this
- **Private channel support** — currently public only, on the roadmap
- **Mobile app** — browse the gallery, share favorites, get notifications
- **Slack app home tab** — gallery and settings right inside Slack without leaving
- **API access** — let teams programmatically submit quotes or pull gallery data
- **Webhook notifications** — notify external systems when new art is generated
- **Notion integration** — auto-sync the gallery to a Notion database so teams can embed it in their wiki
- **Google Chat support** — expand to Google Workspace-heavy orgs

## Stats & Analytics

- **Total generations** — all-time count of generated images for the workspace
- **Last 24 hours** — number of generations in the past day
- **Last 7 days** — generation count for the past week
- **Last 30 days** — generation count for the past month
- **Last 365 days** — generation count for the past year
- **Trend sparklines** — small inline charts showing generation volume over time
- **Per-user stats** — who generates the most quotes, who gets the most reactions
- **Peak hours** — heatmap of when quotes are most frequently captured
- **Style breakdown** — pie/bar chart of which art styles are used most
- **Streak tracking** — longest streak of consecutive days with at least one generation
- **Monthly recap email** — auto-generated summary with top quotes, most active quoters, and favorite styles for the month
- **Team mood tracker** — lightweight sentiment analysis on quotes over time, surfaced as a fun vibe-check chart (not HR-serious, just playful)

## Dashboard & Gallery

- **Physical prints** — order framed prints of favorites, shipped to the office
  - **How it works:** user picks a favorite generation from the gallery, selects frame size/style, enters a shipping address, and we route the order to a print-on-demand fulfillment provider. No inventory needed — prints are produced and shipped per order.
  - **Possible APIs / providers:**
    - [Prodigi (Pwinty)](https://www.prodigi.com/print-api/) — global print API with explicit framed print support, live order tracking, branded email notifications. Free to integrate; pay per order. Strong developer docs and webhooks for order status updates.
    - [Printful](https://www.printful.com/api) — RESTful JSON API, wide product catalog including framed posters and canvas prints. Warehouses in US, EU, and globally. Mockup generator API for previewing frames before ordering.
    - [Artelo](https://www.artelo.io/artelo-api) — art-focused print API with bulk product configuration for framed/unframed prints. Good fit since our product is art-centric.
    - [Gooten](https://www.gooten.com/) — print-on-demand with API access, competitive international shipping rates, and a broad frame/canvas catalog.
  - **Implementation considerations:**
    - Upload high-res source image (store original resolution at generation time, not just the Slack-optimized version)
    - Offer 2-3 frame sizes (8x10, 12x16, 18x24) and frame colors (black, white, natural)
    - Use provider mockup APIs to show a preview before purchase
    - Payments via Stripe checkout session tied to the user's workspace billing
    - Margin opportunity: mark up provider cost by 30-50%
    - Shipping address collection + order tracking surfaced in the dashboard
  - **Tier:** paid feature (Team or Enterprise plans)
- **Screensaver / digital frame mode** — cycle through the gallery on a TV in the office
- **Slideshow for all-hands** — auto-generate a "best of" presentation for team meetings
- **Calendar view** — see quotes by day/week/month
- **Collections** — group favorites into themed collections
- **Search by quote text** — full-text search across all quotes
- **Bulk download** — export all images as a zip
- **Favorites list** — let individual users heart/bookmark generations into a personal favorites list they can revisit
- **Embed widget** — small embeddable snippet that shows the latest or top quote art on an internal site or README

## Settings & Customization

- **Art style preference** — workspace-level default style so every quote matches the team's vibe
- **Posting schedule** — configure when quotes get posted (immediate, batched daily, specific time of day)
- **Quiet hours** — suppress quote posts during weekends, holidays, or off-hours
- **Channel routing** — choose which channels quotes get posted to vs. which channels are monitored
- **NSFW / content filter level** — adjustable sensitivity for what gets flagged or auto-rejected
- **Quote frequency cap** — limit how many quotes per day/week to avoid spamming the channel
- **Language preference** — set a preferred language for captions or overlaid text on art
- **Digest settings** — toggle weekly digest on/off, choose day and time, pick digest format (top 3, top 5, full list)
- **Auto-attribution toggle** — workspace or user-level choice to always show or always hide the quote author
- **Notification preferences** — per-user control over DM notifications (new art, reactions, weekly digest)
- **Approval workflow** — require an admin to approve quotes before they become art (useful for larger orgs)
- **Custom branding** — upload a workspace logo or watermark to overlay on generated images
- **Default image resolution** — choose between faster low-res or slower high-res generation
- **Opt-out list** — let individual users opt out of having their messages picked up as quotes

## Monetization & Growth

- **Referral program** — give credits for referring other workspaces
- **Gift plans** — buy a plan for another team
- **Free trial of Team tier** — let people try premium styles before committing
- **Enterprise plan** — SSO, custom SLAs, dedicated support, unlimited channels
- **White-label** — let companies rebrand it as their own internal tool

## Upcoming Features

- **Quote over image** — overlay the quote text, author name, and avatar directly on the generated image
- **Save quote metadata** — persist the quote text, author, and avatar image to the database
- **Paginated dashboard** — show all generations in the dashboard with pagination
- **Regenerate with prompt** — regenerate a quote's image with optional additional instructions via a popover text box
- **Regenerate with new style** — choose a different art style when regenerating
- **Regeneration threading** — regenerated images are posted as comments on the original thread
- **Thread responses** — option to respond to a quote in a thread
- **Custom channel name** — ability to rename/update the channel name to whatever the user wants
- **Public generations** — ability to make individual generations public
- **Sharing** — generate a share link and/or download link for a generation
- **Download image** — ability to download the generated image directly
- **Search quotes** — search through quotes in the table view
- **Filter by style/author** — filter the table by art style or who said the quote
- **Explore page** — browse any public generations (author names hidden); requires safety filter
- **Safety filter** — check content on the way in; flag unsafe content so it never appears publicly
- **Microsoft Teams support** — expand beyond Slack to Teams (and potentially other platforms)

## Fun / Experimental

- **Quote-to-merch** — auto-generate t-shirt/mug mockups from the best quotes
- **AI quote detection tuning** — let admins flag false positives/negatives to improve detection
- **Throwback Thursday** — automatically resurface a memorable quote every Thursday
  - **How it works:** On a configurable schedule (default: every Thursday morning), the bot picks a past quote and reposts it to the channel with a "Throwback Thursday" label and the original generated art
  - **Smart selection using Slack reactions:** Rather than picking randomly, query the Slack API (`reactions.get`) for older quotes and rank candidates by total reaction count. Quotes with the most emoji reactions are the best throwback material since the team already validated them as memorable
  - **Candidate criteria:**
    - Quote must be at least 4 weeks old (configurable minimum age) to feel like a genuine throwback
    - Quote must have status `COMPLETED` with a generated image
    - Avoid repeating a throwback within a rolling window (e.g., don't resurface the same quote within 6 months)
    - Optionally weight toward quotes that are 3-6+ months old for maximum nostalgia
  - **Selection algorithm:**
    1. Pull candidate quotes from the database older than the minimum age threshold
    2. Batch-fetch reaction counts from the Slack API for each candidate (cache results to stay within rate limits)
    3. Score candidates: `reaction_count * age_bonus` where older quotes get a small multiplier to favor deeper throwbacks
    4. Pick from the top N candidates with some randomness (weighted random) so it doesn't always post the #1 most-reacted quote
  - **Posting format:** Repost the original image with context like _"Throwback Thursday — originally said by @user on Mar 12, 2025"_ along with the original quote text
  - **Storage:** Track which quotes have been used as throwbacks (new `ThrowbackPost` model or a `lastThrowbackAt` field on Quote) to prevent repeats
  - **Settings:** Workspace-level toggle to enable/disable, choose day of week, choose time, set minimum quote age, and set the channel to post to
  - **Future enhancement:** If/when reactions are persisted to the database (see "Reactions & voting" idea above), switch from Slack API lookups to a simple database query for much faster candidate ranking
- **Quote chains** — detect when quotes are thematically related and link them
- **Office bingo** — predict common phrases, mark them off when they appear as quotes
- **Year in review** — auto-generated end-of-year highlight reel with superlatives ("Most Quoted", "Best Art", "Spiciest Take")
- **Onboarding highlight reel** — curate a "best of" collection that new hires get linked to on their first day so they can learn the team's personality
- **Caption contest** — post a generated image without the quote and let the team guess or write captions, reveal the real quote later
