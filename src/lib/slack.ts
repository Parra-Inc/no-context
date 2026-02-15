import { WebClient } from "@slack/web-api";
import crypto from "crypto";
import { decrypt } from "./encryption";
import prisma from "./prisma";

const slackClients = new Map<string, WebClient>();

export function getSlackClient(encryptedToken: string): WebClient {
  const token = decrypt(encryptedToken);

  if (!slackClients.has(token)) {
    slackClients.set(token, new WebClient(token));
  }

  return slackClients.get(token)!;
}

export function verifySlackSignature(
  signingSecret: string,
  requestBody: string,
  timestamp: string,
  signature: string,
): boolean {
  // Reject requests older than 5 minutes
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp, 10) < fiveMinutesAgo) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${requestBody}`;
  const mySignature =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(sigBasestring, "utf8")
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(mySignature, "utf8"),
    Buffer.from(signature, "utf8"),
  );
}

export async function postThreadReply(
  client: WebClient,
  channel: string,
  threadTs: string,
  text: string,
  imageUrl?: string,
) {
  if (imageUrl) {
    // Download image to buffer — Slack uploadV2 expects binary data, not a URL
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await client.files.uploadV2({
      channel_id: channel,
      thread_ts: threadTs,
      initial_comment: text,
      file_uploads: [
        {
          file: buffer,
          filename: "no-context-art.png",
        },
      ],
    });
    return uploadResult;
  }

  return client.chat.postMessage({
    channel,
    thread_ts: threadTs,
    text,
  });
}

const SLACK_TOKEN_ERRORS = [
  "token_revoked",
  "token_expired",
  "invalid_auth",
  "account_inactive",
  "not_authed",
];

export function isSlackTokenError(error: unknown): boolean {
  if (error && typeof error === "object" && "data" in error) {
    const slackError = error as { data?: { error?: string } };
    return SLACK_TOKEN_ERRORS.includes(slackError.data?.error || "");
  }
  if (error instanceof Error) {
    return SLACK_TOKEN_ERRORS.some((code) => error.message.includes(code));
  }
  return false;
}

export async function markWorkspaceDisconnected(
  workspaceId: string,
): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { needsReconnection: true },
  });
}

export async function postToChannel(
  client: WebClient,
  channel: string,
  text: string,
  imageUrl?: string,
) {
  if (imageUrl) {
    // Download image to buffer — Slack uploadV2 expects binary data, not a URL
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await client.files.uploadV2({
      channel_id: channel,
      initial_comment: text,
      file_uploads: [
        {
          file: buffer,
          filename: "no-context-art.png",
        },
      ],
    });
    return uploadResult;
  }

  return client.chat.postMessage({
    channel,
    text,
  });
}

export async function addReaction(
  client: WebClient,
  channel: string,
  timestamp: string,
  emoji: string,
) {
  try {
    await client.reactions.add({
      channel,
      timestamp,
      name: emoji,
    });
  } catch {
    // Reaction may already exist — ignore
  }
}

export async function removeReaction(
  client: WebClient,
  channel: string,
  timestamp: string,
  emoji: string,
) {
  try {
    await client.reactions.remove({
      channel,
      timestamp,
      name: emoji,
    });
  } catch {
    // Reaction may not exist — ignore
  }
}
