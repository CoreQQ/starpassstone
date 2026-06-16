import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { products as defaultProducts } from "./content";

export type Item = {
  id: string;
  title: string;
  desc?: string;
  img: string;
};

export type SiteContent = {
  products: Item[];
  hamamGallery: Item[];
  saunaGallery: Item[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "content.json");

function item(title: string, img: string, desc?: string): Item {
  return desc !== undefined
    ? { id: randomUUID(), title, img, desc }
    : { id: randomUUID(), title, img };
}

/** Default content used to seed the store on first run. */
function seed(): SiteContent {
  return {
    products: defaultProducts.map((p) => item(p.title, p.img, p.desc)),
    hamamGallery: [
      item(
        "Mosaic in hammam",
        "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&q=80"
      ),
      item(
        "Hammam in mosaic with ergonomic benches",
        "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80"
      ),
      item(
        "Hammam in marble",
        "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=1200&q=80"
      ),
    ],
    saunaGallery: [
      item(
        "Finnish steam room",
        "https://images.unsplash.com/photo-1554344728-77cf90d9ed26?w=1200&q=80"
      ),
      item(
        "Salt & bench lighting",
        "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1200&q=80"
      ),
      item(
        "Senior rooms",
        "https://images.unsplash.com/photo-1610552050890-fe99536c2615?w=1200&q=80"
      ),
    ],
  };
}

async function ensure(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(seed(), null, 2), "utf8");
  }
}

export async function readContent(): Promise<SiteContent> {
  await ensure();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as Partial<SiteContent>;
    const base = seed();
    return {
      products: parsed.products ?? base.products,
      hamamGallery: parsed.hamamGallery ?? base.hamamGallery,
      saunaGallery: parsed.saunaGallery ?? base.saunaGallery,
    };
  } catch {
    return seed();
  }
}

/** Validates and normalises an incoming content payload before saving. */
export async function writeContent(input: unknown): Promise<SiteContent> {
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
            return base;
          })
      : [];

  const next: SiteContent = {
    products: clean(data.products, true),
    hamamGallery: clean(data.hamamGallery, false),
    saunaGallery: clean(data.saunaGallery, false),
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}
