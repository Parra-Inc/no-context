import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "./prisma";

const RESERVED_SLUGS = new Set([
  // Auth & app routes
  "signin",
  "signup",
  "login",
  "logout",
  "register",
  "auth",
  "onboarding",
  "workspaces",
  "dashboard",
  "checkout",
  "admin",

  // API & system
  "api",
  "_next",
  "static",
  "public",
  "assets",
  "favicon",

  // Marketing & legal
  "pricing",
  "contact",
  "support",
  "blog",
  "terms",
  "privacy",
  "about",
  "help",
  "docs",
  "changelog",
  "careers",
  "press",
  "security",
  "status",

  // Common vanity slugs
  "app",
  "www",
  "mail",
  "email",
  "billing",
  "settings",
  "account",
  "profile",
  "home",
  "new",
  "create",
  "edit",
  "delete",
  "search",
  "explore",
  "feed",
  "notifications",
  "messages",
  "invite",
  "join",
  "team",
  "teams",
  "org",
  "organization",
  "workspace",
  "null",
  "undefined",
  "404",
  "500",
]);

export function slugifyName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 48) || "workspace"
  );
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugifyName(name);

  // If the base slug isn't reserved, try it directly
  if (!RESERVED_SLUGS.has(base)) {
    const existing = await prisma.workspace.findUnique({
      where: { slug: base },
    });
    if (!existing) return base;
  }

  // Increment suffix: base-1, base-2, etc.
  for (let i = 1; i <= 100; i++) {
    const candidate = `${base}-${i}`;
    if (RESERVED_SLUGS.has(candidate)) continue;
    const found = await prisma.workspace.findUnique({
      where: { slug: candidate },
    });
    if (!found) return candidate;
  }

  return `${base}-${Date.now()}`;
}

export async function assertWorkspace(userId: string, slugOrId: string) {
  const workspace = slugOrId.startsWith("c")
    ? // cuid IDs start with 'c'
      ((await prisma.workspace.findUnique({ where: { id: slugOrId } })) ??
      (await prisma.workspace.findUnique({ where: { slug: slugOrId } })))
    : await prisma.workspace.findUnique({ where: { slug: slugOrId } });

  if (!workspace) {
    redirect("/workspaces");
  }

  const workspaceUser = await prisma.workspaceUser.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: workspace.id,
      },
    },
  });

  if (!workspaceUser) {
    redirect("/workspaces");
  }

  return { workspace, workspaceUser };
}

export async function getUserWorkspaces(userId: string) {
  return prisma.workspaceUser.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          slug: true,
          slackTeamName: true,
          slackTeamIcon: true,
          onboardingCompleted: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function autoLinkSlackWorkspace(
  userId: string,
  slackTeamId: string,
) {
  const workspace = await prisma.workspace.findUnique({
    where: { slackTeamId },
  });

  if (!workspace) return;

  await prisma.workspaceUser.upsert({
    where: {
      userId_workspaceId: { userId, workspaceId: workspace.id },
    },
    create: {
      userId,
      workspaceId: workspace.id,
      role: "member",
      isDefault: true,
    },
    update: {},
  });
}

export async function getWorkspaceFromRequest(userId: string): Promise<string> {
  const hdrs = await headers();
  const workspaceId = hdrs.get("x-workspace-id");

  if (!workspaceId) {
    throw new Error("Missing workspace");
  }

  const membership = await prisma.workspaceUser.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error("Not a member of this workspace");
  }

  return workspaceId;
}
