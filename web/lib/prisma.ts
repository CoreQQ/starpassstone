// Prisma client singleton — reused across hot reloads / serverless invocations
// to avoid exhausting database connections.

import { PrismaClient } from "@prisma/client";

// The schema declares directUrl (needed for Supabase's pgbouncer pooling);
// default it to the primary URL so plain-Postgres setups need only DATABASE_URL.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
