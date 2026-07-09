'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Search, Boxes, Loader2, AlertTriangle, History, PackagePlus } from 'lucide-react'
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
import { InventoryAdjustDialog } from '@/components/admin/inventory-adjust-dialog'
import { ExportCsvLink } from '@/components/admin/export-csv-link'
import { InventoryHistoryDialog } from '@/components/admin/inventory-history-dialog'

export interface AdminInventoryVariant {
  id: string
  sku: string
  barcode: string | null
  name: string | null
  volumeMl: number | null
  price: number
  status: string
  currentStock: number
  reservedStock: number
  availableStock: number
  safetyStock: number
  reorderLevel: number
  isLowStock: boolean
  product: { id: string; name: string; brand: string; image: string }
}

export function InventoryClient() {
  const [variants, setVariants] = React.useState<AdminInventoryVariant[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [lowStockOnly, setLowStockOnly] = React.useState(false)
  const [adjusting, setAdjusting] = React.useState<AdminInventoryVariant | null>(null)
  const [viewingHistory, setViewingHistory] = React.useState<AdminInventoryVariant | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (lowStockOnly) params.set('lowStock', 'true')
      if (query.trim()) params.set('q', query.trim())
      const res = await fetch(`/api/admin/inventory?${params.toString()}`)
      const data = await res.json()
      setVariants(data.variants ?? [])
    } catch {
      toast.error('Could not load inventory')
    } finally {
      setLoading(false)
    }
  }, [lowStockOnly, query])

  React.useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const lowStockCount = variants.filter((v) => v.isLowStock).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {variants.length} variant{variants.length === 1 ? '' : 's'}
          {lowStockCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />
              {lowStockCount} low on stock
            </span>
          )}
        </p>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-display text-lg font-medium tracking-tight">Stock by variant</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Product, SKU, barcode..."
                  className="pl-9"
                  aria-label="Search inventory"
                />
              </div>
              <Button
                variant={lowStockOnly ? 'default' : 'outline'}
                onClick={() => setLowStockOnly((v) => !v)}
                className="whitespace-nowrap"
              >
                <AlertTriangle className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Low stock only
              </Button>
              <ExportCsvLink href="/api/admin/inventory/export" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Product / Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
                      <div className="text-sm">Loading inventory…</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : variants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Boxes className="h-8 w-8" strokeWidth={1.25} />
                      <div className="text-sm">{query ? `No variants match "${query}"` : 'No variants yet.'}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="pl-6">
                      <div className="font-medium text-foreground">{v.product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.product.brand}
                        {v.name ? ` · ${v.name}` : v.volumeMl ? ` · ${v.volumeMl}ml` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.sku}</TableCell>
                    <TableCell>{formatPrice(v.price)}</TableCell>
                    <TableCell>{v.currentStock}</TableCell>
                    <TableCell className="text-muted-foreground">{v.reservedStock}</TableCell>
                    <TableCell>
                      <span className={cn('font-medium', v.isLowStock && 'text-amber-600')}>{v.availableStock}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                          v.isLowStock ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {v.isLowStock ? 'Low stock' : 'In stock'}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Adjust stock for ${v.sku}`} onClick={() => setAdjusting(v)}>
                          <PackagePlus className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`View history for ${v.sku}`} onClick={() => setViewingHistory(v)}>
                          <History className="h-4 w-4" strokeWidth={1.5} />
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

      <InventoryAdjustDialog
        variant={adjusting}
        open={!!adjusting}
        onOpenChange={(open) => !open && setAdjusting(null)}
        onAdjusted={load}
      />
      <InventoryHistoryDialog
        variant={viewingHistory}
        open={!!viewingHistory}
        onOpenChange={(open) => !open && setViewingHistory(null)}
      />
    </div>
  )
}
