# Pocoloco — Lessons Learned

## L001 — Seed `onConflictDoNothing` silently locks in wrong hashes

**What happened:** Seed ran once without env vars set (dotenv not installed at the time), so users were inserted with fallback passwords (`demo-owner`, `demo-dp`). Subsequent seed runs with correct env vars were silently no-ops because `onConflictDoNothing()` skips existing rows. Pills sent the correct passwords but bcrypt.compare failed against the wrong hashes.

**Fix applied:** Direct `UPDATE users SET password_hash = ...` via node script to overwrite with hashes of the real credentials.

**Rule going forward:**
- For user/credential rows, prefer `onConflictDoUpdate({ set: { passwordHash: ... } })` so re-seeding with corrected env vars actually takes effect.
- Always verify seed ran with env vars before trusting the DB state. Run: `SELECT email, role FROM users` and cross-check against `.env.local`.
- Never use `onConflictDoNothing` for rows whose correctness depends on runtime env vars (passwords, secrets, config).
