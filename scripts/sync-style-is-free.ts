import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ART_STYLES } from "../src/lib/styles";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/nocontext",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Syncing isFree values for built-in styles...\n");

  for (const style of ART_STYLES) {
    const existing = await prisma.style.findFirst({
      where: { workspaceId: null, name: style.id },
    });

    if (!existing) {
      console.log(`  SKIP  ${style.id} — not found in database`);
      continue;
    }

    if (existing.isFree === style.isFree) {
      console.log(`  OK    ${style.id} — already isFree=${style.isFree}`);
      continue;
    }

    await prisma.style.update({
      where: { id: existing.id },
      data: { isFree: style.isFree },
    });

    console.log(
      `  FIXED ${style.id} — isFree: ${existing.isFree} → ${style.isFree}`,
    );
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
