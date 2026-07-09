'use client'

import * as React from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImagePlus, Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminProduct } from '@/lib/admin-products'

const GENDERS = ['Women', 'Men', 'Unisex'] as const
const CATEGORIES = ['Perfume', 'Eau de Parfum', 'Eau de Toilette', 'Gift Set'] as const

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: AdminProduct | null
  onSaved: (product: AdminProduct) => void
}

export function ProductFormDialog({ open, onOpenChange, product, onSaved }: ProductFormDialogProps) {
  const isEdit = !!product

  const [name, setName] = React.useState('')
  const [brand, setBrand] = React.useState('')
  const [gender, setGender] = React.useState<string>('Unisex')
  const [category, setCategory] = React.useState<string>('Eau de Parfum')
  const [price, setPrice] = React.useState('')
  const [stock, setStock] = React.useState('')
  const [country, setCountry] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [image, setImage] = React.useState('')
  const [uploading, setUploading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open) return
    if (product) {
      setName(product.name)
      setBrand(product.brand)
      setGender(product.gender)
      setCategory(product.category)
      setPrice(String(product.volumes[0]?.price ?? ''))
      setStock(String(product.stock))
      setCountry(product.country)
      setDescription(product.description)
      setImage(product.image)
    } else {
      setName('')
      setBrand('')
      setGender('Unisex')
      setCategory('Eau de Parfum')
      setPrice('')
      setStock('')
      setCountry('')
      setDescription('')
      setImage('')
    }
  }, [open, product])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Upload failed')
        return
      }
      setImage(data.url)
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !brand.trim() || !price || !image) {
      toast.error('Name, brand, price and an image are required')
      return
    }

    const priceNum = Number(price)
    const stockNum = Number(stock) || 0
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error('Enter a valid price')
      return
    }

    setSaving(true)
    try {
      const payload = {
        slug: isEdit ? product.slug : slugify(`${brand}-${name}`),
        name: name.trim(),
        brand: brand.trim(),
        brandSlug: slugify(brand),
        gender,
        category,
        collection: isEdit ? product.collection : [],
        image,
        gallery: isEdit ? product.gallery : [image],
        volumes: [{ ml: 50, price: priceNum }],
        description: description.trim(),
        story: isEdit ? product.story : description.trim(),
        notes: isEdit ? product.notes : { top: [], heart: [], base: [] },
        seasons: isEdit ? product.seasons : [],
        occasions: isEdit ? product.occasions : [],
        country: country.trim(),
        year: isEdit ? product.year : new Date().getFullYear(),
        tags: isEdit ? product.tags : [],
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
      onSaved(data.product)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update details for ${product.name}.` : 'Create a new product in the catalog.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image upload */}
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Product image</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                {image ? (
                  <>
                    <Image src={image} alt="Product preview" fill sizes="96px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90 text-foreground shadow"
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </>
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="product-image-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                    </>
                  ) : image ? (
                    'Replace image'
                  ) : (
                    'Upload image'
                  )}
                </Button>
                <p className="mt-1.5 text-[11px] text-muted-foreground">JPEG, PNG, WebP or AVIF — up to 8MB.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-name" className="mb-1.5 block text-xs text-muted-foreground">Product name</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="p-brand" className="mb-1.5 block text-xs text-muted-foreground">Brand</Label>
              <Input id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-price" className="mb-1.5 block text-xs text-muted-foreground">Price (USD)</Label>
              <Input id="p-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || uploading}
              className="bg-foreground text-background hover:bg-brand hover:text-brand-foreground"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
