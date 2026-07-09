import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPaymentEnvironment } from '@/lib/payment/config'
import { logger } from '@/lib/logging/logger'

// Public, read-only health check for uptime monitors / load balancers.
// Reports config presence and reachability, never secret values. Each check
// is independent — one dependency being down never throws the others, so a
// single outage doesn't hide the rest of the picture.

type CheckStatus = 'ok' | 'error' | 'not_configured'
interface Check {
  status: CheckStatus
  detail?: string
}

async function checkDatabase(): Promise<Check> {
  try {
    await db.$queryRaw`SELECT 1`
    return { status: 'ok' }
  } catch (error) {
    logger.error('system', 'health_check_failed', { check: 'database', error })
    return { status: 'error', detail: 'Query failed.' }
  }
}

function checkCloudinary(): Check {
  const configured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  )
  return configured ? { status: 'ok' } : { status: 'not_configured' }
}

function checkFirebase(): Check {
  const configured = Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
  )
  return configured ? { status: 'ok' } : { status: 'not_configured' }
}

function checkGeoapify(): Check {
  return process.env.GEOAPIFY_API_KEY ? { status: 'ok' } : { status: 'not_configured' }
}

function checkPaymentProvider(): Check {
  const env = getPaymentEnvironment()
  const prefix = env === 'production' ? 'PAYWAY_PRODUCTION' : 'PAYWAY_SANDBOX'
  const configured = Boolean(
    process.env[`${prefix}_MERCHANT_ID`] && process.env[`${prefix}_API_KEY`] && process.env[`${prefix}_API_URL`]
  )
  return configured ? { status: 'ok', detail: env } : { status: 'not_configured', detail: env }
}

export async function GET() {
  const [database] = await Promise.all([checkDatabase()])
  const checks = {
    database,
    cloudinary: checkCloudinary(),
    firebase: checkFirebase(),
    geoapify: checkGeoapify(),
    paymentProvider: checkPaymentProvider(),
  }

  // Only the database is treated as a hard dependency for overall status —
  // the others are optional integrations that degrade gracefully when unset.
  const healthy = checks.database.status === 'ok'

  return NextResponse.json(
    { status: healthy ? 'ok' : 'error', checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  )
}
