import Anthropic from "@anthropic-ai/sdk";
import { log } from "@/lib/logger";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface QuoteDetectionResult {
  isQuote: boolean;
  confidence: number;
  extractedQuote: string | null;
  attributedTo: string | null;
}

const SYSTEM_PROMPT = `You are a classifier for a Slack bot in a #no-context channel.

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
}`;

export async function detectQuote(
  messageText: string,
): Promise<QuoteDetectionResult> {
  // Pre-filters
  const wordCount = messageText.trim().split(/\s+/).length;
  if (wordCount < 3) {
    return {
      isQuote: false,
      confidence: 1,
      extractedQuote: null,
      attributedTo: null,
    };
  }

  if (messageText.length > 280) {
    return {
      isQuote: false,
      confidence: 1,
      extractedQuote: null,
      attributedTo: null,
    };
  }

  // Check for emoji-only messages
  const emojiOnlyRegex = /^[\s\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]*$/u;
  if (emojiOnlyRegex.test(messageText)) {
    return {
      isQuote: false,
      confidence: 1,
      extractedQuote: null,
      attributedTo: null,
    };
  }

  log.info(`detectQuote: calling Anthropic API for text="${messageText}"`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Message to classify:\n"""\n${messageText}\n"""`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  log.info(`detectQuote: raw AI response="${text}"`);

  try {
    const parsed = JSON.parse(text);

    const result = {
      isQuote: parsed.is_quote === true && parsed.confidence >= 0.7,
      confidence: parsed.confidence,
      extractedQuote: parsed.extracted_quote || null,
      attributedTo: parsed.attributed_to || null,
    };

    log.info(
      `detectQuote: parsed result isQuote=${result.isQuote} confidence=${result.confidence}`,
    );

    return result;
  } catch {
    log.warn(`detectQuote: failed to parse AI response as JSON: "${text}"`);
    // If Claude returns invalid JSON, treat as not a quote
    return {
      isQuote: false,
      confidence: 0,
      extractedQuote: null,
      attributedTo: null,
    };
  }
}
