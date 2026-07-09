'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, Download } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatPrice } from '@/lib/format'
import { RangeFilter, type RangeFilterValue } from '@/components/admin/analytics/range-filter'
import { KpiCard } from '@/components/admin/analytics/kpi-card'
import { SimpleLineChart, SimpleBarChart, SimplePieChart } from '@/components/admin/analytics/charts'

interface SalesData {
  revenue: number
  previousRevenue: number
  grossSales: number
  netSales: number
  averageOrderValue: number
  orderCount: number
  paidOrderCount: number
  revenuePerDay: { date: string; revenue: number }[]
  ordersPerDay: { date: string; orders: number }[]
  snapshot: { today: number; yesterday: number; monthly: number; yearly: number }
}
interface OrderData { byStatus: Record<string, number>; averageProcessingTimeHours: number; averageDeliveryTimeHours: number }
interface PaymentData { byStatus: Record<string, number>; byMethod: Record<string, number>; revenueByMethod: Record<string, number>; successRate: number; failedCount: number; expiredCount: number }
interface ProductData {
  bestSelling: { productId: string; name: string; qty: number; revenue: number }[]
  highestRevenue: { productId: string; name: string; qty: number; revenue: number }[]
  mostWishlisted: { productId: string; count: number }[]
  lowStockCount: number
  outOfStockCount: number
  slowMoving: { productId: string; name: string; sku: string }[]
}
interface CustomerData {
  newCustomers: number
  activeCustomers: number
  returningCustomers: number
  averageSpend: number
  repeatPurchaseRate: number
  topCustomers: { id: string; name: string | null; email: string; orderCount: number; totalSpend: number }[]
}
interface ShipmentData {
  byStatus: Record<string, number>
  byCourier: Record<string, number>
  failedDeliveries: number
  returnedOrders: number
  averageDeliveryTimeHours: number
}
interface InventoryData {
  currentInventoryValue: number
  reservedInventoryValue: number
  lowStockCount: number
  movementsByType: Record<string, number>
  unitsSold: number
  inventoryTurnover: number
}

