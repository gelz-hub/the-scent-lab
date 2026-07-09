'use client'

import * as React from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency, type AdminProduct } from '@/lib/admin-products'
import { ProductFormDialog } from '@/components/admin/product-form-dialog'
import { ExportCsvLink } from '@/components/admin/export-csv-link'
import { cn } from '@/lib/utils'

type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return 'Out of Stock'
  if (stock < 15) return 'Low Stock'
  return 'In Stock'
}

const STATUS_CLASSES: Record<StockStatus, string> = {
  'In Stock': 'bg-success/10 text-success',
  'Low Stock': 'bg-amber-500/10 text-amber-600',
  'Out of Stock': 'bg-danger/10 text-danger',
}

export function ProductsClient() {
  const [products, setProducts] = React.useState<AdminProduct[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AdminProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const loadProducts = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products ?? [])
    } catch {
      toast.error('Could not load products')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }, [products, query])

  function handleSaved(product: AdminProduct) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id)
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev]
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Could not delete product')
        return
      }
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success('Product deleted')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} products in catalog
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="bg-foreground text-background hover:bg-brand hover:text-brand-foreground"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Add product
        </Button>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-display text-lg font-medium tracking-tight">
              All products
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, brand or category..."
                  className="pl-9"
                  aria-label="Search products"
                />
              </div>
              <ExportCsvLink href="/api/admin/products/export" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Product</TableHead>
                <TableHead className="hidden md:table-cell">Brand</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
                      <div className="text-sm">Loading products…</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8" strokeWidth={1.25} />
                      <div className="text-sm">
                        {query ? `No products match "${query}"` : 'No products yet — add your first one.'}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const status = getStockStatus(p.stock)
                  const price = p.volumes[0]?.price ?? 0
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">{p.name}</div>
                            <div className="truncate text-xs text-muted-foreground md:hidden">
                              {p.brand}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {p.brand}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {p.category}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(price)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {p.stock}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                            STATUS_CLASSES[status]
                          )}
                        >
                          {status}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${p.name}`}
                            onClick={() => {
                              setEditing(p)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${p.name}`}
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className="h-4 w-4 text-danger" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `"${deleteTarget.name}" will be permanently removed from the catalog. This can't be undone.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-danger text-danger-foreground hover:bg-danger/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
