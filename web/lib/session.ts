import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type DbUser = typeof users.$inferSelect

export async function getSession(): Promise<{ user: DbUser } | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress
    if (!email) return null

    // Step 1: try to find existing user first (avoids INSERT on every request)
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing) {
      console.log('SESSION RESULT:', { userId, email })
      return { user: existing }
    }

    // Step 2: user not found — provision
    console.log('[session] INSERT USER', { email, name: clerkUser?.fullName })

    const [inserted] = await db
      .insert(users)
      .values({
        email,
        name: clerkUser?.fullName ?? null,
        role: 'trial',
        onboardingComplete: false,
      })
      .onConflictDoNothing()
      .returning()

    if (inserted) {
      console.log('SESSION RESULT:', { userId, email })
      console.log('[session] provisioned user', { email, id: inserted.id })
      return { user: inserted }
    }

    // Race: another request inserted between our SELECT and INSERT
    const [raceWinner] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    console.log('SESSION RESULT:', { userId, email })
    return raceWinner ? { user: raceWinner } : null
  } catch (e) {
    console.error('SESSION FATAL ERROR:', e)
    throw e
  }
}
