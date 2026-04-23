import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  integer,
  numeric,
  real,
  jsonb,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

// ── AUTH (Auth.js v5 standard shapes) ──────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified'),
  name: text('name'),
  image: text('image'),
  passwordHash: text('password_hash'),
  role: text('role').default('trial').notNull(),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  subscriptionTier: text('subscription_tier').notNull().default('free'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
})

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
})

// ── PLATFORM CONFIG ──────────────────────────────────────────────────────────

export const strategies = pgTable('strategies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  market: text('market').notNull(),
  description: text('description'),
  configSchema: jsonb('config_schema'),
  enabled: boolean('enabled').default(true).notNull(),
  comingSoon: boolean('coming_soon').default(false).notNull(),
  sortOrder: integer('sort_order').notNull(),
})

export const userStrategies = pgTable('user_strategies', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  strategyId: text('strategy_id').notNull().references(() => strategies.id),
  enabled: boolean('enabled').default(true).notNull(),
  config: jsonb('config'),
  minConfidence: text('min_confidence').default('MEDIUM').notNull(),
  notifyOn: text('notify_on').array().default(['HIGH', 'MEDIUM']).notNull(),
  activatedAt: timestamp('activated_at').defaultNow().notNull(),
}, (t) => ({
  pk: uniqueIndex('user_strategies_pk').on(t.userId, t.strategyId),
}))

export const userLeaguePrefs = pgTable('user_league_prefs', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  leagueId: integer('league_id').notNull(),
  leagueName: text('league_name').notNull(),
  country: text('country').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
}, (t) => ({
  pk: uniqueIndex('user_league_prefs_pk').on(t.userId, t.leagueId),
}))

export const userTelegram = pgTable('user_telegram', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  chatId: text('chat_id').notNull(),
  quietStart: text('quiet_start'),
  quietEnd: text('quiet_end'),
  timezone: text('timezone').default('Europe/Berlin').notNull(),
  verified: boolean('verified').default(false).notNull(),
})

export const userColumnMappings = pgTable('user_column_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  headerFingerprint: text('header_fingerprint').notNull(),
  mappingName: text('mapping_name'),
  mapping: jsonb('mapping').notNull(),
  sampleRow: jsonb('sample_row'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  fingerprintIdx: uniqueIndex('user_column_mappings_fingerprint').on(t.userId, t.headerFingerprint),
}))

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  engine: text('engine'),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  link: text('link'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userReadIdx: index('notifications_user_read_idx').on(t.userId, t.readAt, t.createdAt),
}))

export const engineRuns = pgTable('engine_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  routine: text('routine').notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  status: text('status').notNull(),
  summary: text('summary'),
  apiCallsUsed: integer('api_calls_used'),
  memoryFilesWritten: text('memory_files_written').array(),
})

// ── SOCCER SYSTEM TABLES ────────────────────────────────────────────────────

export const soccerLeagues = pgTable('soccer_leagues', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  season: integer('season').notNull(),
})

export const soccerTeams = pgTable('soccer_teams', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  canonical: text('canonical').notNull(),
  aliases: text('aliases').array().default([]).notNull(),
  leagueId: integer('league_id').references(() => soccerLeagues.id),
  logoUrl: text('logo_url'),
})

export const soccerFixtures = pgTable('soccer_fixtures', {
  id: integer('id').primaryKey(),
  leagueId: integer('league_id').notNull(),
  season: integer('season').notNull(),
  kickoff: timestamp('kickoff').notNull(),
  homeTeamId: integer('home_team_id').references(() => soccerTeams.id),
  awayTeamId: integer('away_team_id').references(() => soccerTeams.id),
  homeTeamName: text('home_team_name').notNull(),
  awayTeamName: text('away_team_name').notNull(),
  status: text('status').default('upcoming').notNull(),
  lineupConfidence: numeric('lineup_confidence'),
  dataCompleteness: numeric('data_completeness'),
  dataFlags: jsonb('data_flags'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  kickoffStatusIdx: index('soccer_fixtures_kickoff_status').on(t.kickoff, t.status),
  leagueKickoffIdx: index('soccer_fixtures_league_kickoff').on(t.leagueId, t.kickoff),
}))

