import "dotenv/config";
import type { PrismaConfig } from "prisma";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://localhost:5432/nocontext";

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
} satisfies PrismaConfig;
