import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('[migrate-phase-b] starting...')

  await sql`
    ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL
  `
  console.log('[migrate-phase-b] user_id column added')

  await sql`DROP INDEX IF EXISTS predictions_fixture_unique`
  console.log('[migrate-phase-b] dropped predictions_fixture_unique')

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS predictions_user_fixture_unique
    ON predictions(user_id, fixture_id)
    WHERE user_id IS NOT NULL
  `
  console.log('[migrate-phase-b] created partial unique index (user_id, fixture_id) WHERE user_id IS NOT NULL')

  console.log('[migrate-phase-b] done')
}

main().catch(e => { console.error('[migrate-phase-b] FAILED:', e); process.exit(1) })