export const soccerIntel = pgTable('soccer_intel', {
  fixtureId: integer('fixture_id').primaryKey().references(() => soccerFixtures.id),
  homeLineup: jsonb('home_lineup'),
  awayLineup: jsonb('away_lineup'),
  homeLineupConfidence: numeric('home_lineup_confidence'),
  awayLineupConfidence: numeric('away_lineup_confidence'),
  homeInjuries: jsonb('home_injuries'),
  awayInjuries: jsonb('away_injuries'),
  homeSuspensions: jsonb('home_suspensions'),
  awaySuspensions: jsonb('away_suspensions'),
  homeForm5: jsonb('home_form_5'),
  awayForm5: jsonb('away_form_5'),
  homeForm10: jsonb('home_form_10'),
  awayForm10: jsonb('away_form_10'),
  homeHomeForm: jsonb('home_home_form'),
  awayAwayForm: jsonb('away_away_form'),
  homeCoachTenure: integer('home_coach_tenure'),
  awayCoachTenure: integer('away_coach_tenure'),
  homeRedCardLast3: boolean('home_red_card_last3'),
  awayRedCardLast3: boolean('away_red_card_last3'),
  homeCongestion: integer('home_congestion'),
  awayCongestion: integer('away_congestion'),
  h2h: jsonb('h2h'),
  oddsSnapshot: jsonb('odds_snapshot'),
  marketProbs: jsonb('market_probs'),
  dataCompleteness: numeric('data_completeness'),
  builtAt: timestamp('built_at').defaultNow().notNull(),
  refreshedAt: timestamp('refreshed_at'),
})

export const soccerResults = pgTable('soccer_results', {
  fixtureId: integer('fixture_id').primaryKey().references(() => soccerFixtures.id),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  outcome: text('outcome'),
  gradedAt: timestamp('graded_at').defaultNow().notNull(),
})

// ── IMPORT TABLES ────────────────────────────────────────────────────────────

export const userSoccerImports = pgTable('user_soccer_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  blobUrl: text('blob_url').notNull(),
  originalHeaders: text('original_headers').array(),
  columnMappingId: uuid('column_mapping_id').references(() => userColumnMappings.id),
  rowsParsed: integer('rows_parsed').default(0).notNull(),
  rowsSkipped: integer('rows_skipped').default(0).notNull(),
  unmappedTeams: jsonb('unmapped_teams'),
  status: text('status').default('pending').notNull(),
  errorMessage: text('error_message'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userCreatedIdx: index('user_soccer_imports_user_created').on(t.userId, t.createdAt),
}))

export const userSoccerStats = pgTable('user_soccer_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  importId: uuid('import_id').references(() => userSoccerImports.id),
  league: text('league'),
  season: text('season'),
  teamCanon: text('team_canon').notNull(),
  teamRaw: text('team_raw').notNull(),
  matchDate: date('match_date').notNull(),
  opponent: text('opponent'),
  venue: text('venue'),
  statKey: text('stat_key').notNull(),
  statValue: numeric('stat_value'),
  statText: text('stat_text'),
  sourceRow: jsonb('source_row'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  teamDateStatIdx: index('user_soccer_stats_team_date_stat').on(
    t.userId, t.teamCanon, t.matchDate, t.statKey
  ),
  leagueSeasonTeamIdx: index('user_soccer_stats_league_season_team').on(
    t.userId, t.league, t.season, t.teamCanon
  ),
}))

// ── OPPORTUNITIES ────────────────────────────────────────────────────────────

export const opportunities = pgTable('opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fixtureId: integer('fixture_id').notNull().references(() => soccerFixtures.id),
  strategyId: text('strategy_id').notNull().references(() => strategies.id),
  market: text('market').notNull(),
  pick: text('pick').notNull(),
  confidence: text('confidence').notNull(),
  edge: numeric('edge'),
  guaranteedProfit: numeric('guaranteed_profit'),
  modelProbs: jsonb('model_probs'),
  marketProbs: jsonb('market_probs'),
  oddsSnapshot: jsonb('odds_snapshot'),
  featureSnapshot: jsonb('feature_snapshot').notNull(),
  userStatsUsed: boolean('user_stats_used').default(false).notNull(),
  reasoning: text('reasoning').notNull(),
  passReasons: text('pass_reasons').array(),
  userVerdict: text('user_verdict'),
  userPick: text('user_pick'),
  userOdds: numeric('user_odds'),
  userStake: numeric('user_stake'),
  userNotes: text('user_notes'),
  verdictAt: timestamp('verdict_at'),
  actualOutcome: text('actual_outcome'),
  userPickCorrect: boolean('user_pick_correct'),
  brierScore: numeric('brier_score'),
  roiContribution: numeric('roi_contribution'),
  gradedAt: timestamp('graded_at'),
  publishedAt: timestamp('published_at').defaultNow().notNull(),
}, (t) => ({
  userFixtureStratIdx: uniqueIndex('opportunities_user_fixture_strat').on(
    t.userId, t.fixtureId, t.strategyId
  ),
  userConfidenceIdx: index('opportunities_user_confidence').on(
    t.userId, t.confidence, t.publishedAt
  ),
  userVerdictGradedIdx: index('opportunities_user_verdict_graded').on(
    t.userId, t.userVerdict, t.gradedAt
  ),
  fixtureConfidenceIdx: index('opportunities_fixture_confidence').on(
    t.fixtureId, t.confidence
  ),
}))

