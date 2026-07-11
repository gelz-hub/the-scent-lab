'use client'

import * as React from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImagePlus, Loader2, X, ChevronLeft, ChevronRight, Star, Plus, Repeat, Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminProduct } from '@/lib/admin-products'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const TYPES = ['Perfume', 'Eau de Parfum', 'Eau de Toilette', 'Gift Set', 'Cologne'] as const
const TAGS = ['New', 'Bestseller', 'Trending', 'Sale', 'Featured'] as const

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function skuify(value: string) {
  return value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface BrandOption {
  id: string
  name: string
  slug: string
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: AdminProduct | null
  /** Prefill values for a brand-new product (e.g. from "Duplicate") — ignored when `product` (edit mode) is set. */
  initialValues?: Partial<AdminProduct> | null
  onSaved: (product: AdminProduct, wasCreate: boolean) => void
}

export function ProductFormDialog({ open, onOpenChange, product, initialValues, onSaved }: ProductFormDialogProps) {
  const isEdit = !!product

  const [name, setName] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [slugTouched, setSlugTouched] = React.useState(false)
  const [sku, setSku] = React.useState('')
  const [skuTouched, setSkuTouched] = React.useState(false)
  const [status, setStatus] = React.useState<'DRAFT' | 'ACTIVE'>('ACTIVE')
  const [brandSlug, setBrandSlug] = React.useState('')
  const [newBrandMode, setNewBrandMode] = React.useState(false)
  const [newBrandName, setNewBrandName] = React.useState('')
  const [gender, setGender] = React.useState<string>('')
  const [type, setType] = React.useState<string>('Eau de Parfum')
  const [price, setPrice] = React.useState('')
  const [compareAtPrice, setCompareAtPrice] = React.useState('')
  const [stock, setStock] = React.useState('')
  const [country, setCountry] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [gallery, setGallery] = React.useState<string[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [tags, setTags] = React.useState<string[]>([])
  const [collectionNames, setCollectionNames] = React.useState<string[]>([])
  const [genderOptions, setGenderOptions] = React.useState<string[]>([])
  const [collectionOptions, setCollectionOptions] = React.useState<string[]>([])
  const [brandOptions, setBrandOptions] = React.useState<BrandOption[]>([])
  const [dragOver, setDragOver] = React.useState(false)
  const [dragImageIndex, setDragImageIndex] = React.useState<number | null>(null)
  const [dragOverImageIndex, setDragOverImageIndex] = React.useState<number | null>(null)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [confirmClose, setConfirmClose] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const replaceInputRef = React.useRef<HTMLInputElement>(null)
  const replaceIndexRef = React.useRef<number | null>(null)
  const nameInputRef = React.useRef<HTMLInputElement>(null)
  const initialSnapshotRef = React.useRef<string>('')

  const loadOptions = React.useCallback(() => {
    fetch('/api/admin/categories')
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data: { categories?: { name: string }[] }) => {
        setGenderOptions((data.categories ?? []).map((c) => c.name))
      })
      .catch(() => {})
    fetch('/api/admin/collections')
      .then((res) => (res.ok ? res.json() : { collections: [] }))
      .then((data: { collections?: { name: string }[] }) => {
        setCollectionOptions((data.collections ?? []).map((c) => c.name))
      })
      .catch(() => {})
    fetch('/api/admin/brands')
      .then((res) => (res.ok ? res.json() : { brands: [] }))
      .then((data: { brands?: BrandOption[] }) => {
        setBrandOptions(data.brands ?? [])
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    if (!open) return
    loadOptions()
  }, [open, loadOptions])

  React.useEffect(() => {
    if (!open) return
    const source = product ?? initialValues ?? null
    if (source) {
      setName(source.name ?? '')
      setSlug(product ? product.slug : '')
      setSlugTouched(false)
      setSku(source.sku ?? '')
      setSkuTouched(!!source.sku)
      setStatus((source.status as 'DRAFT' | 'ACTIVE') ?? (isEdit ? 'ACTIVE' : 'ACTIVE'))
      setBrandSlug(source.brandSlug ?? '')
      setGender(source.gender ?? '')
      setType(source.category ?? 'Eau de Parfum')
      setPrice(String(source.volumes?.[0]?.price ?? ''))
      setCompareAtPrice(source.compareAtPrice ? String(source.compareAtPrice) : '')
      setStock(String(source.stock ?? 0))
      setCountry(source.country ?? '')
      setDescription(source.description ?? '')
      setGallery(source.gallery?.length ? source.gallery : source.image ? [source.image] : [])
      setTags(source.tags ?? [])
      setCollectionNames(source.collection ?? [])
    } else {
      setName('')
      setSlug('')
      setSlugTouched(false)
      setSku('')
      setSkuTouched(false)
      setStatus('ACTIVE')
      setBrandSlug('')
      setGender('')
      setType('Eau de Parfum')
      setPrice('')
      setCompareAtPrice('')
      setStock('')
      setCountry('')
      setDescription('')
      setGallery([])
      setTags([])
      setCollectionNames([])
    }
    setNewBrandMode(false)
    setNewBrandName('')
    setErrors({})
    setConfirmClose(false)
    // Auto-focus the first field shortly after the dialog finishes opening.
    const t = setTimeout(() => {
      nameInputRef.current?.focus()
      // Snapshot what the form looks like right after prefill, for the
      // unsaved-changes check — taken after the same tick React commits.
      initialSnapshotRef.current = snapshotRef.current()
    }, 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, initialValues])

  // Once gender options load, default new products to the first one.
  React.useEffect(() => {
    if (!isEdit && !gender && genderOptions.length > 0) setGender(genderOptions[0])
  }, [genderOptions, isEdit, gender])

  // Auto-derive slug/SKU from brand + name (+ ml) until the user manually edits them.
  const selectedBrandName = brandOptions.find((b) => b.slug === brandSlug)?.name ?? ''
  React.useEffect(() => {
    if (slugTouched || isEdit) return
    setSlug(slugify([selectedBrandName, name].filter(Boolean).join(' ')))
  }, [name, selectedBrandName, slugTouched, isEdit])

  React.useEffect(() => {
    if (skuTouched || isEdit) return
    setSku(skuify([selectedBrandName, name].filter(Boolean).join(' ')))
  }, [name, selectedBrandName, skuTouched, isEdit])

  const snapshotRef = React.useRef<() => string>(() => '')
  snapshotRef.current = () =>
    JSON.stringify({ name, slug, sku, status, brandSlug, gender, type, price, compareAtPrice, stock, country, description, gallery, tags, collectionNames })

  function isDirty() {
    return snapshotRef.current() !== initialSnapshotRef.current
  }

  function requestClose() {
    if (isDirty()) {
      setConfirmClose(true)
    } else {
      onOpenChange(false)
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function toggleCollection(name: string) {
    setCollectionNames((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]))
  }

  async function uploadOne(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || `Could not upload ${file.name}`)
      return null
    }
    return data.url as string
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) return
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of list) {
        const url = await uploadOne(file)
        if (url) uploaded.push(url)
      }
      if (uploaded.length > 0) {
        setGallery((prev) => [...prev, ...uploaded])
        toast.success(uploaded.length === 1 ? 'Image uploaded' : `${uploaded.length} images uploaded`)
        setErrors((prev) => ({ ...prev, gallery: '' }))
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage(index: number) {
    setGallery((prev) => prev.filter((_, i) => i !== index))
  }

  function moveImage(index: number, direction: -1 | 1) {
    setGallery((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function reorderImage(from: number, to: number) {
    if (from === to) return
    setGallery((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  function requestReplace(index: number) {
    replaceIndexRef.current = index
    replaceInputRef.current?.click()
  }

  async function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const index = replaceIndexRef.current
    if (!file || index === null) return
    setUploading(true)
    try {
      const url = await uploadOne(file)
      if (url) {
        setGallery((prev) => prev.map((existing, i) => (i === index ? url : existing)))
        toast.success('Image replaced')
      }
    } finally {
      setUploading(false)
      replaceIndexRef.current = null
      if (replaceInputRef.current) replaceInputRef.current.value = ''
    }
  }

  async function createBrandInline() {
    const name = newBrandName.trim()
    if (!name) return
    const slug = slugify(name)
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not create brand')
        return
      }
      toast.success(`Brand "${name}" created`)
      setBrandOptions((prev) => [...prev, data.brand].sort((a, b) => a.name.localeCompare(b.name)))
      setBrandSlug(data.brand.slug)
      setNewBrandMode(false)
      setNewBrandName('')
      setErrors((prev) => ({ ...prev, brand: '' }))
    } catch {
      toast.error('Could not create brand')
    }
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Product name is required.'
    if (!brandSlug) next.brand = 'Select a brand.'
    if (!gender) next.gender = 'Select a category.'
    if (gallery.length === 0) next.gallery = 'Add at least one image.'
    if (!slug.trim()) next.slug = 'Slug is required.'
    const priceNum = Number(price)
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) next.price = 'Enter a valid price.'
    if (compareAtPrice.trim()) {
      const c = Number(compareAtPrice)
      if (Number.isNaN(c) || c <= 0) next.compareAtPrice = 'Enter a valid sale price.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    const selectedBrand = brandOptions.find((b) => b.slug === brandSlug)
    const priceNum = Number(price)
    const stockNum = Number(stock) || 0
    const compareAtPriceNum = compareAtPrice.trim() ? Number(compareAtPrice) : null

    setSaving(true)
    try {
      const payload = {
        slug: slug.trim(),
        sku: sku.trim() || null,
        status,
        name: name.trim(),
        brand: selectedBrand?.name ?? '',
        brandSlug,
        gender,
        category: type,
        collection: collectionNames,
        image: gallery[0],
        gallery,
        volumes: [{ ml: 50, price: priceNum }],
        compareAtPrice: compareAtPriceNum,
        description: description.trim(),
        story: isEdit ? product.story : description.trim(),
        notes: isEdit ? product.notes : { top: [], heart: [], base: [] },
        seasons: isEdit ? product.seasons : [],
        occasions: isEdit ? product.occasions : [],
        country: country.trim(),
        year: isEdit ? product.year : new Date().getFullYear(),
        tags,
        stock: stockNum,
      }

      const res = await fetch(isEdit ? `/api/products/${product.id}` : '/api/products', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not save product')
        return
      }

      toast.success(isEdit ? 'Product updated' : 'Product created')
      onSaved(data.product, !isEdit)
      if (isEdit) onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" onInteractOutside={(e) => { e.preventDefault(); requestClose(); }} onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}>
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle>{isEdit ? 'Edit product' : 'Add product'}</DialogTitle>
              <DialogDescription>
                {isEdit ? `Update details for ${product.name}.` : initialValues ? `Duplicating "${initialValues.name}".` : 'Create a new product in the catalog.'}
              </DialogDescription>
            </div>
            {isEdit && (
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <a href={`/product/${product.slug}?preview=1`} target="_blank" rel="noreferrer">
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Preview
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{status === 'ACTIVE' ? 'Published' : 'Draft'}</p>
              <p className="text-xs text-muted-foreground">
                {status === 'ACTIVE' ? 'Visible on the storefront.' : "Hidden from the storefront — only visible via Preview."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Draft</span>
              <Switch checked={status === 'ACTIVE'} onCheckedChange={(checked) => setStatus(checked ? 'ACTIVE' : 'DRAFT')} />
              <span className="text-xs text-muted-foreground">Published</span>
            </div>
          </div>

          {/* Image gallery */}
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">
              Product images <span className="text-danger">*</span>
              <span className="ml-1 font-normal">— first image is the main photo</span>
            </Label>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
              }}
              className={cn(
                'rounded-lg border-2 border-dashed p-3 transition-colors',
                dragOver ? 'border-brand bg-brand/5' : 'border-border',
                errors.gallery && 'border-danger/60'
              )}
            >
              <div className="flex flex-wrap gap-3">
                {gallery.map((url, i) => (
                  <div
                    key={url + i}
                    draggable
                    onDragStart={(e) => {
                      setDragImageIndex(i)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      if (dragImageIndex !== null && dragImageIndex !== i) setDragOverImageIndex(i)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={() => {
                      setDragImageIndex(null)
                      setDragOverImageIndex(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (dragImageIndex !== null) reorderImage(dragImageIndex, i)
                      setDragImageIndex(null)
                      setDragOverImageIndex(null)
                    }}
                    className={cn(
                      'group relative h-24 w-24 shrink-0 cursor-grab overflow-hidden rounded-lg border bg-surface active:cursor-grabbing',
                      dragOverImageIndex === i ? 'border-brand ring-2 ring-brand/40' : 'border-border',
                      dragImageIndex === i && 'opacity-40'
                    )}
                  >
                    <Image src={url} alt={`Image ${i + 1}`} fill sizes="96px" className="object-cover" />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-background/90 px-1.5 py-0.5 text-[9px] font-medium">
                        <Star className="h-2.5 w-2.5 fill-brand text-brand" /> Main
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => requestReplace(i)}
                      aria-label={`Replace image ${i + 1}`}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90 opacity-0 shadow transition-opacity group-hover:opacity-100"
                    >
                      <Repeat className="h-3 w-3" strokeWidth={2} />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/90 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        aria-label="Move left"
                        className="disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label={`Remove image ${i + 1}`}
                        className="text-danger"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === gallery.length - 1}
                        aria-label="Move right"
                        className="disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="grid h-24 w-24 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
                      <span className="text-[10px]">Add</span>
                    </div>
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                className="hidden"
              />
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleReplaceFile}
                className="hidden"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Drag & drop images here, or click Add — upload as many as you like at once. JPEG, PNG, WebP or AVIF, up to 8MB each. Drag a thumbnail to reorder; the first image is the cover photo.
              </p>
            </div>
            {errors.gallery && <p className="mt-1 text-xs text-danger">{errors.gallery}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-name" className="mb-1.5 block text-xs text-muted-foreground">
                Product name <span className="text-danger">*</span>
              </Label>
              <Input
                id="p-name"
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                className={errors.name ? 'border-danger' : undefined}
              />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                Brand <span className="text-danger">*</span>
              </Label>
              {newBrandMode ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="New brand name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        createBrandInline()
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={createBrandInline}>Add</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setNewBrandMode(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={brandSlug} onValueChange={setBrandSlug}>
                    <SelectTrigger className={cn('flex-1', errors.brand && 'border-danger')}>
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandOptions.map((b) => (
                        <SelectItem key={b.id} value={b.slug}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="outline" aria-label="Add new brand" onClick={() => setNewBrandMode(true)}>
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </div>
              )}
              {errors.brand && <p className="mt-1 text-xs text-danger">{errors.brand}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-slug" className="mb-1.5 block text-xs text-muted-foreground">
                Slug <span className="text-danger">*</span>
                <span className="ml-1 font-normal">— auto-generated, editable</span>
              </Label>
              <Input
                id="p-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value))
                  setSlugTouched(true)
                }}
                className={errors.slug ? 'border-danger' : undefined}
              />
              {errors.slug && <p className="mt-1 text-xs text-danger">{errors.slug}</p>}
            </div>
            <div>
              <Label htmlFor="p-sku" className="mb-1.5 block text-xs text-muted-foreground">
                SKU
                <span className="ml-1 font-normal">— auto-generated, editable</span>
              </Label>
              <Input
                id="p-sku"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value)
                  setSkuTouched(true)
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                Category <span className="text-danger">*</span>
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className={errors.gender ? 'border-danger' : undefined}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {genderOptions.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && <p className="mt-1 text-xs text-danger">{errors.gender}</p>}
              {genderOptions.length === 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">No categories yet — add one under Catalog first.</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Fragrance type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="p-country" className="mb-1.5 block text-xs text-muted-foreground">Country</Label>
              <Input id="p-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="France" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="p-price" className="mb-1.5 block text-xs text-muted-foreground">
                Price (USD) <span className="text-danger">*</span>
              </Label>
              <Input
                id="p-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-invalid={!!errors.price}
                className={errors.price ? 'border-danger' : undefined}
              />
              {errors.price && <p className="mt-1 text-xs text-danger">{errors.price}</p>}
            </div>
            <div>
              <Label htmlFor="p-compare" className="mb-1.5 block text-xs text-muted-foreground">Sale price</Label>
              <Input
                id="p-compare"
                type="number"
                min="0"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Optional — was price"
                className={errors.compareAtPrice ? 'border-danger' : undefined}
              />
              {errors.compareAtPrice && <p className="mt-1 text-xs text-danger">{errors.compareAtPrice}</p>}
            </div>
            <div>
              <Label htmlFor="p-stock" className="mb-1.5 block text-xs text-muted-foreground">Stock</Label>
              <Input id="p-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="p-desc" className="mb-1.5 block text-xs text-muted-foreground">Description</Label>
            <Textarea id="p-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">
              Tags — controls where this product appears on the storefront (New Arrivals, Best Sellers, Sale, etc.)
            </Label>
            <div className="flex flex-wrap gap-4">
              {TAGS.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={tags.includes(t)} onCheckedChange={() => toggleTag(t)} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {collectionOptions.length > 0 && (
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Collections</Label>
              <div className="flex flex-wrap gap-4">
                {collectionOptions.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={collectionNames.includes(c)} onCheckedChange={() => toggleCollection(c)} />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={requestClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || uploading}
              className="bg-foreground text-background hover:bg-brand hover:text-brand-foreground"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : status === 'DRAFT' ? 'Save as draft' : 'Publish product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>Leave without saving?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setConfirmClose(false)
              onOpenChange(false)
            }}
            className="bg-danger text-danger-foreground hover:bg-danger/90"
          >
            Leave without saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
