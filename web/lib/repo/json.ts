// JSON/Blob repository driver — the zero-infrastructure default.
//
// Content and analytics reuse the existing stores; users get their own
// users.json. Persistence is Vercel Blob in production, local files in dev,
// exactly like the rest of the app.

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { readContent, writeContent } from "../store";
import {
  readAnalytics,
  recordVisit as anRecordVisit,
  recordDuration as anRecordDuration,
  addLog as anAddLog,
  computeStats,
} from "../analytics";
import type { Repo, User, UserWithHash, NewUser, Role } from "./types";

const USERS_KEY = "users.json";
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, USERS_KEY);
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

async function readUsers(): Promise<UserWithHash[]> {
  if (useBlob) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: USERS_KEY, token: BLOB_TOKEN });
    const found = blobs.find((b) => b.pathname === USERS_KEY);
    if (!found) return [];
    const res = await fetch(found.url, { cache: "no-store" });
    if (!res.ok) return [];
    try {
      return (await res.json()) as UserWithHash[];
    } catch {
      return [];
    }
  }
  try {
    return JSON.parse(await fs.readFile(USERS_FILE, "utf8")) as UserWithHash[];
  } catch {
    return [];
  }
}

async function writeUsers(users: UserWithHash[]): Promise<void> {
  if (useBlob) {
    const { put } = await import("@vercel/blob");
    await put(USERS_KEY, JSON.stringify(users), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      token: BLOB_TOKEN,
    });
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(USERS_FILE, JSON.stringify(users), "utf8");
  }
}

const strip = (u: UserWithHash): User => {
  const { password: _pw, ...rest } = u;
  void _pw;
  return rest;
};

export const jsonDriver: Repo = {
  getContent: () => readContent(),
  saveContent: (input) => writeContent(input),

  recordVisit: async (visit) => {
    await anRecordVisit(visit);
  },
  recordDuration: (visitorId, duration) => anRecordDuration(visitorId, duration),
  addLog: (entry) => anAddLog(entry),
  getStats: async () => computeStats(await readAnalytics()),
  getLogs: async (limit) => (await readAnalytics()).logs.slice(-limit).reverse(),

  createUser: async (user: NewUser) => {
    const users = await readUsers();
    const record: UserWithHash = {
      id: randomUUID(),
      email: user.email.toLowerCase(),
      name: user.name ?? null,
      password: user.password,
      role: user.role ?? "USER",
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    users.push(record);
    await writeUsers(users);
    return strip(record);
  },
  findUserByEmail: async (email) => {
    const users = await readUsers();
    return users.find((u) => u.email === email.toLowerCase()) ?? null;
  },
  findUserById: async (id) => {
    const u = (await readUsers()).find((x) => x.id === id);
    return u ? strip(u) : null;
  },
  listUsers: async () =>
    (await readUsers())
      .map(strip)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  setUserRole: async (id, role: Role) => {
    const users = await readUsers();
    const u = users.find((x) => x.id === id);
    if (u) {
      u.role = role;
      await writeUsers(users);
    }
  },
  deleteUser: async (id) => {
    const users = await readUsers();
    await writeUsers(users.filter((u) => u.id !== id));
  },
  countUsers: async () => (await readUsers()).length,
  touchLastLogin: async (id) => {
    const users = await readUsers();
    const u = users.find((x) => x.id === id);
    if (u) {
      u.lastLogin = new Date().toISOString();
      await writeUsers(users);
    }
  },
};
