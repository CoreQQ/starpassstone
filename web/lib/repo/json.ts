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
import type {
  Repo,
  User,
  UserWithHash,
  NewUser,
  Role,
  NewsPost,
  Banner,
  Settings,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

/** Generic keyed JSON document store (Vercel Blob in prod, local file in dev). */
async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (useBlob) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: key, token: BLOB_TOKEN });
    const found = blobs.find((b) => b.pathname === key);
    if (!found) return fallback;
    const res = await fetch(found.url, { cache: "no-store" });
    if (!res.ok) return fallback;
    try {
      return (await res.json()) as T;
    } catch {
      return fallback;
    }
  }
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, key), "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, data: unknown): Promise<void> {
  if (useBlob) {
    const { put } = await import("@vercel/blob");
    await put(key, JSON.stringify(data), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      token: BLOB_TOKEN,
    });
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, key), JSON.stringify(data), "utf8");
  }
}

const readUsers = () => readJson<UserWithHash[]>("users.json", []);
const writeUsers = (users: UserWithHash[]) => writeJson("users.json", users);

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

  listNews: async (publishedOnly = false) => {
    const news = await readJson<NewsPost[]>("news.json", []);
    const sorted = news.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return publishedOnly ? sorted.filter((n) => n.published) : sorted;
  },
  saveNews: async (post) => {
    const news = await readJson<NewsPost[]>("news.json", []);
    const existing = post.id ? news.find((n) => n.id === post.id) : undefined;
    const record: NewsPost = {
      id: existing?.id ?? randomUUID(),
      title: post.title,
      body: post.body,
      img: post.img,
      published: post.published,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const next = existing
      ? news.map((n) => (n.id === record.id ? record : n))
      : [...news, record];
    await writeJson("news.json", next);
    return record;
  },
  deleteNews: async (id) => {
    const news = await readJson<NewsPost[]>("news.json", []);
    await writeJson("news.json", news.filter((n) => n.id !== id));
  },

  listBanners: async (activeOnly = false) => {
    const banners = await readJson<Banner[]>("banners.json", []);
    const sorted = banners.sort((a, b) => a.position - b.position);
    return activeOnly ? sorted.filter((b) => b.active) : sorted;
  },
  saveBanners: async (banners) => {
    const clean = banners.map((b, i) => ({
      id: b.id || randomUUID(),
      text: String(b.text ?? "").slice(0, 300),
      href: String(b.href ?? "").slice(0, 500),
      active: !!b.active,
      position: i,
    }));
    await writeJson("banners.json", clean);
    return clean;
  },

  getSettings: () => readJson<Settings>("settings.json", {}),
  saveSettings: async (settings) => {
    await writeJson("settings.json", settings);
    return settings;
  },

  exportBackup: async () => {
    const analytics = await readAnalytics();
    return {
      exportedAt: new Date().toISOString(),
      content: await readContent(),
      news: await readJson<NewsPost[]>("news.json", []),
      banners: await readJson<Banner[]>("banners.json", []),
      settings: await readJson<Settings>("settings.json", {}),
      users: (await readUsers()).map(strip),
      visits: analytics.visits,
      logs: analytics.logs,
    };
  },

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
