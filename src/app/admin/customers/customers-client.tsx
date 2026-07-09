'use client'

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Search, Loader2, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExportCsvLink } from '@/components/admin/export-csv-link'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPrice } from '@/lib/format'

interface Customer {
  id: string
  name: string | null
  email: string
  phone: string | null
  orderCount: number
  totalSpent: number
  createdAt: string
}

export function CustomersClient() {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      const res = await fetch(`/api/admin/customers?${params.toString()}`)
      const data = await res.json()
      setCustomers(data.customers ?? [])
    } catch {
      toast.error('Could not load customers')
    } finally {
      setLoading(false)
    }
  }, [query])

  React.useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">{customers.length} customer{customers.length === 1 ? '' : 's'} · view profile and order history (read-only)</p>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-display text-lg font-medium tracking-tight">All customers</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email, phone..." className="pl-9" aria-label="Search customers" />
              </div>
              <ExportCsvLink href="/api/admin/customers/export" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total spent</TableHead>
                <TableHead className="pr-6">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" strokeWidth={1.5} />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Users className="mx-auto h-8 w-8" strokeWidth={1.25} />
                    <div className="mt-2 text-sm">No customers found.</div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell className="pl-6">
                      <Link href={`/admin/customers/${c.id}`} className="block">
                        <div className="font-medium text-foreground hover:underline">{c.name || 'Unnamed'}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.phone || '—'}</TableCell>
                    <TableCell>{c.orderCount}</TableCell>
                    <TableCell>{formatPrice(c.totalSpent)}</TableCell>
                    <TableCell className="pr-6 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
