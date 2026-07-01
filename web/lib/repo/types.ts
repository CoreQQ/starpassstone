// Shared data-layer types and the repository contract implemented by both the
// Prisma (Postgres) driver and the JSON/Blob driver.

import type { SiteContent } from "../store";
import type { Visit, LogEntry, Stats } from "../analytics";

export type { SiteContent, Visit, LogEntry, Stats };

export type Role = "USER" | "ADMIN";

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
  lastLogin: string | null;
};

/** User plus the bcrypt hash — only returned to the auth layer, never to clients. */
export type UserWithHash = User & { password: string };

export type NewUser = {
  email: string;
  name?: string | null;
  password: string; // bcrypt hash
  role?: Role;
};

export interface Repo {
  // Content (products & galleries)
  getContent(): Promise<SiteContent>;
  saveContent(input: unknown): Promise<SiteContent>;

  // Analytics & audit log
  recordVisit(visit: Omit<Visit, "id" | "at">): Promise<void>;
  recordDuration(visitorId: string, duration: number): Promise<void>;
  addLog(entry: Omit<LogEntry, "id" | "at">): Promise<void>;
  getStats(): Promise<Stats>;
  getLogs(limit: number): Promise<LogEntry[]>;

  // Users
  createUser(user: NewUser): Promise<User>;
  findUserByEmail(email: string): Promise<UserWithHash | null>;
  findUserById(id: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  setUserRole(id: string, role: Role): Promise<void>;
  deleteUser(id: string): Promise<void>;
  countUsers(): Promise<number>;
  touchLastLogin(id: string): Promise<void>;
}
