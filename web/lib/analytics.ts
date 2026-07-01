// Lightweight, dependency-free analytics + audit log store.
//
// Persistence mirrors lib/store.ts: Vercel Blob in production (serverless
// filesystem is read-only), local filesystem for `npm run dev`. This keeps the
// whole app deployable with zero database infrastructure while still recording
// visits, computing traffic stats and keeping an admin action log.

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { RequestInfo } from "./request-info";

export type Visit = RequestInfo & {
  id: string;
  visitorId: string;
  at: string; // ISO timestamp
  path: string;
  referrer: string;
  isNew: boolean;
  duration?: number; // seconds spent on the page (filled by the end beacon)
};

export type LogType =
  | "visit"
  | "admin_login"
  | "admin_logout"
  | "upload"
  | "contact"
  | "user_register"
  | "content_update"
  | "error";

export type LogEntry = {
  id: string;
  at: string;
  type: LogType;
  message: string;
  ip?: string;
};

export type AnalyticsData = {
  visits: Visit[];
  logs: LogEntry[];
};

const KEY = "analytics.json";
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, KEY);

// Keep the store bounded so Blob/file size stays small and reads stay fast.
const MAX_VISITS = 5000;
const MAX_LOGS = 500;
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function empty(): AnalyticsData {
  return { visits: [], logs: [] };
}

function normalize(parsed: Partial<AnalyticsData> | null): AnalyticsData {
  return {
    visits: Array.isArray(parsed?.visits) ? parsed!.visits : [],
    logs: Array.isArray(parsed?.logs) ? parsed!.logs : [],
  };
}

async function blobRead(): Promise<AnalyticsData> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: KEY, token: BLOB_TOKEN });
  const found = blobs.find((b) => b.pathname === KEY);
  if (!found) return empty();
  const res = await fetch(found.url, { cache: "no-store" });
  if (!res.ok) return empty();
  try {
    return normalize((await res.json()) as Partial<AnalyticsData>);
  } catch {
    return empty();
  }
}

async function blobWrite(data: AnalyticsData): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(KEY, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    token: BLOB_TOKEN,
  });
}

export async function readAnalytics(): Promise<AnalyticsData> {
  if (useBlob) return blobRead();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return normalize(JSON.parse(raw) as Partial<AnalyticsData>);
  } catch {
    return empty();
  }
}

async function writeAnalytics(data: AnalyticsData): Promise<void> {
  const trimmed: AnalyticsData = {
    visits: data.visits.slice(-MAX_VISITS),
    logs: data.logs.slice(-MAX_LOGS),
  };
  if (useBlob) {
    await blobWrite(trimmed);
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(trimmed), "utf8");
  }
}

/** Append a visit event. Returns the stored record. */
export async function recordVisit(
  visit: Omit<Visit, "id" | "at">
): Promise<Visit> {
  const data = await readAnalytics();
  const record: Visit = { ...visit, id: randomUUID(), at: new Date().toISOString() };
  data.visits.push(record);
  await writeAnalytics(data);
  return record;
}

/** Attach a session duration (seconds) to the most recent visit for a visitor. */
export async function recordDuration(
  visitorId: string,
  duration: number
): Promise<void> {
  if (!visitorId || !Number.isFinite(duration) || duration <= 0) return;
  const data = await readAnalytics();
  for (let i = data.visits.length - 1; i >= 0; i--) {
    if (data.visits[i].visitorId === visitorId && data.visits[i].duration == null) {
      data.visits[i].duration = Math.min(Math.round(duration), 60 * 60);
      await writeAnalytics(data);
      return;
    }
  }
}

/** Append an audit log entry. */
export async function addLog(entry: Omit<LogEntry, "id" | "at">): Promise<void> {
  const data = await readAnalytics();
  data.logs.push({ ...entry, id: randomUUID(), at: new Date().toISOString() });
  await writeAnalytics(data);
}

/* ------------------------------------------------------------------ */
/* Stats computation                                                   */
/* ------------------------------------------------------------------ */

export type Stats = {
  online: number;
  visitorsToday: number;
  visitorsWeek: number;
  visitorsMonth: number;
  pageviewsToday: number;
  pageviewsTotal: number;
  avgTimeSeconds: number;
  topPages: { key: string; count: number }[];
  countries: { key: string; count: number }[];
  sources: { key: string; count: number }[];
  devices: { key: string; count: number }[];
  browsers: { key: string; count: number }[];
  recent: Visit[];
};

function tally(values: string[], limit = 8): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of values) {
    const key = v || "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function sourceOf(referrer: string): string {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer.slice(0, 40);
  }
}

export function computeStats(data: AnalyticsData): Stats {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const visits = data.visits;

  const inWindow = (v: Visit, ms: number) => now - new Date(v.at).getTime() <= ms;
  const distinct = (list: Visit[]) => new Set(list.map((v) => v.visitorId)).size;

  const today = visits.filter((v) => inWindow(v, day));
  const week = visits.filter((v) => inWindow(v, 7 * day));
  const month = visits.filter((v) => inWindow(v, 30 * day));

  const durations = visits.map((v) => v.duration).filter((d): d is number => !!d);
  const avgTimeSeconds = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const online = new Set(
    visits.filter((v) => inWindow(v, ONLINE_WINDOW_MS)).map((v) => v.visitorId)
  ).size;

  return {
    online,
    visitorsToday: distinct(today),
    visitorsWeek: distinct(week),
    visitorsMonth: distinct(month),
    pageviewsToday: today.length,
    pageviewsTotal: visits.length,
    avgTimeSeconds,
    topPages: tally(visits.map((v) => v.path)),
    countries: tally(visits.map((v) => v.country)),
    sources: tally(visits.map((v) => sourceOf(v.referrer))),
    devices: tally(visits.map((v) => v.device), 4),
    browsers: tally(visits.map((v) => v.browser), 6),
    recent: visits.slice(-25).reverse(),
  };
}
