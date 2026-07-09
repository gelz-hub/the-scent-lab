import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac/require-permission'
import { getOrderAnalytics } from '@/lib/analytics/orders'
import { parseRangeFromRequest } from '@/lib/analytics/request'

export async function GET(req: Request) {
  const { allowed } = await requirePermission('analytics', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  return NextResponse.json(await getOrderAnalytics(parseRangeFromRequest(req)))
}