export function AnalyticsClient() {
  const [range, setRange] = React.useState<RangeFilterValue>({ preset: '30d' })
  const [loading, setLoading] = React.useState(true)
  const [sales, setSales] = React.useState<SalesData | null>(null)
  const [orders, setOrders] = React.useState<OrderData | null>(null)
  const [payments, setPayments] = React.useState<PaymentData | null>(null)
  const [products, setProducts] = React.useState<ProductData | null>(null)
  const [customers, setCustomers] = React.useState<CustomerData | null>(null)
  const [shipments, setShipments] = React.useState<ShipmentData | null>(null)
  const [inventory, setInventory] = React.useState<InventoryData | null>(null)

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams({ range: range.preset })
    if (range.preset === 'custom' && range.from && range.to) {
      params.set('from', range.from)
      params.set('to', range.to)
    }
    return params.toString()
  }, [range])

  React.useEffect(() => {
    if (range.preset === 'custom' && (!range.from || !range.to)) return
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/analytics/sales?${queryString}`).then((r) => r.json()),
      fetch(`/api/admin/analytics/orders?${queryString}`).then((r) => r.json()),
      fetch(`/api/admin/analytics/payments?${queryString}`).then((r) => r.json()),
      fetch(`/api/admin/analytics/products?${queryString}`).then((r) => r.json()),
      fetch(`/api/admin/analytics/customers?${queryString}`).then((r) => r.json()),
      fetch(`/api/admin/analytics/shipments?${queryString}`).then((r) => r.json()),
      fetch(`/api/admin/analytics/inventory?${queryString}`).then((r) => r.json()),
    ])
      .then(([s, o, p, pr, c, sh, inv]) => {
        if (s.error) throw new Error(s.error)
        setSales(s); setOrders(o); setPayments(p); setProducts(pr); setCustomers(c); setShipments(sh); setInventory(inv)
      })
      .catch(() => toast.error('Could not load analytics'))
      .finally(() => setLoading(false))
  }, [queryString, range.preset, range.from, range.to])

  function exportReport(report: string) {
    window.open(`/api/admin/analytics/export?report=${report}&${queryString}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Read-only reporting — never modifies business data.</p>
        </div>
        <RangeFilter value={range} onChange={setRange} />
      </div>

      {loading || !sales || !orders || !payments || !products || !customers || !shipments || !inventory ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
        </div>
      ) : (
        <Tabs defaultValue="executive">
          <TabsList className="flex-wrap">
            <TabsTrigger value="executive">Executive</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>

          {/* Executive */}
          <TabsContent value="executive" className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Revenue Today" value={formatPrice(sales.snapshot.today)} />
              <KpiCard label="Revenue This Month" value={formatPrice(sales.snapshot.monthly)} />
              <KpiCard label="Orders (range)" value={sales.orderCount} />
              <KpiCard label="Avg Order Value" value={formatPrice(sales.averageOrderValue)} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Revenue per day" onExport={() => exportReport('sales')}>
                <SimpleLineChart data={sales.revenuePerDay} dataKey="revenue" />
              </ChartCard>
              <ChartCard title="Order status distribution" onExport={() => exportReport('orders')}>
                <SimplePieChart data={Object.entries(orders.byStatus).map(([name, value]) => ({ name, value }))} />
              </ChartCard>
            </div>
            <TopList title="Best selling products" rows={products.bestSelling.map((p) => ({ label: p.name, value: `${p.qty} sold · ${formatPrice(p.revenue)}` }))} />
          </TabsContent>

          {/* Sales */}
          <TabsContent value="sales" className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Gross Sales" value={formatPrice(sales.grossSales)} />
              <KpiCard label="Net Sales" value={formatPrice(sales.netSales)} />
              <KpiCard label="Average Order Value" value={formatPrice(sales.averageOrderValue)} />
              <KpiCard label="Paid Orders" value={sales.paidOrderCount} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Revenue per day" onExport={() => exportReport('sales')}>
                <SimpleLineChart data={sales.revenuePerDay} dataKey="revenue" />
              </ChartCard>
              <ChartCard title="Orders per day">
                <SimpleLineChart data={sales.ordersPerDay} dataKey="orders" />
              </ChartCard>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard label="Yesterday" value={formatPrice(sales.snapshot.yesterday)} />
              <KpiCard label="This Month" value={formatPrice(sales.snapshot.monthly)} />
              <KpiCard label="This Year" value={formatPrice(sales.snapshot.yearly)} />
            </div>
          </TabsContent>

          {/* Operations */}
          <TabsContent value="operations" className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Preparing" value={orders.byStatus.PREPARING ?? 0} />
              <KpiCard label="Shipped" value={orders.byStatus.SHIPPED ?? 0} />
              <KpiCard label="Delivered" value={orders.byStatus.DELIVERED ?? 0} />
              <KpiCard label="Cancelled" value={orders.byStatus.CANCELLED ?? 0} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <KpiCard label="Avg Processing Time" value={`${orders.averageProcessingTimeHours.toFixed(1)}h`} />
              <KpiCard label="Avg Delivery Time" value={`${shipments.averageDeliveryTimeHours.toFixed(1)}h`} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Shipment status distribution" onExport={() => exportReport('shipments')}>
                <SimplePieChart data={Object.entries(shipments.byStatus).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))} />
              </ChartCard>
              <ChartCard title="Courier usage">
                <SimpleBarChart data={Object.entries(shipments.byCourier).map(([name, value]) => ({ name, value }))} dataKey="value" />
              </ChartCard>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <KpiCard label="Failed Deliveries" value={shipments.failedDeliveries} />
              <KpiCard label="Returned Orders" value={shipments.returnedOrders} />
            </div>
          </TabsContent>

          {/* Inventory */}
          <TabsContent value="inventory" className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Current Inventory Value" value={formatPrice(inventory.currentInventoryValue)} />
              <KpiCard label="Reserved Inventory Value" value={formatPrice(inventory.reservedInventoryValue)} />
              <KpiCard label="Low Stock Products" value={inventory.lowStockCount} />
              <KpiCard label="Out of Stock" value={products.outOfStockCount} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <KpiCard label="Units Sold (range)" value={inventory.unitsSold} />
              <KpiCard label="Inventory Turnover" value={inventory.inventoryTurnover.toFixed(2)} sublabel="units sold ÷ current stock" />
            </div>
            <ChartCard title="Stock movements by type" onExport={() => exportReport('inventory')}>
              <SimpleBarChart data={Object.entries(inventory.movementsByType).map(([name, value]) => ({ name, value }))} dataKey="value" />
            </ChartCard>
            <TopList title="Slow moving products" rows={products.slowMoving.map((p) => ({ label: p.name, value: p.sku }))} />
          </TabsContent>

          {/* Customer */}
          <TabsContent value="customer" className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="New Customers" value={customers.newCustomers} />
              <KpiCard label="Returning Customers" value={customers.returningCustomers} />
              <KpiCard label="Average Spend" value={formatPrice(customers.averageSpend)} />
              <KpiCard label="Repeat Purchase Rate" value={`${(customers.repeatPurchaseRate * 100).toFixed(1)}%`} />
            </div>
            <TopList
              title="Top customers"
              rows={customers.topCustomers.map((c) => ({ label: c.name || c.email, value: `${c.orderCount} orders · ${formatPrice(c.totalSpend)}` }))}
              onExport={() => exportReport('customers')}
            />
          </TabsContent>

          {/* Finance */}
          <TabsContent value="finance" className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Payment Success Rate" value={`${(payments.successRate * 100).toFixed(1)}%`} />
              <KpiCard label="Failed Payments" value={payments.failedCount} />
              <KpiCard label="Expired Payments" value={payments.expiredCount} />
              <KpiCard label="Gross Sales" value={formatPrice(sales.grossSales)} />
            </div>
            <ChartCard title="Revenue by payment method" onExport={() => exportReport('payments')}>
              <SimpleBarChart data={Object.entries(payments.revenueByMethod).map(([name, value]) => ({ name, value }))} dataKey="value" />
            </ChartCard>
            <ChartCard title="Payment method usage">
              <SimplePieChart data={Object.entries(payments.byMethod).map(([name, value]) => ({ name, value }))} />
            </ChartCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function ChartCard({ title, children, onExport }: { title: string; children: React.ReactNode; onExport?: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-medium">{title}</h3>
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Export
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function TopList({ title, rows, onExport }: { title: string; rows: { label: string; value: string }[]; onExport?: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-medium">{title}</h3>
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Export
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data for this range.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <span className="truncate">{r.label}</span>
              <span className="text-muted-foreground">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
