import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5433/nocontext",
});
const prisma = new PrismaClient({ adapter });

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 48) || "workspace"
  );
}

async function main() {
  // 1. Generate slugs for all workspaces that don't have one
  const allWs = await prisma.workspace.findMany();
  const workspaces = allWs.filter((ws) => !ws.slug);

  console.log(`Found ${workspaces.length} workspaces without slugs`);

  for (const ws of workspaces) {
    let slug = slugify(ws.slackTeamName);
    let existing = await prisma.workspace.findUnique({ where: { slug } });
    let attempt = 0;
    while (existing && existing.id !== ws.id) {
      attempt++;
      slug = `${slugify(ws.slackTeamName)}-${attempt}`;
      existing = await prisma.workspace.findUnique({ where: { slug } });
    }
    await prisma.workspace.update({
      where: { id: ws.id },
      data: { slug },
    });
    console.log(`  Workspace "${ws.slackTeamName}" → slug: "${slug}"`);
  }

  // 2. Create WorkspaceUser records from the old User→Workspace relationship
  // Since we already dropped the workspaceId column, we need to use the
  // installedByUserId on Workspace to create owner records
  const allWorkspaces = await prisma.workspace.findMany();
  // Re-fetch to get updated data

  for (const ws of allWorkspaces) {
    if (!ws.installedByUserId) continue;

    // Verify the user actually exists
    const user = await prisma.user.findUnique({
      where: { id: ws.installedByUserId },
    });
    if (!user) {
      console.log(
        `  Skipping: user ${ws.installedByUserId} not found for workspace ${ws.id}`,
      );
      continue;
    }

    const existing = await prisma.workspaceUser.findUnique({
      where: {
        userId_workspaceId: {
          userId: ws.installedByUserId,
          workspaceId: ws.id,
        },
      },
    });

    if (!existing) {
      await prisma.workspaceUser.create({
        data: {
          userId: ws.installedByUserId,
          workspaceId: ws.id,
          role: "owner",
          isDefault: true,
        },
      });
      console.log(
        `  Created WorkspaceUser: user ${ws.installedByUserId} → workspace ${ws.id} (owner)`,
      );
    } else {
      console.log(
        `  WorkspaceUser already exists: user ${ws.installedByUserId} → workspace ${ws.id}`,
      );
    }
  }

  console.log("\nMigration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
