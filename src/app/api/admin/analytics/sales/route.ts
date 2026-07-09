import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac/require-permission'
import { getSalesAnalytics, getRevenueSnapshot } from '@/lib/analytics/sales'
import { parseRangeFromRequest } from '@/lib/analytics/request'

export async function GET(req: Request) {
  const { allowed } = await requirePermission('analytics', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const range = parseRangeFromRequest(req)
  const [analytics, snapshot] = await Promise.all([getSalesAnalytics(range), getRevenueSnapshot()])
  return NextResponse.json({ ...analytics, snapshot })
}
