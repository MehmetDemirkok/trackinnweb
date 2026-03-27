import type { PrismaConfig } from "prisma";

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.js",
  },
} satisfies PrismaConfig;
