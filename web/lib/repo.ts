// Data-layer facade. Selects the storage driver at runtime:
//   - Prisma / PostgreSQL when DATABASE_URL is set
//   - JSON / Vercel Blob otherwise (zero-infrastructure default)
//
// The Prisma driver is imported lazily so JSON-only deployments never load the
// Prisma client. Every route talks to this module, not a concrete store.

import type { Repo } from "./repo/types";

export type {
  Repo,
  User,
  UserWithHash,
  NewUser,
  Role,
  SiteContent,
  Visit,
  LogEntry,
  Stats,
} from "./repo/types";

export const usingDatabase = !!process.env.DATABASE_URL;

let cached: Promise<Repo> | null = null;

function loadDriver(): Promise<Repo> {
  return usingDatabase
    ? import("./repo/prisma").then((m) => m.prismaDriver)
    : import("./repo/json").then((m) => m.jsonDriver);
}

export function repo(): Promise<Repo> {
  if (!cached) cached = loadDriver();
  return cached;
}
