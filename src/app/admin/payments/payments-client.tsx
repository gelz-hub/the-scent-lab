'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Search, CreditCard, Loader2, Eye } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/format'
import { PAYMENT_STATUSES, paymentStatusLabel } from '@/lib/payment/config'
import { PaymentDetailDialog } from '@/components/admin/payment-detail-dialog'

export interface AdminPayment {
  id: string
  method: string
  provider: string
  status: string
  totalAmount: number
  currency: string
  paidAt: string | null
  expiresAt: string | null
  createdAt: string
  providerReference: string | null
  providerTransactionId: string | null
  order: {
    orderNumber: string
    user: { name: string | null; email: string }
  }
}

const STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  PROCESSING: 'bg-amber-500/10 text-amber-600',
  PAID: 'bg-success/10 text-success',
  FAILED: 'bg-danger/10 text-danger',
  EXPIRED: 'bg-danger/10 text-danger',
  REFUNDED: 'bg-brand/10 text-brand',
  PARTIALLY_REFUNDED: 'bg-brand/10 text-brand',
  CANCELLED: 'bg-danger/10 text-danger',
}

export function PaymentsClient() {
  const [payments, setPayments] = React.useState<AdminPayment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [viewingId, setViewingId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (query.trim()) params.set('q', query.trim())
      const res = await fetch(`/api/admin/payments?${params.toString()}`)
      const data = await res.json()
      setPayments(data.payments ?? [])
    } catch {
      toast.error('Could not load payments')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, query])

  React.useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {payments.length} payment{payments.length === 1 ? '' : 's'} · view, search, verify, and export
        </p>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-display text-lg font-medium tracking-tight">All payments</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Order #, email, transaction..."
                  className="pl-9"
                  aria-label="Search payments"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{paymentStatusLabel(s)}</option>
                ))}
              </select>
              <a
                href={`/api/admin/payments/export?${new URLSearchParams(statusFilter !== 'all' ? { status: statusFilter } : {}).toString()}`}
                className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium transition-colors hover:border-foreground/40"
              >
                Export CSV
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Order</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
                      <div className="text-sm">Loading payments…</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="h-8 w-8" strokeWidth={1.25} />
                      <div className="text-sm">{query ? `No payments match "${query}"` : 'No payments yet.'}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-6">
                      <div className="font-medium text-foreground">{p.order.orderNumber}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      <div>{p.order.user.name || '—'}</div>
                      <div className="text-xs">{p.order.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{p.method.replace(/_/g, ' ')}</div>
                    </TableCell>
                    <TableCell>{formatPrice(p.totalAmount)}</TableCell>
                    <TableCell>
                      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', STATUS_CLASSES[p.status])}>
                        {paymentStatusLabel(p.status)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon" aria-label={`View payment for ${p.order.orderNumber}`} onClick={() => setViewingId(p.id)}>
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaymentDetailDialog
        paymentId={viewingId}
        open={!!viewingId}
        onOpenChange={(open) => !open && setViewingId(null)}
        onChanged={load}
      />
    </div>
  )
}
