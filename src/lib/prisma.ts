import { PrismaClient } from "@prisma/client";
import { createId, getModelPrefix } from "./id";

function createExtendedClient(base: PrismaClient) {
  return base.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const prefix = getModelPrefix(model);
          if (prefix && !(args.data as Record<string, unknown>).id) {
            (args.data as Record<string, unknown>).id = createId(prefix);
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          const prefix = getModelPrefix(model);
          if (prefix) {
            const items = Array.isArray(args.data) ? args.data : [args.data];
            for (const item of items) {
              if (!(item as Record<string, unknown>).id) {
                (item as Record<string, unknown>).id = createId(prefix);
              }
            }
          }
          return query(args);
        },
        async createManyAndReturn({ model, args, query }) {
          const prefix = getModelPrefix(model);
          if (prefix) {
            const items = Array.isArray(args.data) ? args.data : [args.data];
            for (const item of items) {
              if (!(item as Record<string, unknown>).id) {
                (item as Record<string, unknown>).id = createId(prefix);
              }
            }
          }
          return query(args);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

function getPrismaClient(): ExtendedPrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const base = new PrismaClient({ adapter });
  const client = createExtendedClient(base);

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

const prisma = new Proxy({} as ExtendedPrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;
