# No Context - AI Pipeline Spec

## Overview

The AI pipeline has two stages:

1. **Quote Detection** — Determine if a Slack message is an intentional out-of-context quote
2. **Image Generation** — Create an artistic illustration of the quote

---

## Stage 1: Quote Detection (Claude)

### Model

- **Claude 3.5 Haiku** — fast, cheap, good enough for classification
- Fallback: Claude 3.5 Sonnet if Haiku produces too many false positives/negatives

### Prompt Design

```
You are a classifier for a Slack bot in a #no-context channel.

A #no-context channel is where people post funny, absurd, or confusing
quotes taken out of context from real conversations. The humor comes from
how strange the quote sounds without its original context.

Your job: determine if the following Slack message is an intentional
out-of-context quote.

CLASSIFY AS QUOTE (true):
- A sentence or phrase that sounds absurd, funny, or confusing without context
- Typically in quotation marks or attributed to someone (e.g., "— Sarah" or "- Mike")
- May reference mundane topics in a bizarre way
- Short, punchy statements that clearly came from a real conversation

CLASSIFY AS NOT A QUOTE (false):
- Regular conversation messages ("hey has anyone seen the new feature?")
- Links, images, or file shares with no quote text
- Bot messages or automated posts
- Questions directed at the channel ("what's for lunch?")
- Meta-discussion about the channel itself
- Very long messages (multiple paragraphs) — real no-context quotes are short
- Messages that are clearly jokes/memes rather than overheard quotes

Respond with JSON only:
{
  "is_quote": boolean,
  "confidence": number (0-1),
  "extracted_quote": string | null,
  "attributed_to": string | null
}

Message to classify:
"""
{message_text}
"""
```

### Decision Threshold

- `is_quote: true` AND `confidence >= 0.7` → proceed to image generation
- `is_quote: true` AND `confidence < 0.7` → skip (too ambiguous)
- `is_quote: false` → skip

### Edge Cases

- **Quoted messages** (Slack's built-in quote formatting): Treat the quoted text as the message
- **Messages with emoji only**: Skip — not a quote
- **Messages under 3 words**: Skip — too short to be meaningful
- **Messages over 280 characters**: Skip — likely not a no-context quote (they're punchy)
- **Thread replies**: Skip entirely — only process top-level channel messages

---

## Stage 2: Image Generation

### Provider Options

**Primary: OpenAI DALL-E 3**

- Quality: High
- Cost: ~$0.04 (standard) / ~$0.08 (HD)
- Speed: 5-15 seconds
- Good at interpreting text prompts with artistic styles

**Alternative: Stable Diffusion (via Replicate or self-hosted)**

- Cost: ~$0.01-0.03/image
- More control over models and styles
- Can use fine-tuned models for specific art styles

**Recommendation**: Start with DALL-E 3 for quality and simplicity. Evaluate Stable Diffusion later for cost optimization.

### Image Prompt Construction

```
Create a {art_style} illustration inspired by this quote: "{extracted_quote}"

The image should:
- Capture the humor or absurdity of the quote
- Be whimsical and lighthearted
- Not contain any text or words in the image
- Be suitable for a workplace setting (no violence, explicit content)
- Use {art_style_details}

Style: {art_style_full_description}
```

### Art Styles

Each style has a name, description, and detailed prompt modifier:

| Style ID       | Display Name                  | Prompt Modifier                                                                                                        |
| -------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `watercolor`   | Watercolor (Default)          | "soft watercolor painting with gentle washes of color, loose brushstrokes, and white paper showing through"            |
| `picasso`      | Picasso / Cubism              | "cubist painting in the style of Pablo Picasso, with geometric shapes, multiple perspectives, and bold outlines"       |
| `vangogh`      | Van Gogh / Post-Impressionist | "painting in the style of Vincent van Gogh, with swirling brushstrokes, vivid colors, and emotional intensity"         |
| `monet`        | Monet / Impressionist         | "impressionist painting in the style of Claude Monet, with soft light, dappled colors, and atmospheric effects"        |
| `warhol`       | Warhol / Pop Art              | "pop art print in the style of Andy Warhol, with bright flat colors, bold outlines, and repeated motifs"               |
| `hokusai`      | Hokusai / Ukiyo-e             | "Japanese woodblock print in the style of Hokusai, with flowing lines, flat color areas, and dynamic composition"      |
| `dali`         | Dali / Surrealism             | "surrealist painting in the style of Salvador Dali, with melting forms, dreamlike landscapes, and impossible physics"  |
| `mondrian`     | Mondrian / De Stijl           | "abstract geometric composition in the style of Piet Mondrian, with primary colors, black grid lines, and white space" |
| `basquiat`     | Basquiat / Neo-Expressionism  | "raw neo-expressionist painting in the style of Jean-Michel Basquiat, with bold marks, crowns, and street art energy"  |
| `rockwell`     | Rockwell / Americana          | "Norman Rockwell-style illustration with warm Americana charm, detailed characters, and storytelling composition"      |
| `miyazaki`     | Miyazaki / Studio Ghibli      | "Studio Ghibli-style illustration with lush environments, whimsical characters, and a sense of wonder"                 |
| `comic`        | Comic Book                    | "vibrant comic book panel with bold ink lines, halftone dots, dynamic angles, and speech bubbles"                      |
| `pixel`        | Pixel Art                     | "detailed pixel art scene with a limited color palette, clean pixel placement, and retro video game aesthetic"         |
| `sketch`       | Pencil Sketch                 | "detailed pencil sketch with cross-hatching, varying line weights, and expressive shading on white paper"              |
| `stainedglass` | Stained Glass                 | "stained glass window design with bold black leading lines, jewel-toned translucent colors, and radiant light"         |

### Custom Styles (Team+ tiers)

Users on Team tier and above can write their own style description, stored as a custom style:

- Max 200 characters
- Prefixed with safety prompt: "Create a workplace-appropriate illustration in the following style: {user_style}"
- Moderated: if Claude flags the custom style as inappropriate, reject it

### Image Specifications

- **Resolution**: 1024x1024 (square — works well in Slack)
- **Format**: PNG
- **Storage**: Upload to Vercel Blob Storage, store URL in database
- **Slack upload**: Use Slack's `files.uploadV2` API to upload directly to the thread

### Content Safety

- DALL-E 3 has built-in content moderation
- Additionally, the quote detection prompt filters out inappropriate content
- If image generation is rejected by the provider's safety filter:
  - Retry once with a softened prompt (remove potentially triggering words)
  - If still rejected, reply with text only: "This quote was too powerful for art. It's been saved to your gallery as text-only."

### Processing Queue

- Use a job queue (Bull/BullMQ with Redis, or a simple Postgres-backed queue)
- Jobs contain: workspace_id, channel_id, message_ts, quote_text, art_style, user_id
- Priority queue: Business tier jobs processed first
- Max concurrent jobs per workspace: 3
- Job timeout: 60 seconds
- Failed jobs: retry once, then mark as failed and notify in thread

---

## API Cost Estimates Per Image

| Component                                  | Cost        |
| ------------------------------------------ | ----------- |
| Quote detection (Haiku)                    | ~$0.003     |
| Image generation (DALL-E 3 standard)       | ~$0.04      |
| Image storage (Vercel Blob)                | ~$0.0001    |
| **Total per generated image**              | **~$0.043** |
| Total per skipped message (detection only) | ~$0.003     |

At Team tier ($29/mo, 100 images): $4.30 COGS → ~85% gross margin.
