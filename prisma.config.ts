import "dotenv/config";
import type { PrismaConfig } from "prisma";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://localhost:5433/nocontext";

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: "pnpm exec tsx prisma/seed.ts",
  },
} satisfies PrismaConfig;
