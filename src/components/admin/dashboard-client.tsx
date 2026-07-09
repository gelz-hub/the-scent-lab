'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Receipt,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  orders,
  topProducts,
  revenueByMonth,
  summaryStats,
  recentActivity,
  formatCurrency,
  formatNumber,
  type OrderStatus,
} from '@/lib/admin-data'
import { cn } from '@/lib/utils'

const STATUS_CLASSES: Record<OrderStatus, string> = {
  Delivered: 'bg-success/10 text-success',
  Shipped: 'bg-brand/10 text-brand',
  Processing: 'bg-amber-500/10 text-amber-600',
  Cancelled: 'bg-danger/10 text-danger',
}

interface StatCardProps {
  label: string
  value: string
  trend: number
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

function StatCard({ label, value, trend, icon: Icon }: StatCardProps) {
  const positive = trend >= 0
  return (
    <Card className="rounded-xl border-border bg-card p-6">
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex items-center justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface text-foreground">
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            )}
          >
            {positive ? (
              <TrendingUp className="h-3 w-3" strokeWidth={2} />
            ) : (
              <TrendingDown className="h-3 w-3" strokeWidth={2} />
            )}
            {positive ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
        </div>
        <div>
          <div className="font-display text-3xl font-medium tracking-tight">
            {value}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface RevenueTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function RevenueTooltip({ active, payload, label }: RevenueTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-foreground">{label}</div>
      <div className="mt-0.5 text-muted-foreground">
        Revenue: <span className="font-semibold text-foreground">{formatCurrency(payload[0].value)}</span>
      </div>
    </div>
  )
}

export function DashboardClient() {
  const recentOrders = orders.slice(0, 5)
  const topFive = topProducts.slice(0, 5)
  const maxRevenue = Math.max(...revenueByMonth.map((d) => d.revenue))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back — here&apos;s how The Scent Lab is performing today.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(summaryStats.totalRevenue)}
          trend={summaryStats.revenueTrend}
          icon={DollarSign}
        />
        <StatCard
          label="Orders"
          value={formatNumber(summaryStats.orders)}
          trend={summaryStats.ordersTrend}
          icon={ShoppingCart}
        />
        <StatCard
          label="Customers"
          value={formatNumber(summaryStats.customers)}
          trend={summaryStats.customersTrend}
          icon={Users}
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(summaryStats.avgOrderValue)}
          trend={summaryStats.aovTrend}
          icon={Receipt}
        />
      </div>

      {/* Revenue chart */}
      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="font-display text-xl font-medium tracking-tight">
              Revenue Overview
            </CardTitle>
            <CardDescription className="mt-1">
              Monthly revenue for the last 12 months
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/admin/analytics">
              View analytics
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${v / 1000}k`}
                  domain={[0, maxRevenue * 1.15]}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--brand)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent orders + Top products */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent orders */}
        <Card className="rounded-xl border-border bg-card lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-xl font-medium tracking-tight">
                Recent Orders
              </CardTitle>
              <CardDescription className="mt-1">Latest 5 orders</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">
                View all
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-6 font-mono text-xs font-medium">
                      {order.number}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.email}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {order.date}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                          STATUS_CLASSES[order.status]
                        )}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="rounded-xl border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-xl font-medium tracking-tight">
              Top Products
            </CardTitle>
            <CardDescription className="mt-1">By units sold this month</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {topFive.map((p, i) => (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold text-foreground">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {p.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {p.brand}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {formatCurrency(p.revenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.units} units
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity feed */}
      <Card className="rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-xl font-medium tracking-tight">
            Recent Activity
          </CardTitle>
          <CardDescription className="mt-1">Latest events across the store</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {recentActivity.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface"
            >
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-foreground">{item.text}</div>
                <div className="text-xs text-muted-foreground">{item.time}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
