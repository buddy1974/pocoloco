import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('[migrate-phase-d] starting...')

  // API cache table
  await sql`
    CREATE TABLE IF NOT EXISTS api_cache (
      key         TEXT PRIMARY KEY,
      data        JSONB NOT NULL,
      cached_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at  TIMESTAMP NOT NULL
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS api_cache_expires_idx ON api_cache(expires_at)`
  console.log('[migrate-phase-d] api_cache table ready')

  // Prediction factor columns
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS form_score REAL`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS h2h_score REAL`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS injury_impact REAL`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP`
  console.log('[migrate-phase-d] prediction factor columns added')

  console.log('[migrate-phase-d] done')
}

main().catch(e => { console.error('[migrate-phase-d] FAILED:', e); process.exit(1) })
