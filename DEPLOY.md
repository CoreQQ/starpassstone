# Deploying to Vercel

This repo is a monorepo: the website lives in **`web/`** (Next.js) and an optional
backend in `api/` (NestJS). Only `web/` is deployed to Vercel.

Photos and content are stored in **Vercel Blob** in production (the serverless
filesystem is read-only), so the `/admin` panel works live on the deployed site.

## 1. Import the project

1. Go to **https://vercel.com/new**.
2. Import the Git repository **`CoreQQ/starpassstone`**.
3. On the configuration screen:
   - **Framework Preset:** Next.js (auto-detected).
   - **Root Directory:** click **Edit** and select **`web`** ← important, the app is in this subfolder.
   - Leave Build & Output settings as default.

## 2. Add environment variables

Before the first deploy, add these in **Settings → Environment Variables**
(or on the import screen):

| Name | Value | Notes |
|------|-------|-------|
| `ADMIN_PASSWORD` | your strong password | used to sign in at `/admin` |
| `ADMIN_SECRET` | a long random string | signs the admin login cookie |

Then click **Deploy**. The site will be live (showing the default photos).

## 3. Connect Vercel Blob (enables photo uploads)

1. Open your new project → **Storage** tab → **Create Database** → **Blob** → **Create**.
2. **Connect** it to this project. Vercel automatically adds the
   `BLOB_READ_WRITE_TOKEN` environment variable.
3. Go to **Deployments** → on the latest deployment click **⋯ → Redeploy**
   (so the running app picks up the new variable).

That's it. Open `https://<your-app>.vercel.app/admin`, sign in, and upload photos —
they're stored in Blob and appear on the live site instantly.

## Updating the site later

Any `git push` to `main` triggers an automatic redeploy. Photos you add through
the admin panel are stored in Blob and persist across deploys — you don't need to
push for those.

## Notes

- Before Blob is connected, the public site still works (default photos); only
  saving/uploading from the admin needs Blob.
- The `api/` NestJS service is **not** deployed to Vercel. The contact form works
  without it (demo/Telegram). To deliver leads, set `TELEGRAM_BOT_TOKEN` and
  `TELEGRAM_CHAT_ID` env vars, or host `api/` separately and set `NEST_API_URL`.
- Local development is unchanged: `cd web && npm install && npm run dev` uses the
  local filesystem (no Blob needed).
