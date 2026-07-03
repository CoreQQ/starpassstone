# Настройка Starpass Stone — пошаговый гайд

Всё, что нужно, чтобы запустить сайт в продакшене: Telegram-уведомления,
база данных Supabase, админ-панель и деплой на Vercel.

> Английская документация: [README.md](README.md) и [DEPLOY.md](DEPLOY.md).

---

## 1. Переменные окружения — полный список

Локально — файл `web/.env.local` (скопируйте из `web/.env.example`).
На Vercel — Project → Settings → Environment Variables.

| Переменная | Обязательна | Что делает |
|---|---|---|
| `ADMIN_PASSWORD` | ✅ | Пароль входа в админку `/admin` |
| `ADMIN_SECRET` | ✅ | Длинная случайная строка — подпись admin-cookie |
| `JWT_SECRET` | ✅ | Длинная случайная строка — подпись JWT пользователей |
| `TELEGRAM_BOT_TOKEN` | для Telegram | Токен бота от @BotFather |
| `TELEGRAM_CHAT_ID` | для Telegram | ID чата, куда слать уведомления |
| `DATABASE_URL` | для Supabase | Пул-строка подключения (порт 6543) |
| `DIRECT_URL` | для Supabase | Прямая строка подключения (порт 5432) |
| `BLOB_READ_WRITE_TOKEN` | для загрузок на Vercel | Создаётся автоматически при подключении Blob |
| `NEXT_PUBLIC_SITE_URL` | желательно | Публичный адрес сайта, напр. `https://starpassstone.net` |

Случайные строки удобно генерировать так:

```bash
openssl rand -hex 32
```

---

## 2. Telegram-бот (уведомления о визитах, заявках, входах)

