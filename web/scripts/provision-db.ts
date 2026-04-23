import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL not set')

const sql = neon(url)

async function run() {
  console.log('Provisioning schema...')

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      email_verified TIMESTAMPTZ,
      name TEXT,
      image TEXT,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'trial',
      onboarding_complete BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log('✓ users')

  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT
    )
  `
  console.log('✓ accounts')

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      session_token TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMPTZ NOT NULL
    )
  `
  console.log('✓ sessions')

  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires TIMESTAMPTZ NOT NULL
    )
  `
  console.log('✓ verification_tokens')

  await sql`
    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      market TEXT NOT NULL,
      description TEXT,
      config_schema JSONB,
      enabled BOOLEAN NOT NULL DEFAULT true,
      coming_soon BOOLEAN NOT NULL DEFAULT false,
      sort_order INTEGER NOT NULL
    )
  `
  console.log('✓ strategies')

  await sql`
    CREATE TABLE IF NOT EXISTS user_strategies (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      strategy_id TEXT NOT NULL REFERENCES strategies(id),
      enabled BOOLEAN NOT NULL DEFAULT true,
      config JSONB,
      min_confidence TEXT NOT NULL DEFAULT 'MEDIUM',
      notify_on TEXT[] NOT NULL DEFAULT ARRAY['HIGH','MEDIUM'],
      activated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_strategies_pk ON user_strategies(user_id, strategy_id)`
  console.log('✓ user_strategies')

  await sql`
    CREATE TABLE IF NOT EXISTS user_league_prefs (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      league_id INTEGER NOT NULL,
      league_name TEXT NOT NULL,
      country TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT true
    )
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_league_prefs_pk ON user_league_prefs(user_id, league_id)`
  console.log('✓ user_league_prefs')

  await sql`
    CREATE TABLE IF NOT EXISTS user_telegram (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      chat_id TEXT NOT NULL,
      quiet_start TEXT,
      quiet_end TEXT,
      timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
      verified BOOLEAN NOT NULL DEFAULT false
    )
  `
  console.log('✓ user_telegram')

  await sql`
    CREATE TABLE IF NOT EXISTS user_column_mappings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      header_fingerprint TEXT NOT NULL,
      mapping_name TEXT,
      mapping JSONB NOT NULL,
      sample_row JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_column_mappings_fingerprint ON user_column_mappings(user_id, header_fingerprint)`
  console.log('✓ user_column_mappings')

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      engine TEXT,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read_at, created_at)`
  console.log('✓ notifications')

  await sql`
    CREATE TABLE IF NOT EXISTS engine_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      routine TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      ended_at TIMESTAMPTZ,
      status TEXT NOT NULL,
      summary TEXT,
      api_calls_used INTEGER,
      memory_files_written TEXT[]
    )
  `
  console.log('✓ engine_runs')

  await sql`
    CREATE TABLE IF NOT EXISTS soccer_leagues (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      season INTEGER NOT NULL
    )
  `
  console.log('✓ soccer_leagues')

  await sql`
    CREATE TABLE IF NOT EXISTS soccer_teams (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      canonical TEXT NOT NULL,
      aliases TEXT[] NOT NULL DEFAULT '{}',
      league_id INTEGER REFERENCES soccer_leagues(id),
      logo_url TEXT
    )
  `
  console.log('✓ soccer_teams')

  await sql`
    CREATE TABLE IF NOT EXISTS soccer_fixtures (
      id INTEGER PRIMARY KEY,
      league_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      kickoff TIMESTAMPTZ NOT NULL,
      home_team_id INTEGER REFERENCES soccer_teams(id),
      away_team_id INTEGER REFERENCES soccer_teams(id),
      home_team_name TEXT NOT NULL,
      away_team_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'upcoming',
      lineup_confidence NUMERIC,
      data_completeness NUMERIC,
      data_flags JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS soccer_fixtures_kickoff_status ON soccer_fixtures(kickoff, status)`
  await sql`CREATE INDEX IF NOT EXISTS soccer_fixtures_league_kickoff ON soccer_fixtures(league_id, kickoff)`
  console.log('✓ soccer_fixtures')

  await sql`
    CREATE TABLE IF NOT EXISTS soccer_intel (
      fixture_id INTEGER PRIMARY KEY REFERENCES soccer_fixtures(id),
      home_lineup JSONB,
      away_lineup JSONB,
      home_lineup_confidence NUMERIC,
      away_lineup_confidence NUMERIC,
      home_injuries JSONB,
      away_injuries JSONB,
      home_suspensions JSONB,
      away_suspensions JSONB,
      home_form_5 JSONB,
      away_form_5 JSONB,
      home_form_10 JSONB,
      away_form_10 JSONB,
      home_home_form JSONB,
      away_away_form JSONB,
      home_coach_tenure INTEGER,
      away_coach_tenure INTEGER,
      home_red_card_last3 BOOLEAN,
      away_red_card_last3 BOOLEAN,
      home_congestion INTEGER,
      away_congestion INTEGER,
      h2h JSONB,
      odds_snapshot JSONB,
      market_probs JSONB,
      data_completeness NUMERIC,
      built_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      refreshed_at TIMESTAMPTZ
    )
  `
  console.log('✓ soccer_intel')

  await sql`
    CREATE TABLE IF NOT EXISTS soccer_results (
      fixture_id INTEGER PRIMARY KEY REFERENCES soccer_fixtures(id),
      home_score INTEGER,
      away_score INTEGER,
      outcome TEXT,
      graded_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log('✓ soccer_results')

  await sql`
    CREATE TABLE IF NOT EXISTS user_soccer_imports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      blob_url TEXT NOT NULL,
      original_headers TEXT[],
      column_mapping_id UUID REFERENCES user_column_mappings(id),
      rows_parsed INTEGER NOT NULL DEFAULT 0,
      rows_skipped INTEGER NOT NULL DEFAULT 0,
      unmapped_teams JSONB,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS user_soccer_imports_user_created ON user_soccer_imports(user_id, created_at)`
  console.log('✓ user_soccer_imports')

  await sql`
    CREATE TABLE IF NOT EXISTS user_soccer_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      import_id UUID REFERENCES user_soccer_imports(id),
      league TEXT,
      season TEXT,
      team_canon TEXT NOT NULL,
      team_raw TEXT NOT NULL,
      match_date DATE NOT NULL,
      opponent TEXT,
      venue TEXT,
      stat_key TEXT NOT NULL,
      stat_value NUMERIC,
      stat_text TEXT,
      source_row JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS user_soccer_stats_team_date_stat ON user_soccer_stats(user_id, team_canon, match_date, stat_key)`
  await sql`CREATE INDEX IF NOT EXISTS user_soccer_stats_league_season_team ON user_soccer_stats(user_id, league, season, team_canon)`
  console.log('✓ user_soccer_stats')

  await sql`
    CREATE TABLE IF NOT EXISTS opportunities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      fixture_id INTEGER NOT NULL REFERENCES soccer_fixtures(id),
      strategy_id TEXT NOT NULL REFERENCES strategies(id),
      market TEXT NOT NULL,
      pick TEXT NOT NULL,
      confidence TEXT NOT NULL,
      edge NUMERIC,
      guaranteed_profit NUMERIC,
      model_probs JSONB,
      market_probs JSONB,
      odds_snapshot JSONB,
      feature_snapshot JSONB NOT NULL,
      user_stats_used BOOLEAN NOT NULL DEFAULT false,
      reasoning TEXT NOT NULL,
      pass_reasons TEXT[],
      user_verdict TEXT,
      user_pick TEXT,
      user_odds NUMERIC,
      user_stake NUMERIC,
      user_notes TEXT,
      verdict_at TIMESTAMPTZ,
      actual_outcome TEXT,
      user_pick_correct BOOLEAN,
      brier_score NUMERIC,
      roi_contribution NUMERIC,
      graded_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS opportunities_user_fixture_strat ON opportunities(user_id, fixture_id, strategy_id)`
  await sql`CREATE INDEX IF NOT EXISTS opportunities_user_confidence ON opportunities(user_id, confidence, published_at)`
  await sql`CREATE INDEX IF NOT EXISTS opportunities_user_verdict_graded ON opportunities(user_id, user_verdict, graded_at)`
  await sql`CREATE INDEX IF NOT EXISTS opportunities_fixture_confidence ON opportunities(fixture_id, confidence)`
  console.log('✓ opportunities')

  await sql`
    CREATE TABLE IF NOT EXISTS user_calibration (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      strategy_id TEXT NOT NULL REFERENCES strategies(id),
      period TEXT NOT NULL,
      graded_n INTEGER NOT NULL,
      high_n INTEGER,
      high_hit_rate NUMERIC,
      medium_n INTEGER,
      medium_hit_rate NUMERIC,
      low_n INTEGER,
      low_hit_rate NUMERIC,
      roi NUMERIC,
      computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_calibration_unique ON user_calibration(user_id, strategy_id, period)`
  console.log('✓ user_calibration')

  await sql`
    CREATE TABLE IF NOT EXISTS demo_fixtures (
      fixture_id INTEGER PRIMARY KEY
    )
  `
  console.log('✓ demo_fixtures')

  console.log('\n✅ All tables provisioned successfully.')
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
