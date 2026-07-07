'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Search, Eye, Users } from 'lucide-react'
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
import { customers, formatCurrency } from '@/lib/admin-data'
import { cn } from '@/lib/utils'

// Deterministic background color for initials avatar based on customer id
const AVATAR_TONES = [
  'bg-brand/15 text-brand',
  'bg-success/15 text-success',
  'bg-amber-500/15 text-amber-600',
  'bg-foreground/10 text-foreground',
  'bg-danger/15 text-danger',
]

function toneFor(id: string): string {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
}

export function UsersClient() {
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    )
  }, [query])

  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const totalOrders = customers.reduce((sum, c) => sum + c.orders, 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {customers.length} customers · {totalOrders} orders · {formatCurrency(totalSpent)} lifetime value
          </p>
        </div>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-display text-lg font-medium tracking-tight">
              All customers
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email or location..."
                className="pl-9"
                aria-label="Search customers"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8" strokeWidth={1.25} />
                      <div className="text-sm">No customers match &quot;{query}&quot;</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold',
                            toneFor(c.id)
                          )}
                          aria-hidden
                        >
                          {c.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{c.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {c.location}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {c.orders}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(c.totalSpent)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {c.joined}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`View ${c.name}`}
                          onClick={() => toast('View customer', { description: `${c.name} · ${c.email}` })}
                        >
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
    </div>
  )
}
