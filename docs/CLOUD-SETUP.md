# Cloud Setup

## 1. Neon Postgres

1. Create account at console.neon.tech
2. New project → region: eu-central-1 (Frankfurt, closest to Germany)
3. Copy the connection string → `DATABASE_URL`
4. Run `pnpm db:push` to create all tables
5. Run `pnpm db:seed` to seed demo data

## 2. Vercel (web app hosting)

1. Push repo to GitHub (`buddy1974/pocoloco`)
2. Import project at vercel.com → select `web/` as root directory
3. Add env vars (see list below)
4. Deploy

## 3. GitHub Actions secrets

In repo Settings → Secrets → Actions, add:

| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `APIFOOTBALL_KEY` | From dashboard.api-football.com |
| `DATABASE_URL` | Same as Vercel |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Your personal chat ID |

## 4. API-Football

1. Register at api-sports.io
2. Free tier: 100 req/day (we use max 95)
3. Copy API key → `APIFOOTBALL_KEY`

## 5. Telegram bot

1. Open @BotFather → `/newbot` → name it PocolocoBot
2. Copy token → `TELEGRAM_BOT_TOKEN`
3. Open @userinfobot → it returns your `id` → `TELEGRAM_ADMIN_CHAT_ID`
4. Start a conversation with your bot first (required before it can message you)

## 6. Vercel Blob

1. Open your Vercel project → Storage → Create Blob store
2. Copy `BLOB_READ_WRITE_TOKEN`

## 7. Resend (email)

1. Register at resend.com
2. Create API key → `RESEND_API_KEY`
3. Set `RESEND_FROM` to a verified sender domain

## Vercel environment variables

Required on Vercel (not GitHub Actions):

```
DATABASE_URL
AUTH_SECRET          # openssl rand -base64 32
AUTH_URL             # https://your-domain.vercel.app
BLOB_READ_WRITE_TOKEN
RESEND_API_KEY
RESEND_FROM
CLAUDE_MODEL         # claude-sonnet-4-6
SEED_OWNER_EMAIL
SEED_OWNER_PASSWORD
SEED_DP_EMAIL
SEED_DP_PASSWORD
```

## First three actions after setup

1. `pnpm db:push` — creates all tables in Neon
2. `pnpm db:seed` — creates owner, design partner, demo data
3. `/ingest-fixtures` locally — first real API-Football call, verify Bundesliga fixtures appear in dashboard
