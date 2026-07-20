// One-time migration: imports every existing Prisma `User` row into Firebase
// Auth, reusing the Prisma id as the Firebase uid and importing the existing
// bcrypt password hash directly (Firebase Admin's importUsers supports
// BCRYPT natively) so nobody has to reset their password. Safe to re-run —
// users already present in Firebase are skipped.
//
// Usage: npx tsx scripts/migrate-users-to-firebase.ts
//
// IMPORTANT: run this against a staging Firebase project + DB copy first
// and verify a sample of imported users can sign in with their existing
// password before running it against production. See the migration plan.

import { db } from '../src/lib/db'
import { getAdminAuth } from '../src/lib/firebase/admin-auth'

const BATCH_SIZE = 1000

async function main() {
  const auth = getAdminAuth()
  const users = await db.user.findMany({
    where: { passwordHash: { not: null } },
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
  })

  console.log(`Found ${users.length} users with a password hash to migrate.`)

  let imported = 0
  let skipped = 0
  const errors: { email: string; error: string }[] = []

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE)

    const existing = await Promise.all(
      batch.map((u) =>
        auth
          .getUser(u.id)
          .then(() => true)
          .catch(() => false)
      )
    )
    const toImport = batch.filter((_, idx) => !existing[idx])
    skipped += batch.length - toImport.length

    if (toImport.length === 0) continue

    const result = await auth.importUsers(
      toImport.map((u) => ({
        uid: u.id,
        email: u.email,
        displayName: u.name ?? undefined,
        passwordHash: Buffer.from(u.passwordHash as string),
        customClaims: { role: u.role },
      })),
      {
        hash: {
          algorithm: 'BCRYPT',
        },
      }
    )

    imported += result.successCount
    for (const err of result.errors) {
      const failedUser = toImport[err.index]
      errors.push({ email: failedUser.email, error: err.error.message })
    }
  }

  console.log(`Imported: ${imported}`)
  console.log(`Already present (skipped): ${skipped}`)
  if (errors.length) {
    console.log(`Failed: ${errors.length}`)
    for (const e of errors) console.log(`  - ${e.email}: ${e.error}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
