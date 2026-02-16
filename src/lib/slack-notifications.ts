import { log } from "@/lib/logger";

const isProduction = process.env.NODE_ENV === "production";

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: Array<{
    type: string;
    text: string;
  }>;
}

async function sendSlackNotification(
  blocks: SlackBlock[],
  fallbackText: string,
): Promise<void> {
  if (!isProduction) {
    log.info(`[Slack Mock] ${fallbackText}`);
    return;
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    log.warn("SLACK_WEBHOOK_URL not configured, skipping notification");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fallbackText, blocks }),
    });

    if (!response.ok) {
      const body = await response.text();
      log.error(`Slack webhook failed (${response.status}): ${body}`);
    }
  } catch (err) {
    log.error(
      "Failed to send Slack notification",
      err instanceof Error ? err : undefined,
    );
  }
}

// ---------------------------------------------------------------------------
// New User Signup
// ---------------------------------------------------------------------------

interface NotifyNewUserSignupParams {
  userId: string;
  email: string;
  name: string | null;
}

export async function notifyNewUserSignup(
  params: NotifyNewUserSignupParams,
): Promise<void> {
  const { userId, email, name } = params;
  const displayName = name || email.split("@")[0];

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":tada: New User Signup",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${displayName}* just created an account`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Email:*\n${email}` },
        { type: "mrkdwn", text: `*Name:*\n${name || "Not provided"}` },
        { type: "mrkdwn", text: `*User ID:*\n\`${userId}\`` },
        { type: "mrkdwn", text: `*Method:*\nEmail/Password` },
      ],
    },
  ];

  await sendSlackNotification(
    blocks,
    `New user signup: ${displayName} (${email})`,
  );
}

// ---------------------------------------------------------------------------
// New Workspace
// ---------------------------------------------------------------------------

interface NotifyNewWorkspaceParams {
  workspaceId: string;
  workspaceSlug: string;
  slackTeamName: string;
  slackTeamIcon: string | null;
  installedByEmail: string | null;
}

export async function notifyNewWorkspace(
  params: NotifyNewWorkspaceParams,
): Promise<void> {
  const {
    workspaceId,
    workspaceSlug,
    slackTeamName,
    slackTeamIcon,
    installedByEmail,
  } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nocontextbot.com";

  const iconPrefix = slackTeamIcon ? `${slackTeamIcon} ` : "";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":rocket: New Workspace Installation",
        emoji: true,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${iconPrefix}*${slackTeamName}* just installed No Context!`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Team:*\n${slackTeamName}` },
        {
          type: "mrkdwn",
          text: `*Installed by:*\n${installedByEmail ? `<mailto:${installedByEmail}|${installedByEmail}>` : "_Unknown_"}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Workspace ID:*\n\`${workspaceId}\`` },
        {
          type: "mrkdwn",
          text: `*Dashboard:*\n<${appUrl}/${workspaceSlug}|View>`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Installed at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
        },
      ],
    },
  ];

  await sendSlackNotification(blocks, `New workspace: ${slackTeamName}`);
}

// ---------------------------------------------------------------------------
// Subscription Purchase
// ---------------------------------------------------------------------------

interface NotifySubscriptionPurchaseParams {
  workspaceId: string;
  teamName: string;
  tier: string;
  priceId: string;
}

export async function notifySubscriptionPurchase(
  params: NotifySubscriptionPurchaseParams,
): Promise<void> {
  const { workspaceId, teamName, tier, priceId } = params;
  const interval = priceId.toLowerCase().includes("annual")
    ? "Annual"
    : "Monthly";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":credit_card: New Subscription",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${teamName}* subscribed to the *${tier}* plan!`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Workspace:*\n${teamName}` },
        { type: "mrkdwn", text: `*Tier:*\n${tier}` },
        { type: "mrkdwn", text: `*Billing:*\n${interval}` },
        { type: "mrkdwn", text: `*Workspace ID:*\n\`${workspaceId}\`` },
      ],
    },
  ];

  await sendSlackNotification(
    blocks,
    `New subscription: ${teamName} → ${tier} (${interval})`,
  );
}

// ---------------------------------------------------------------------------
// Token Pack Purchase
// ---------------------------------------------------------------------------

interface NotifyTokenPackPurchaseParams {
  workspaceId: string;
  teamName: string;
  packType: string;
  credits: number;
  amountCents: number;
}

export async function notifyTokenPackPurchase(
  params: NotifyTokenPackPurchaseParams,
): Promise<void> {
  const { workspaceId, teamName, packType, credits, amountCents } = params;
  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":package: Image Pack Purchased",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${teamName}* purchased an image pack`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Workspace:*\n${teamName}` },
        { type: "mrkdwn", text: `*Pack:*\n${packType}` },
        { type: "mrkdwn", text: `*Credits:*\n${credits}` },
        { type: "mrkdwn", text: `*Amount:*\n${amountFormatted}` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_Workspace ID: \`${workspaceId}\`_`,
      },
    },
  ];

  await sendSlackNotification(
    blocks,
    `Image pack purchased: ${teamName} — ${credits} credits (${amountFormatted})`,
  );
}

// ---------------------------------------------------------------------------
// Subscription Canceled
// ---------------------------------------------------------------------------

interface NotifySubscriptionCanceledParams {
  workspaceId: string;
  teamName: string;
}

export async function notifySubscriptionCanceled(
  params: NotifySubscriptionCanceledParams,
): Promise<void> {
  const { workspaceId, teamName } = params;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":warning: Subscription Canceled",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${teamName}* canceled their subscription and has been downgraded to the *FREE* plan`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Workspace:*\n${teamName}` },
        { type: "mrkdwn", text: `*Workspace ID:*\n\`${workspaceId}\`` },
      ],
    },
  ];

  await sendSlackNotification(blocks, `Subscription canceled: ${teamName}`);
}

// ---------------------------------------------------------------------------
// Contact / Feedback Form Submission
// ---------------------------------------------------------------------------

interface NotifyContactFormParams {
  name: string;
  email: string;
  subject?: string;
  message: string;
  submissionId: string;
}

export async function notifyContactFormSubmission(
  params: NotifyContactFormParams,
): Promise<void> {
  const { name, email, subject, message, submissionId } = params;

  const truncatedMessage =
    message.length > 2500 ? message.slice(0, 2500) + "…" : message;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ":incoming_envelope: New Contact Form Submission",
        emoji: true,
      },
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*From:*\n${name}` },
        { type: "mrkdwn", text: `*Email:*\n<mailto:${email}|${email}>` },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Subject:*\n${subject || "_No subject_"}`,
        },
        { type: "mrkdwn", text: `*ID:*\n\`${submissionId}\`` },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Message:*\n>>>${truncatedMessage}`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Submitted at <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
        },
      ],
    },
  ];

  await sendSlackNotification(
    blocks,
    `New contact form: ${name} (${email}) — ${subject || "No subject"}`,
  );
}