// ── CALIBRATION ──────────────────────────────────────────────────────────────

export const userCalibration = pgTable('user_calibration', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  strategyId: text('strategy_id').notNull().references(() => strategies.id),
  period: text('period').notNull(),
  gradedN: integer('graded_n').notNull(),
  highN: integer('high_n'),
  highHitRate: numeric('high_hit_rate'),
  mediumN: integer('medium_n'),
  mediumHitRate: numeric('medium_hit_rate'),
  lowN: integer('low_n'),
  lowHitRate: numeric('low_hit_rate'),
  roi: numeric('roi'),
  computedAt: timestamp('computed_at').defaultNow().notNull(),
}, (t) => ({
  userStratPeriodIdx: uniqueIndex('user_calibration_unique').on(
    t.userId, t.strategyId, t.period
  ),
}))

// ── DEMO DATA MARKER ─────────────────────────────────────────────────────────

export const demoFixtures = pgTable('demo_fixtures', {
  fixtureId: integer('fixture_id').primaryKey(),
})

// ── SUBSCRIPTION SYSTEM ──────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tier: text('tier').notNull().default('free'),
  status: text('status').notNull().default('active'),
  startedAt: timestamp('started_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  // Partial unique index applied via migration — enforces one row per Stripe subscription
  stripeSubIdx: index('subscriptions_stripe_sub_unique').on(t.stripeSubscriptionId),
}))

// ── PREDICTIONS (for calibration tracking) ───────────────────────────────────

export const predictions = pgTable('predictions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  fixtureId: integer('fixture_id').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  league: text('league').notNull(),
  kickoff: timestamp('kickoff').notNull(),
  pick: text('pick').notNull(),
  confidence: text('confidence').notNull(),
  edge: real('edge').notNull(),
  homeOdds: real('home_odds'),
  drawOdds: real('draw_odds'),
  awayOdds: real('away_odds'),
  reasoning: text('reasoning').array(),
  // Structured prediction factors (added Phase D)
  formScore: real('form_score'),
  h2hScore: real('h2h_score'),
  injuryImpact: real('injury_impact'),
  result: text('result'),
  correct: boolean('correct'),
  gradedAt: timestamp('graded_at'),
  notifiedAt: timestamp('notified_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  // DB has a partial unique index (user_id, fixture_id) WHERE user_id IS NOT NULL — applied via migration
  userIdx: index('predictions_user_idx').on(t.userId),
}))

// ── API CACHE ────────────────────────────────────────────────────────────────

export const apiCache = pgTable('api_cache', {
  key: text('key').primaryKey(),
  data: jsonb('data').notNull(),
  cachedAt: timestamp('cached_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
}, (t) => ({
  expiresIdx: index('api_cache_expires_idx').on(t.expiresAt),
}))

// ── CALIBRATION STATS ────────────────────────────────────────────────────────

export const calibration = pgTable('calibration', {
  id: uuid('id').defaultRandom().primaryKey(),
  period: text('period').notNull(),
  confidence: text('confidence').notNull(),
  totalPredictions: integer('total_predictions').notNull(),
  correctPredictions: integer('correct_predictions').notNull(),
  hitRate: real('hit_rate').notNull(),
  avgEdge: real('avg_edge').notNull(),
  passRate: real('pass_rate').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  periodConfUnique: uniqueIndex('calibration_period_conf').on(t.period, t.confidence),
}))
