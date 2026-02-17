import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { z } from "zod/v4";
import { log } from "@/lib/logger";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const QuoteDetectionSchema = z.object({
  is_quote: z
    .boolean()
    .describe("Whether the message is an out-of-context quote"),
  confidence: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
  extracted_quote: z
    .nullable(z.string())
    .describe("The extracted quote text, or null"),
  attributed_to: z
    .nullable(z.string())
    .describe("Who the quote is attributed to, or null"),
});

const QuoteDetectionWithStyleSchema = z.object({
  is_quote: z
    .boolean()
    .describe("Whether the message is an out-of-context quote"),
  confidence: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
  extracted_quote: z
    .nullable(z.string())
    .describe("The extracted quote text, or null"),
  attributed_to: z
    .nullable(z.string())
    .describe("Who the quote is attributed to, or null"),
  selected_style_id: z
    .string()
    .describe(
      "The ID of the art style best suited for this quote's visual representation",
    ),
});

export interface StyleOption {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

export interface QuoteDetectionResult {
  isQuote: boolean;
  confidence: number;
  extractedQuote: string | null;
  attributedTo: string | null;
  selectedStyleId: string | null;
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

Use the classify_quote tool to return your classification.`;

const NOT_QUOTE: QuoteDetectionResult = {
  isQuote: false,
  confidence: 1,
  extractedQuote: null,
  attributedTo: null,
  selectedStyleId: null,
};

async function detectWithAnthropic(
  messageText: string,
  systemPrompt: string,
  schema: typeof QuoteDetectionSchema | typeof QuoteDetectionWithStyleSchema,
  useStyleSelection: boolean,
  model: string,
): Promise<z.infer<typeof QuoteDetectionWithStyleSchema> | null> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 256,
    system: systemPrompt,
    tools: [
      {
        name: "classify_quote",
        description:
          "Classify whether a Slack message is an out-of-context quote" +
          (useStyleSelection ? " and select the best art style for it" : ""),
        input_schema: z.toJSONSchema(schema) as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: "classify_quote" },
    messages: [
      {
        role: "user",
        content: `Message to classify:\n"""\n${messageText}\n"""`,
      },
    ],
  });

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolBlock) {
    log.warn("detectQuote: no tool_use block in Anthropic response");
    return null;
  }

  log.info(`detectQuote: raw tool input=${JSON.stringify(toolBlock.input)}`);
  return toolBlock.input as z.infer<typeof QuoteDetectionWithStyleSchema>;
}

async function detectWithOpenAI(
  messageText: string,
  systemPrompt: string,
  schema: typeof QuoteDetectionSchema | typeof QuoteDetectionWithStyleSchema,
  useStyleSelection: boolean,
  model: string,
): Promise<z.infer<typeof QuoteDetectionWithStyleSchema> | null> {
  const response = await openai.chat.completions.create({
    model,
    max_tokens: 256,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Message to classify:\n"""\n${messageText}\n"""`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "classify_quote",
          description:
            "Classify whether a Slack message is an out-of-context quote" +
            (useStyleSelection ? " and select the best art style for it" : ""),
          parameters: z.toJSONSchema(schema) as Record<string, unknown>,
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "classify_quote" } },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    log.warn("detectQuote: no function tool_call in OpenAI response");
    return null;
  }

  log.info(
    `detectQuote: raw function arguments=${toolCall.function.arguments}`,
  );
  return JSON.parse(toolCall.function.arguments) as z.infer<
    typeof QuoteDetectionWithStyleSchema
  >;
}

export async function detectQuote(
  messageText: string,
  availableStyles?: StyleOption[],
  model?: string,
): Promise<QuoteDetectionResult> {
  const llmModel = model || "claude-haiku-4-5-20251001";

  // Check for explicit Slack blockquote syntax (> text)
  const blockquoteLines = messageText
    .split("\n")
    .filter((line) => line.startsWith("&gt; ") || line.startsWith("> "))
    .map((line) => line.replace(/^(?:&gt;|>) /, ""));
  const hasExplicitBlockquote =
    blockquoteLines.length > 0 && blockquoteLines.join(" ").trim().length > 0;
  const blockquoteText = blockquoteLines.join("\n").trim();

  // Pre-filters (skip for explicit blockquotes)
  if (!hasExplicitBlockquote) {
    const wordCount = messageText.trim().split(/\s+/).length;
    if (wordCount < 3) return NOT_QUOTE;
    if (messageText.length > 280) return NOT_QUOTE;

    // Check for emoji-only messages
    const emojiOnlyRegex =
      /^[\s\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]*$/u;
    if (emojiOnlyRegex.test(messageText)) return NOT_QUOTE;
  }

  const useStyleSelection = availableStyles && availableStyles.length > 0;

  let systemPrompt = SYSTEM_PROMPT;
  if (useStyleSelection) {
    const styleList = availableStyles
      .map((s) => `- ${s.id}: ${s.displayName} — ${s.description}`)
      .join("\n");
    systemPrompt += `\n\nIf the message IS a quote, also select the art style that best matches the tone, subject matter, and humor of the quote. Consider what visual style would make the funniest or most fitting illustration.

Available styles:
${styleList}`;
  }

  const schema = useStyleSelection
    ? QuoteDetectionWithStyleSchema
    : QuoteDetectionSchema;

  log.info(`detectQuote: calling ${llmModel} for text="${messageText}"`);

  const isOpenAI = llmModel.startsWith("gpt-");
  const rawData = isOpenAI
    ? await detectWithOpenAI(
        messageText,
        systemPrompt,
        schema,
        !!useStyleSelection,
        llmModel,
      )
    : await detectWithAnthropic(
        messageText,
        systemPrompt,
        schema,
        !!useStyleSelection,
        llmModel,
      );

  if (!rawData) {
    return {
      isQuote: false,
      confidence: 0,
      extractedQuote: null,
      attributedTo: null,
      selectedStyleId: null,
    };
  }

  const parsed = schema.safeParse(rawData);

  if (!parsed.success) {
    log.warn(
      `detectQuote: Zod validation failed: ${JSON.stringify(parsed.error.issues)}`,
    );
    return {
      isQuote: false,
      confidence: 0,
      extractedQuote: null,
      attributedTo: null,
      selectedStyleId: null,
    };
  }

  const data = parsed.data as z.infer<typeof QuoteDetectionWithStyleSchema>;
  const result: QuoteDetectionResult = {
    isQuote:
      hasExplicitBlockquote ||
      (data.is_quote === true && data.confidence >= 0.5),
    confidence: hasExplicitBlockquote ? 1 : data.confidence,
    extractedQuote: hasExplicitBlockquote
      ? blockquoteText
      : data.extracted_quote,
    attributedTo: data.attributed_to,
    selectedStyleId: data.selected_style_id ?? null,
  };

  log.info(
    `detectQuote: parsed result isQuote=${result.isQuote} confidence=${result.confidence}` +
      (result.selectedStyleId
        ? ` selectedStyle=${result.selectedStyleId}`
        : ""),
  );

  return result;
}
