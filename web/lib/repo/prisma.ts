// Prisma (PostgreSQL) repository driver — active when DATABASE_URL is set.

import { prisma } from "../prisma";
import { seedContent, sanitizeContent, type Item, type SiteContent } from "../store";
import { computeStats, type Visit, type LogEntry } from "../analytics";
import type { Repo, User, UserWithHash, NewUser, Role } from "./types";

type Section = keyof SiteContent;
const SECTIONS: Section[] = ["products", "hamamGallery", "saunaGallery"];

type MediaRow = {
  id: string;
  section: string;
  title: string;
  desc: string;
  img: string;
  position: number;
};

function rowsToContent(rows: MediaRow[]): SiteContent {
  const out: SiteContent = { products: [], hamamGallery: [], saunaGallery: [] };
  for (const s of SECTIONS) {
    out[s] = rows
      .filter((r) => r.section === s)
      .sort((a, b) => a.position - b.position)
      .map((r): Item =>
        s === "products"
          ? { id: r.id, title: r.title, desc: r.desc, img: r.img }
          : { id: r.id, title: r.title, img: r.img }
      );
  }
  return out;
}

async function persistContent(content: SiteContent): Promise<void> {
  const rows = SECTIONS.flatMap((section) =>
    content[section].map((item, position) => ({
      id: item.id,
      section,
      title: item.title,
      desc: item.desc ?? "",
      img: item.img,
      position,
    }))
  );
  await prisma.$transaction([
    prisma.mediaItem.deleteMany({}),
    prisma.mediaItem.createMany({ data: rows }),
  ]);
}

const stripUser = (u: UserWithHash): User => {
  const { password: _pw, ...rest } = u;
  void _pw;
  return rest;
};

function toUserWithHash(r: {
  id: string;
  email: string;
  name: string | null;
  password: string;
  role: string;
  createdAt: Date;
  lastLogin: Date | null;
}): UserWithHash {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    password: r.password,
    role: r.role as Role,
    createdAt: r.createdAt.toISOString(),
    lastLogin: r.lastLogin ? r.lastLogin.toISOString() : null,
  };
}

export const prismaDriver: Repo = {
  getContent: async () => {
    const rows = (await prisma.mediaItem.findMany()) as MediaRow[];
    if (rows.length === 0) {
      // Seed defaults on first run so the public site is never empty.
      const seeded = seedContent();
      await persistContent(seeded);
      return seeded;
    }
    return rowsToContent(rows);
  },
  saveContent: async (input) => {
    const clean = sanitizeContent(input);
    await persistContent(clean);
    return clean;
  },

  recordVisit: async (visit) => {
    await prisma.visit.create({ data: visit });
  },
  recordDuration: async (visitorId, duration) => {
    if (!visitorId || !Number.isFinite(duration) || duration <= 0) return;
    const last = await prisma.visit.findFirst({
      where: { visitorId, duration: null },
      orderBy: { at: "desc" },
    });
    if (last) {
      await prisma.visit.update({
        where: { id: last.id },
        data: { duration: Math.min(Math.round(duration), 60 * 60) },
      });
    }
  },
  addLog: async (entry) => {
    await prisma.log.create({ data: entry });
  },
  getStats: async () => {
    const [visitRows, logRows] = await Promise.all([
      prisma.visit.findMany({ orderBy: { at: "asc" }, take: 5000 }),
      prisma.log.findMany({ orderBy: { at: "asc" }, take: 500 }),
    ]);
    const visits: Visit[] = visitRows.map((v) => ({
      ...v,
      at: v.at.toISOString(),
      duration: v.duration ?? undefined,
    }));
    const logs: LogEntry[] = logRows.map((l) => ({
      ...l,
      at: l.at.toISOString(),
      ip: l.ip ?? undefined,
    })) as LogEntry[];
    return computeStats({ visits, logs });
  },
  getLogs: async (limit) => {
    const rows = await prisma.log.findMany({ orderBy: { at: "desc" }, take: limit });
    return rows.map((l) => ({
      ...l,
      at: l.at.toISOString(),
      ip: l.ip ?? undefined,
    })) as LogEntry[];
  },

  createUser: async (user: NewUser) => {
    const r = await prisma.user.create({
      data: {
        email: user.email.toLowerCase(),
        name: user.name ?? null,
        password: user.password,
        role: user.role ?? "USER",
      },
    });
    return stripUser(toUserWithHash(r));
  },
  findUserByEmail: async (email) => {
    const r = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return r ? toUserWithHash(r) : null;
  },
  findUserById: async (id) => {
    const r = await prisma.user.findUnique({ where: { id } });
    return r ? stripUser(toUserWithHash(r)) : null;
  },
  listUsers: async () => {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((r) => stripUser(toUserWithHash(r)));
  },
  setUserRole: async (id, role: Role) => {
    await prisma.user.update({ where: { id }, data: { role } });
  },
  deleteUser: async (id) => {
    await prisma.user.delete({ where: { id } }).catch(() => {});
  },
  countUsers: () => prisma.user.count(),
  touchLastLogin: async (id) => {
    await prisma.user.update({ where: { id }, data: { lastLogin: new Date() } });
  },
};
