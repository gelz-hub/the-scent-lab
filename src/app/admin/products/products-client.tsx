'use client'

import * as React from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Columns3,
  Eye,
  CheckCircle2,
} from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, type AdminProduct } from '@/lib/admin-products'
import { ProductFormDialog } from '@/components/admin/product-form-dialog'
import { ExportCsvLink } from '@/components/admin/export-csv-link'
import { cn } from '@/lib/utils'

type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'
type SortKey = 'newest' | 'name-asc' | 'price-asc' | 'price-desc' | 'stock-asc'

const PAGE_SIZE = 20

const OPTIONAL_COLUMNS = [
  { key: 'sku', label: 'SKU' },
  { key: 'created', label: 'Created' },
  { key: 'updated', label: 'Updated' },
  { key: 'views', label: 'Views' },
] as const
type OptionalColumnKey = (typeof OPTIONAL_COLUMNS)[number]['key']

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

const PUBLISH_CLASSES: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success',
  DRAFT: 'bg-muted text-muted-foreground',
  ARCHIVED: 'bg-danger/10 text-danger',
  OUT_OF_STOCK: 'bg-amber-500/10 text-amber-600',
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'name-asc', label: 'Name (A–Z)' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'stock-asc', label: 'Stock: Low to High' },
]

export function ProductsClient() {
  const [products, setProducts] = React.useState<AdminProduct[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState<'all' | StockStatus>('all')
  const [sort, setSort] = React.useState<SortKey>('newest')
  const [page, setPage] = React.useState(1)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AdminProduct | null>(null)
  const [duplicateSeed, setDuplicateSeed] = React.useState<Partial<AdminProduct> | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [editingStockId, setEditingStockId] = React.useState<string | null>(null)
  const [stockDraft, setStockDraft] = React.useState('')
  const [savingStock, setSavingStock] = React.useState(false)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [visibleColumns, setVisibleColumns] = React.useState<Set<OptionalColumnKey>>(new Set())
  const [bulkBusy, setBulkBusy] = React.useState(false)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = React.useState(false)
  const [successProduct, setSuccessProduct] = React.useState<AdminProduct | null>(null)

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

  const categoryOptions = React.useMemo(
    () => Array.from(new Set(products.map((p) => p.gender))).sort(),
    [products]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q)
      const matchesCategory = categoryFilter === 'all' || p.gender === categoryFilter
      const matchesStatus = statusFilter === 'all' || getStockStatus(p.stock) === statusFilter
      return matchesQuery && matchesCategory && matchesStatus
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'price-asc':
          return (a.volumes[0]?.price ?? 0) - (b.volumes[0]?.price ?? 0)
        case 'price-desc':
          return (b.volumes[0]?.price ?? 0) - (a.volumes[0]?.price ?? 0)
        case 'stock-asc':
          return a.stock - b.stock
        default:
          return 0
      }
    })

    return list
  }, [products, query, categoryFilter, statusFilter, sort])

  React.useEffect(() => {
    setPage(1)
  }, [query, categoryFilter, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const shown = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const allShownSelected = shown.length > 0 && shown.every((p) => selected.has(p.id))

  function toggleColumn(key: OptionalColumnKey) {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleSelectAllShown() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allShownSelected) {
        shown.forEach((p) => next.delete(p.id))
      } else {
        shown.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSaved(product: AdminProduct, wasCreate: boolean) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id)
      return exists ? prev.map((p) => (p.id === product.id ? product : p)) : [product, ...prev]
    })
    if (wasCreate) {
      setDialogOpen(false)
      setSuccessProduct(product)
    }
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

  function startStockEdit(p: AdminProduct) {
    setEditingStockId(p.id)
    setStockDraft(String(p.stock))
  }

  async function saveStock(p: AdminProduct) {
    const value = Number(stockDraft)
    if (Number.isNaN(value) || value < 0) {
      toast.error('Enter a valid stock number')
      return
    }
    if (value === p.stock) {
      setEditingStockId(null)
      return
    }
    setSavingStock(true)
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: value }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not update stock')
        return
      }
      handleSaved(data.product, false)
      toast.success('Stock updated')
      setEditingStockId(null)
    } finally {
      setSavingStock(false)
    }
  }

  function startDuplicate(p: AdminProduct) {
    const seed: Partial<AdminProduct> = {
      ...p,
      name: `${p.name} Copy`,
      stock: 0,
      status: 'DRAFT',
      sku: null,
    }
    delete (seed as { id?: string }).id
    setDuplicateSeed(seed)
    setEditing(null)
    setDialogOpen(true)
  }

  function openCreate() {
    setEditing(null)
    setDuplicateSeed(null)
    setDialogOpen(true)
  }

  function openEdit(p: AdminProduct) {
    setEditing(p)
    setDuplicateSeed(null)
    setDialogOpen(true)
  }

  async function bulkPatch(mutate: (p: AdminProduct) => Record<string, unknown>) {
    setBulkBusy(true)
    const ids = Array.from(selected)
    try {
      let okCount = 0
      for (const id of ids) {
        const p = products.find((prod) => prod.id === id)
        if (!p) continue
        const res = await fetch(`/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutate(p)),
        })
        if (res.ok) {
          const data = await res.json()
          setProducts((prev) => prev.map((prod) => (prod.id === id ? data.product : prod)))
          okCount++
        }
      }
      toast.success(`Updated ${okCount} of ${ids.length} product${ids.length === 1 ? '' : 's'}`)
    } finally {
      setBulkBusy(false)
    }
  }

  async function bulkDelete() {
    setBulkBusy(true)
    const ids = Array.from(selected)
    try {
      let okCount = 0
      for (const id of ids) {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
        if (res.ok) okCount++
      }
      setProducts((prev) => prev.filter((p) => !selected.has(p.id)))
      setSelected(new Set())
      toast.success(`Deleted ${okCount} of ${ids.length} product${ids.length === 1 ? '' : 's'}`)
    } finally {
      setBulkBusy(false)
      setBulkDeleteConfirm(false)
    }
  }

  function bulkTag(tag: string, add: boolean) {
    bulkPatch((p) => ({
      tags: add ? Array.from(new Set([...(p.tags ?? []), tag])) : (p.tags ?? []).filter((t) => t !== tag),
    }))
  }

  const activeFilterCount = (categoryFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} products in catalog{filtered.length !== products.length ? ` · ${filtered.length} shown` : ''}
          </p>
        </div>
        <Button
          size="lg"
          onClick={openCreate}
          className="bg-foreground text-background hover:bg-brand hover:text-brand-foreground"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Add product
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
          <p className="mr-2 text-sm font-medium">{selected.size} selected</p>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkPatch(() => ({ status: 'ACTIVE' }))}>Publish</Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkPatch(() => ({ status: 'DRAFT' }))}>Unpublish</Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkTag('Featured', true)}>Mark Featured</Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkTag('Bestseller', true)}>Mark Best Seller</Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkTag('New', true)}>Mark New Arrival</Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkTag('Sale', true)}>Put On Sale</Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkTag('Sale', false)}>Remove Sale</Button>
          <Button size="sm" variant="destructive" disabled={bulkBusy} onClick={() => setBulkDeleteConfirm(true)}>
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          {bulkBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      )}

      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="font-display text-lg font-medium tracking-tight">
                All products
              </CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Columns3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {OPTIONAL_COLUMNS.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={visibleColumns.has(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <ExportCsvLink href="/api/admin/products/export" />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, brand, SKU or category..."
                  className="pl-9"
                  aria-label="Search products"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40" aria-label="Filter by category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Sort products">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>Sort: {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all')
                    setStatusFilter('all')
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear filters ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6">
                  <Checkbox checked={allShownSelected} onCheckedChange={toggleSelectAllShown} aria-label="Select all shown" />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Brand</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                {visibleColumns.has('sku') && <TableHead className="hidden lg:table-cell">SKU</TableHead>}
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                {visibleColumns.has('created') && <TableHead className="hidden xl:table-cell">Created</TableHead>}
                {visibleColumns.has('updated') && <TableHead className="hidden xl:table-cell">Updated</TableHead>}
                {visibleColumns.has('views') && <TableHead className="hidden xl:table-cell">Views</TableHead>}
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={20} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
                      <div className="text-sm">Loading products…</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : shown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={20} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8" strokeWidth={1.25} />
                      <div className="text-sm">
                        {query || activeFilterCount > 0 ? 'No products match your search or filters' : 'No products yet — add your first one.'}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                shown.map((p) => {
                  const status = getStockStatus(p.stock)
                  const price = p.volumes[0]?.price ?? 0
                  const publishStatus = p.status ?? 'ACTIVE'
                  return (
                    <TableRow key={p.id} data-state={selected.has(p.id) ? 'selected' : undefined}>
                      <TableCell className="pl-6">
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} aria-label={`Select ${p.name}`} />
                      </TableCell>
                      <TableCell>
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
                      {visibleColumns.has('sku') && (
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{p.sku ?? '—'}</TableCell>
                      )}
                      <TableCell className="font-medium">
                        {formatCurrency(price)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {editingStockId === p.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              autoFocus
                              value={stockDraft}
                              onChange={(e) => setStockDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveStock(p)
                                if (e.key === 'Escape') setEditingStockId(null)
                              }}
                              className="h-8 w-16"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              disabled={savingStock}
                              aria-label="Save stock"
                              onClick={() => saveStock(p)}
                            >
                              <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              aria-label="Cancel"
                              onClick={() => setEditingStockId(null)}
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startStockEdit(p)}
                            className="rounded px-1.5 py-0.5 text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors hover:bg-surface hover:text-foreground"
                            title="Click to quick-edit stock"
                          >
                            {p.stock}
                          </button>
                        )}
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
                      <TableCell>
                        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', PUBLISH_CLASSES[publishStatus] ?? PUBLISH_CLASSES.ACTIVE)}>
                          {publishStatus === 'ACTIVE' ? 'Published' : publishStatus === 'DRAFT' ? 'Draft' : publishStatus}
                        </span>
                      </TableCell>
                      {visibleColumns.has('created') && (
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                        </TableCell>
                      )}
                      {visibleColumns.has('updated') && (
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                          {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
                        </TableCell>
                      )}
                      {visibleColumns.has('views') && (
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">—</TableCell>
                      )}
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Edit ${p.name}`}
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Duplicate ${p.name}`}
                            title="Duplicate product"
                            onClick={() => startDuplicate(p)}
                          >
                            <Copy className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={`Preview ${p.name}`} title="Preview" asChild>
                            <a href={`/product/${p.slug}?preview=1`} target="_blank" rel="noreferrer">
                              <Eye className="h-4 w-4" strokeWidth={1.5} />
                            </a>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        initialValues={duplicateSeed}
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

      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} product{selected.size === 1 ? '' : 's'}?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} disabled={bulkBusy} className="bg-danger text-danger-foreground hover:bg-danger/90">
              {bulkBusy ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!successProduct} onOpenChange={(open) => !open && setSuccessProduct(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-center">Product created successfully</DialogTitle>
            <DialogDescription className="text-center">
              {successProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button asChild className="w-full">
              <a href={`/product/${successProduct?.slug}?preview=1`} target="_blank" rel="noreferrer">
                View Product
              </a>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (successProduct) openEdit(successProduct)
                setSuccessProduct(null)
              }}
            >
              Continue Editing
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSuccessProduct(null)
                openCreate()
              }}
            >
              Create Another Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
