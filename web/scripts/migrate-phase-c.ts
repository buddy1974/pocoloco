import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('[migrate-phase-c] starting...')

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_sub_unique
    ON subscriptions(stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL
  `
  console.log('[migrate-phase-c] created unique index on subscriptions.stripe_subscription_id')

  console.log('[migrate-phase-c] done')
}

main().catch(e => { console.error('[migrate-phase-c] FAILED:', e); process.exit(1) })
