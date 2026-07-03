import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { products as defaultProducts } from "./content";

export type Item = {
  id: string;
  title: string;
  desc?: string;
  img: string;
  /** Portfolio category (design | products | fireplaces | hammam | sauna | production). */
  tag?: string;
};

export type SiteContent = {
  products: Item[];
  hamamGallery: Item[];
  saunaGallery: Item[];
  /** The full photo archive shown in the filterable Gallery section. */
  portfolio: Item[];
};

const CONTENT_KEY = "content.json";
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, CONTENT_KEY);

/**
 * Storage driver selection:
 *  - When BLOB_READ_WRITE_TOKEN is present (e.g. on Vercel) we persist to
 *    Vercel Blob, since the serverless filesystem is read-only.
 *  - Otherwise we use the local filesystem (great for `npm run dev`).
 */
export const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function item(title: string, img: string, desc?: string): Item {
  return desc !== undefined
    ? { id: randomUUID(), title, img, desc }
    : { id: randomUUID(), title, img };
}

// All 98 photos mirrored from the original site, mapped to the section each
// belonged to there (extracted from the old SPA's page chunks).
const PORTFOLIO_RANGES: [from: number, to: number, tag: string][] = [
  [1, 20, "design"],
  [21, 43, "products"],
  [44, 60, "fireplaces"],
  [61, 70, "hammam"],
  [71, 89, "sauna"],
  [90, 98, "production"],
];

function seedPortfolio(): Item[] {
  return PORTFOLIO_RANGES.flatMap(([from, to, tag]) =>
    Array.from({ length: to - from + 1 }, (_, i) => ({
      id: randomUUID(),
      title: "",
      img: `/photos/${from + i}.jpg`,
      tag,
    }))
  );
}

/** Default content used to seed the store on first run. */
export function seedContent(): SiteContent {
  return seed();
}

function seed(): SiteContent {
  return {
    products: defaultProducts.map((p) => item(p.title, p.img, p.desc)),
    // Original starpassstone.net portfolio photos, mirrored into /public/photos.
    hamamGallery: [
      item("Mosaic in hammam", "/photos/61.jpg"),
      item("Hammam in mosaic with ergonomic benches", "/photos/62.jpg"),
      item("Hammam in marble", "/photos/63.jpg"),
      item("Hammam interior", "/photos/64.jpg"),
      item("Hammam detail", "/photos/65.jpg"),
      item("Hammam benches", "/photos/66.jpg"),
    ],
    saunaGallery: [
      item("Finnish steam room", "/photos/72.jpg"),
      item("Salt & bench lighting", "/photos/73.jpg"),
      item("Senior rooms", "/photos/74.jpg"),
      item("Humpback benches", "/photos/75.jpg"),
      item("Sauna interior", "/photos/76.jpg"),
      item("Sauna lighting", "/photos/77.jpg"),
    ],
    portfolio: seedPortfolio(),
  };
}

function normalize(parsed: Partial<SiteContent>): SiteContent {
  const base = seed();
  return {
    products: parsed.products ?? base.products,
    hamamGallery: parsed.hamamGallery ?? base.hamamGallery,
    saunaGallery: parsed.saunaGallery ?? base.saunaGallery,
    portfolio: parsed.portfolio ?? base.portfolio,
  };
}

/** Read the content.json blob from Vercel Blob, or null if it doesn't exist. */
async function blobRead(): Promise<SiteContent | null> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: CONTENT_KEY, token: BLOB_TOKEN });
  const found = blobs.find((b) => b.pathname === CONTENT_KEY);
  if (!found) return null;
  const res = await fetch(found.url, { cache: "no-store" });
  if (!res.ok) return null;
  try {
    return normalize((await res.json()) as Partial<SiteContent>);
  } catch {
    return null;
  }
}

async function blobWrite(content: SiteContent): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(CONTENT_KEY, JSON.stringify(content, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    token: BLOB_TOKEN,
  });
}

async function fileEnsure(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(seed(), null, 2), "utf8");
  }
}

export async function readContent(): Promise<SiteContent> {
  if (useBlob) {
    return (await blobRead()) ?? seed();
  }
  // Filesystem mode. On a read-only host (e.g. Vercel without Blob configured)
  // any fs error falls back to the seed defaults so the public site stays up.
  try {
    await fileEnsure();
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return normalize(JSON.parse(raw) as Partial<SiteContent>);
  } catch {
    return seed();
  }
}

/** Validates and normalises an incoming content payload (pure, no I/O). */
export function sanitizeContent(input: unknown): SiteContent {
  const data = input as Partial<SiteContent>;
  const clean = (arr: unknown, withDesc: boolean): Item[] =>
    Array.isArray(arr)
      ? arr
          .map((x) => x as Partial<Item>)
          .filter((x) => typeof x.img === "string" && x.img.trim())
          .map((x) => {
            const base: Item = {
              id: typeof x.id === "string" ? x.id : randomUUID(),
              title: String(x.title ?? "").slice(0, 160),
              img: String(x.img).slice(0, 1000),
            };
            if (withDesc) base.desc = String(x.desc ?? "").slice(0, 400);
            if (typeof x.tag === "string" && x.tag.trim()) {
              base.tag = x.tag.trim().slice(0, 40);
            }
            return base;
          })
      : [];

  return {
    products: clean(data.products, true),
    hamamGallery: clean(data.hamamGallery, false),
    saunaGallery: clean(data.saunaGallery, false),
    portfolio: clean(data.portfolio, false),
  };
}

/** Validates and persists an incoming content payload. */
export async function writeContent(input: unknown): Promise<SiteContent> {
  const next = sanitizeContent(input);

  if (useBlob) {
    await blobWrite(next);
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf8");
  }
  return next;
}
