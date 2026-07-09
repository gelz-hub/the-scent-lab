// Payment analytics — read-only aggregates against Payment. Never calls
// PaymentService's verify/reserve/commit functions.

import { db } from '@/lib/db'
import { cached } from './cache'
import type { DateRange } from './date-ranges'

export async function getPaymentAnalytics(range: DateRange) {
  return cached(`payments:${range.start.getTime()}:${range.end.getTime()}`, async () => {
    const [statusCounts, methodCounts, revenueByMethod] = await Promise.all([
      db.payment.groupBy({ by: ['status'], where: { createdAt: { gte: range.start, lte: range.end } }, _count: true }),
      db.payment.groupBy({ by: ['method'], where: { createdAt: { gte: range.start, lte: range.end } }, _count: true }),
      db.payment.groupBy({
        by: ['method'],
        where: { status: 'PAID', paidAt: { gte: range.start, lte: range.end } },
        _sum: { totalAmount: true },
      }),
    ])

    const byStatus = Object.fromEntries(statusCounts.map((r) => [r.status, r._count]))
    const byMethod = Object.fromEntries(methodCounts.map((r) => [r.method, r._count]))
    const revenueByMethodMap = Object.fromEntries(revenueByMethod.map((r) => [r.method, r._sum.totalAmount ?? 0]))

    const paid = byStatus.PAID ?? 0
    const failed = byStatus.FAILED ?? 0
    const expired = byStatus.EXPIRED ?? 0
    const totalAttempts = Object.values(byStatus).reduce((a, b) => a + b, 0)
    // Success rate — PAID divided by every attempt that reached a
    // terminal-for-that-purpose state (PAID/FAILED/EXPIRED); PENDING/
    // PROCESSING attempts are still in flight and excluded from the
    // denominator so the rate isn't artificially dragged down by payments
    // nobody has finished yet.
    const decided = paid + failed + expired
    const successRate = decided > 0 ? paid / decided : 0

    return {
      byStatus,
      byMethod,
      revenueByMethod: revenueByMethodMap,
      successRate,
      failedCount: failed,
      expiredCount: expired,
      totalAttempts,
    }
  })
}