**Шаг 1 — создать бота.**
Откройте в Telegram [@BotFather](https://t.me/BotFather) → команда `/newbot` →
придумайте имя и username. BotFather выдаст токен вида
`1234567890:AAEhBOweik6ad9r_QXMENQXcrdyPUqoDu24` — это `TELEGRAM_BOT_TOKEN`.

**Шаг 2 — узнать свой chat id.**
Напишите своему новому боту любое сообщение (например «привет»), затем откройте
в браузере (подставьте токен):

```
https://api.telegram.org/bot<ТОКЕН>/getUpdates
```

В ответе найдите `"chat":{"id":123456789,...}` — это число и есть
`TELEGRAM_CHAT_ID`. (Для группы: добавьте бота в группу, напишите сообщение —
id группы будет отрицательным, вида `-100...`.)

**Шаг 3 — прописать переменные** и перезапустить/redeploy.

**Шаг 4 — проверить.** Откройте сайт — бот пришлёт сообщение «👁 Site visit»
с IP, страной, городом, устройством, браузером, источником перехода. Также
приходят уведомления: 🔐 вход в админку, 🪨 заявка с формы, 🧑‍💼 регистрация
пользователя, 🖼 загрузка файла, ошибки входа.

Статус подключения виден в админке: **Settings → Telegram notifications** —
там же есть кнопка **Send test message**: она отправляет тестовое сообщение и
показывает точную ошибку Telegram, если что-то настроено неверно.

**Если уведомления не приходят:**

| Ошибка теста | Причина и решение |
|---|---|
| `…not set in the environment` | Переменные не заданы на Vercel или не сделан redeploy после добавления |
| `Unauthorized` | Неверный `TELEGRAM_BOT_TOKEN` — скопируйте заново у @BotFather |
| `Bad Request: chat not found` | Неверный `TELEGRAM_CHAT_ID`, или вы ещё не написали боту ни одного сообщения (бот не может писать первым) |
| `Forbidden: bot was blocked by the user` | Разблокируйте бота в Telegram |

После изменения переменных на Vercel обязательно **Redeploy**.

> География (страна/город/провайдер) берётся из заголовков CDN — на Vercel
> работает из коробки; на голом сервере без CDN будет «Unknown».

---

## 3. База данных Supabase

Без базы сайт тоже работает (контент хранится в JSON/Vercel Blob), но с
Supabase вы получаете полноценный PostgreSQL для контента, новостей, баннеров,
настроек, пользователей, визитов и логов.

**Шаг 1 — создать проект.** [supabase.com](https://supabase.com) → New project
→ придумайте пароль базы (сохраните его).

**Шаг 2 — взять строки подключения.**
Dashboard → **Settings → Database → Connection string**:

- **Transaction pooler** (порт **6543**) → в `DATABASE_URL`, добавьте в конец `?pgbouncer=true`
- **Session pooler / Direct** (порт **5432**) → в `DIRECT_URL`

```bash
DATABASE_URL="postgresql://postgres.<ref>:<пароль>@aws-0-<регион>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<пароль>@aws-0-<регион>.pooler.supabase.com:5432/postgres"
```

**Шаг 3 — применить миграции** (создаёт все таблицы):

```bash
cd web
npm install
npm run db:migrate     # = prisma migrate deploy
```

**Шаг 4 — готово.** При первом запуске контент автоматически заполнится
(товары и галереи с реальными фото). Проверить хранилище можно в админке:
**Settings → Storage** — должно быть «PostgreSQL via Prisma».

> Обычный PostgreSQL вместо Supabase: задайте только `DATABASE_URL` —
> `DIRECT_URL` подставится автоматически.

---

## 4. Деплой на Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → импортируйте
   репозиторий `CoreQQ/starpassstone`.
2. **Root Directory: `web`** (важно!). Framework определится как Next.js.
3. Добавьте переменные окружения из таблицы выше (минимум: `ADMIN_PASSWORD`,
   `ADMIN_SECRET`, `JWT_SECRET`; плюс Telegram и Supabase).
4. **Storage → Create Database → Blob** и подключите к проекту — токен
   `BLOB_READ_WRITE_TOKEN` добавится сам. **Это обязательный шаг**, если не
   используете Supabase: без Blob и без базы файловая система Vercel
   read-only, и аналитика, новости, баннеры, загрузка фото и пользователи
   не будут сохраняться. Проверить: `/api/health` → `storage` должен быть
   `vercel-blob` или `postgres`, не `ephemeral`.
5. Deploy. После деплоя добавьте свой домен: Project → Settings → Domains →
   `starpassstone.net` (у регистратора направьте DNS по инструкции Vercel).
6. Пропишите `NEXT_PUBLIC_SITE_URL=https://starpassstone.net` и сделайте
   redeploy — это влияет на sitemap, canonical и Open Graph.

Миграции Supabase при деплое: запустите `npm run db:migrate` локально
(с прописанными URL) один раз — Vercel их сам не запускает.

---

## 5. Админ-панель

Адрес: `https://ваш-домен/admin`. Пароль — `ADMIN_PASSWORD`.

| Вкладка | Что там |
|---|---|
| **Dashboard** | Онлайн сейчас, визиты за день/неделю/месяц, последние посещения, лента действий |
| **Analytics** | Популярные страницы, география, источники, устройства, браузеры |
| **Photos** | Фото товаров и галерей хамама/сауны: загрузка, замена, порядок, подписи |
| **News** | Новости: создать, отредактировать, опубликовать/скрыть, удалить |
| **Banners** | Бегущая строка-анонс наверху сайта: текст, ссылка, порядок |
| **Users** | Зарегистрированные пользователи: роли, удаление |
| **Logs** | Полный журнал: визиты, входы, загрузки, заявки, ошибки |
| **Settings** | SEO (title/description/keywords/OG), статус Telegram и БД, **скачать бэкап** |

Бэкап: Settings → «Download backup» — полный JSON-экспорт всех данных.

---

## 6. Фотографии

Все 98 фотографий с оригинального starpassstone.net перенесены в
`web/public/photos/` (1.jpg … 98.jpg) и раздаются самим сайтом с
оптимизацией `next/image` (AVIF/WebP, ленивая загрузка).

- Товары и галереи уже используют эти фото по умолчанию.
- Заменить любое фото можно через админку (**Photos → Replace**) — загруженный
  файл попадёт в Vercel Blob (или в `web/uploads/` локально).
- Неиспользуемые номера (дизайн-проекты, камины, сауны и т.д.) лежат там же —
  их можно добавлять в галереи через админку, указав путь `/photos/NN.jpg`.

---

## 7. Локальный запуск для проверки

```bash
cd web
cp .env.example .env.local   # заполните минимум ADMIN_PASSWORD/ADMIN_SECRET/JWT_SECRET
npm install
npm run dev                  # http://localhost:3000, админка /admin
```

Без Telegram и базы всё работает в демо-режиме: заявки логируются в консоль,
данные хранятся в `web/data/*.json`.
