import type { Config } from 'drizzle-kit'

export default {
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: '../db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL! },
  tablesFilter: ['!ingested_content'],
} satisfies Config
