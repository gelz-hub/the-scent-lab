import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac/require-permission'
import { toCsv, csvResponseHeaders } from '@/lib/export/csv'
import { parseRangeFromRequest } from '@/lib/analytics/request'
import { getSalesAnalytics } from '@/lib/analytics/sales'
import { getOrderAnalytics } from '@/lib/analytics/orders'
import { getPaymentAnalytics } from '@/lib/analytics/payments'
import { getProductAnalytics } from '@/lib/analytics/products'
import { getCustomerAnalytics } from '@/lib/analytics/customers'
import { getShipmentAnalytics } from '@/lib/analytics/shipments'
import { getInventoryAnalytics } from '@/lib/analytics/inventory'
import { REPORTS, type Report } from '@/lib/analytics/report-types'

/**
 * Exports the exact same data the corresponding dashboard tab renders — it
 * calls the identical `get*Analytics()` function each `/api/admin/analytics/*`
 * route calls, over the same resolved date range, so the CSV can never drift
 * from what's on screen. CSV only (opens natively in Excel); true XLSX
 * (multi-sheet, formatted) and PDF are not implemented — see
 * src/lib/analytics/README.md, "Export".
 */
export async function GET(req: Request) {
  const { allowed } = await requirePermission('analytics', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const report = searchParams.get('report') as Report | null
  if (!report || !REPORTS.includes(report)) {
    return NextResponse.json({ error: `report must be one of: ${REPORTS.join(', ')}` }, { status: 400 })
  }

  const range = parseRangeFromRequest(req)
  const { header, rows } = await buildReport(report, range)

  return new NextResponse(toCsv(header, rows), { headers: csvResponseHeaders(`analytics-${report}`) })
}

async function buildReport(report: Report, range: Parameters<typeof getSalesAnalytics>[0]) {
  switch (report) {
    case 'sales': {
      const data = await getSalesAnalytics(range)
      return {
        header: ['Date', 'Revenue', 'Orders'],
        rows: data.revenuePerDay.map((r, i) => [r.date, r.revenue.toFixed(2), data.ordersPerDay[i]?.orders ?? 0]),
      }
    }
    case 'orders': {
      const data = await getOrderAnalytics(range)
      return {
        header: ['Status', 'Count'],
        rows: Object.entries(data.byStatus).map(([status, count]) => [status, count]),
      }
    }
    case 'payments': {
      const data = await getPaymentAnalytics(range)
      return {
        header: ['Method', 'Count', 'Revenue'],
        rows: Object.entries(data.byMethod).map(([method, count]) => [method, count, (data.revenueByMethod[method] ?? 0).toFixed(2)]),
      }
    }
    case 'products': {
      const data = await getProductAnalytics(range)
      return {
        header: ['Product ID', 'Name', 'Qty Sold', 'Revenue'],
        rows: data.bestSelling.map((p) => [p.productId, p.name, p.qty, p.revenue.toFixed(2)]),
      }
    }
    case 'customers': {
      const data = await getCustomerAnalytics(range)
      return {
        header: ['Name', 'Email', 'Order Count', 'Total Spend'],
        rows: data.topCustomers.map((c) => [c.name ?? '', c.email, c.orderCount, c.totalSpend.toFixed(2)]),
      }
    }
    case 'shipments': {
      const data = await getShipmentAnalytics(range)
      return {
        header: ['Status', 'Count'],
        rows: Object.entries(data.byStatus).map(([status, count]) => [status, count]),
      }
    }
    case 'inventory': {
      const data = await getInventoryAnalytics(range)
      return {
        header: ['Metric', 'Value'],
        rows: [
          ['Current Inventory Value', data.currentInventoryValue.toFixed(2)],
          ['Reserved Inventory Value', data.reservedInventoryValue.toFixed(2)],
          ['Low Stock Count', data.lowStockCount],
          ['Units Sold', data.unitsSold],
          ['Inventory Turnover', data.inventoryTurnover.toFixed(2)],
        ],
      }
    }
  }
}
