# Starpass Stone — modern rebuild

A modern, technological redesign of [starpassstone.net](https://starpassstone.net)
for **Starpass Stone LTD** (Starpass Limited) — natural stone in design since 1998.
Same information as the original site, rebuilt with a fresh dark, luxury-tech aesthetic.

| Layer | Stack |
|-------|-------|
| **Frontend** (`/web`) | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · custom design system |
| **Data layer** (`/web/lib/repo`) | Prisma 6 · PostgreSQL — with a zero-infra JSON/Vercel Blob fallback |
| **Auth** | Admin: signed-cookie password session · Users: bcrypt + JWT (jose) |
| **Backend** (`/api`) | NestJS 10 · TypeScript · class-validator (optional lead service) |

The frontend is fully self-contained — it ships its own `/api/contact` route handler,
so it runs without the NestJS service. The NestJS app is an optional, production-grade
lead handler you can point the form at.

## What's on the page

A single, smooth-scrolling landing page covering everything the original site had:

- **Hero** — "Natural stone in design", inline WhatsApp call-back form, key stats
- **Category marquee** — Fireplaces · Hamams · Saunas · Table tops · Bathrooms · Stone
- **Design & construction** — individual design projects with author's support
- **Stone palette** — Calacatta, Sadolit Blue, Ukrainian Labradorite, Nero Marquina, Onyx
- **Products** — marble columns, stone bathrooms, staircases, table tops, fireplaces
  (classic / electric / bio), outdoor BBQ, costing & guidance
- **Hamams** — health benefits, construction, portfolio, equipment (EOS, Sawo)
- **Saunas** — what a sauna is, portfolio, equipment / production / engineering
- **About** — the full company story since 1998 + personal guide Petro Rudenko
- **Contact & footer** — Dublin address, three phone numbers, email, WhatsApp

Text copy lives in [`web/lib/content.ts`](web/lib/content.ts). **All photos are managed
through the admin panel** (see below) and stored in `web/uploads/`.

## Admin dashboard

Go to **`/admin`** (e.g. http://localhost:3000/admin) and sign in with the admin
password. Login is rate-limited against brute force, and every attempt is logged.
The panel is organised into tabs:

- **Dashboard** — live stat cards (online now, visitors today/week/month, pageviews,
  average time on site), a table of the latest visits and a recent-activity feed.
- **Analytics** — bar charts for popular pages, geography, traffic sources, devices
  and browsers. Auto-refreshes while open.
- **Photos** — manage images for **Products**, the **Hamam gallery** and the
  **Sauna gallery**: upload/replace, edit title & description, reorder (↑ / ↓),
  delete, and *+ Add photo*. Click **Save changes** to publish instantly.
- **Logs** — full audit trail (visits, logins, uploads, content updates, leads, errors).
- **Settings** — Telegram/connection status and backup guidance.

## Analytics & Telegram notifications

Every page load is tracked client-side (`components/Tracker.tsx` → `/api/track`),
capturing IP, country/city, ISP, device, OS, browser, language, referrer, the page
URL and whether the visitor is new or returning, plus time-on-page via an unload
beacon. Geo fields come from edge/CDN headers (Vercel/Cloudflare) and degrade to
"Unknown" elsewhere. Visits and logs are stored as JSON (Vercel Blob in production,
local files in dev) — **no database required**.

When `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` are set, the bot sends a rich
notification for **each visit**, and alerts for **admin logins**, **contact leads**,
**file uploads** and **failed-login/errors**. With no token it stays silent (demo mode).

## Data layer & database

Every route talks to a **repository** (`web/lib/repo.ts`) instead of a concrete
store. Two drivers are selected at runtime:

- **PostgreSQL via Prisma** when `DATABASE_URL` is set. Models: `User`,
  `MediaItem`, `Visit`, `Log` (see `web/prisma/schema.prisma`). On an empty
  database the content is auto-seeded so the site is never blank.
- **JSON / Vercel Blob** otherwise — the zero-infrastructure default, so the
  site still deploys with no database at all.

```bash
# Use Postgres locally or in prod:
export DATABASE_URL="postgresql://user:pass@host:5432/starpass"
npm run db:migrate      # prisma migrate deploy
npm run build && npm start
```

`prisma generate` runs automatically on install and build.

## User accounts (JWT)

Visitors can register and sign in at **`/account`**. Passwords are hashed with
bcrypt; sessions are JWTs (`jose`) stored in an httpOnly cookie. Endpoints live
under `/api/auth` (`register`, `login`, `logout`, `me`) and are rate-limited.
Registrations are logged and trigger a Telegram alert. Admins manage everyone
from the dashboard **Users** tab (promote/demote role, delete).

## Search & extras

- **Site search** — press `⌘/Ctrl-K` (or the header ⌕) for an instant,
  client-side search over products, hammams, saunas, stones and sections.
- **Toast notifications** for auth and form actions.
- **Offline PWA** — a conservative service worker caches build assets and serves
  an `/offline` fallback page when disconnected.
- **Breadcrumbs** on subpages.

## SEO, PWA & security

- `sitemap.xml`, `robots.txt`, a web app **manifest** (installable PWA) and an SVG favicon.
- Schema.org `HomeAndConstructionBusiness` JSON-LD, canonical URL, Open Graph & Twitter cards.
- Light / dark **theme toggle** (persisted, no flash-of-wrong-theme on load).
- Security response headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`), `poweredByHeader` disabled, and in-memory
  rate limiting on the tracking, login and contact endpoints.

**Password:** set `ADMIN_PASSWORD` in `web/.env.local` (defaults to `starpass` for local
dev). Also set a long random `ADMIN_SECRET` to sign the login cookie. See
[`web/.env.example`](web/.env.example).

Uploaded images are written to `web/uploads/` and served via `/api/media/...`.
The catalog state is stored in `web/data/content.json`. Both are runtime data
(git-ignored) — in production, keep that folder on a persistent disk/volume.

## Run it

### Frontend (enough on its own)

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

Production: `npm run build && npm run start`.

The contact form posts to `POST /api/contact`. With no configuration it runs in
**demo mode** (logs the lead, returns success). To deliver leads, set either
`NEST_API_URL` (forward to the backend) or `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`
in `web/.env.local` — see [`web/.env.example`](web/.env.example).

### Backend (optional NestJS lead service)

```bash
cd api
npm install
npm run start:dev  # http://localhost:4000/api
```

Endpoint: `POST /api/contact` `{ "name": "...", "phone": "..." }` → `{ "ok": true }`.
Configure Telegram via [`api/.env.example`](api/.env.example). To wire the frontend
to it, set `NEST_API_URL=http://localhost:4000/api` in `web/.env.local`.

## Deploy to Vercel

See **[DEPLOY.md](DEPLOY.md)** for step-by-step instructions. In short: import the
repo on Vercel with **Root Directory = `web`**, add `ADMIN_PASSWORD` / `ADMIN_SECRET`,
and connect a **Vercel Blob** store so the admin panel can store photos in
production. Photos uploaded via `/admin` persist in Blob across deploys.

## Design notes

- Dark "obsidian" base with a champagne-gold accent that fits natural-stone luxury.
- Ambient marble glow + faint technical grid background.
- Glassmorphism cards, scroll-reveal animations, animated category marquee.
- Display serif (Fraunces) paired with Inter; fully responsive with a mobile nav.
- Product imagery is loaded via `next/image` from Unsplash (swap for real photos in
  `web/lib/content.ts`).
