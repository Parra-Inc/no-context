import prisma from "@/lib/prisma";

/**
 * Find or create a User record for a Slack identity.
 *
 * Resolution order:
 *  1. Match by slackUserId
 *  2. Match by email (and link the Slack identity)
 *  3. Create a new user
 *
 * When called from the OAuth install callback, pass `botToken` so the
 * function can fetch the installer's profile from Slack to obtain their
 * email.  When called from the NextAuth JWT callback the email is
 * already available from the OIDC profile, so pass it directly.
 */
export async function findOrCreateUserBySlack({
  slackUserId,
  email,
  name,
  botToken,
}: {
  slackUserId: string;
  email?: string | null;
  name?: string | null;
  botToken?: string;
}): Promise<{ id: string } | null> {
  // 1. Existing user by Slack ID
  const bySlack = await prisma.user.findUnique({
    where: { slackUserId },
  });
  if (bySlack) return bySlack;

  // 2. If we don't have an email yet, try to fetch it from Slack
  let resolvedEmail = email?.toLowerCase() ?? null;
  let resolvedName = name ?? null;

  if (!resolvedEmail && botToken) {
    const userInfo = await fetchSlackUserInfo(slackUserId, botToken);
    if (userInfo) {
      resolvedEmail = userInfo.email;
      resolvedName = resolvedName ?? userInfo.name;
    }
  }

  if (!resolvedEmail) {
    return null;
  }

  // 3. Existing user by email → link Slack identity
  const byEmail = await prisma.user.findUnique({
    where: { email: resolvedEmail },
  });

  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { slackUserId },
    });
  }

  // 4. Create new user
  return prisma.user.create({
    data: {
      email: resolvedEmail,
      slackUserId,
      name: resolvedName,
    },
  });
}

async function fetchSlackUserInfo(
  slackUserId: string,
  botToken: string,
): Promise<{ email: string; name: string | null } | null> {
  const res = await fetch(
    `https://slack.com/api/users.info?${new URLSearchParams({ user: slackUserId })}`,
    { headers: { Authorization: `Bearer ${botToken}` } },
  );
  const data = await res.json();

  if (!data.ok || !data.user?.profile?.email) {
    console.error(
      "Failed to fetch Slack user info:",
      data.error ?? "no email on profile",
    );
    return null;
  }

  return {
    email: data.user.profile.email.toLowerCase(),
    name: data.user.real_name || data.user.name || null,
  };
}
