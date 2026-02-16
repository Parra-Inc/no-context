import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "./prisma";

const RESERVED_SLUGS = new Set([
  "signin",
  "auth",
  "api",
  "admin",
  "onboarding",
  "workspaces",
  "checkout",
  "pricing",
  "contact",
  "support",
  "blog",
  "terms",
  "privacy",
  "_next",
  "dashboard",
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
  let slug = slugifyName(name);

  if (RESERVED_SLUGS.has(slug)) {
    slug = `${slug}-team`;
  }

  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (!existing) return slug;

  for (let i = 1; i <= 100; i++) {
    const candidate = `${slug}-${i}`;
    const found = await prisma.workspace.findUnique({
      where: { slug: candidate },
    });
    if (!found) return candidate;
  }

  return `${slug}-${Date.now()}`;
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
