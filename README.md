# Starpass Stone — modern rebuild

A modern, technological redesign of [starpassstone.net](https://starpassstone.net)
for **Starpass Stone LTD** (Starpass Limited) — natural stone in design since 1998.
Same information as the original site, rebuilt with a fresh dark, luxury-tech aesthetic.

| Layer | Stack |
|-------|-------|
| **Frontend** (`/web`) | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · custom design system |
| **Backend** (`/api`) | NestJS 10 · TypeScript · class-validator |

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

## Admin panel — manage all photos

Go to **`/admin`** (e.g. http://localhost:3000/admin) and sign in with the admin
password. From there you can, for **Products**, the **Hamam gallery** and the
**Sauna gallery**:

- **Upload** a photo from your computer (drag-free, just click *Upload*)
- **Replace** an existing photo
- Edit the **title** and **description**
- **Reorder** photos (↑ / ↓) and **Delete** them
- **Add** new items with *+ Add photo*

Click **Save changes** to publish instantly to the live site.

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
