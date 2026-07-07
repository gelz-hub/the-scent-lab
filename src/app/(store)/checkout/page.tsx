'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, CreditCard, Lock, Truck } from 'lucide-react'
import { useStore, cartSubtotal } from '@/lib/store'
import { formatPrice } from '@/lib/format'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { EmptyState } from '@/components/site/empty-state'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const FREE_SHIP_THRESHOLD = 100
const SHIP_FLAT = 9
const TAX_RATE = 0.08

export default function CheckoutPage() {
  const cart = useStore((s) => s.cart)
  const clearCart = useStore((s) => s.clearCart)
  const promo = useStore((s) => s.promo)
  const [step, setStep] = React.useState<'information' | 'shipping' | 'payment' | 'review'>('information')
  const [placed, setPlaced] = React.useState(false)

  const subtotal = cartSubtotal(cart)
  const discount = promo ? subtotal * promo.discount : 0
  const afterDiscount = subtotal - discount
  const shipping = afterDiscount >= FREE_SHIP_THRESHOLD || afterDiscount === 0 ? 0 : SHIP_FLAT
  const tax = afterDiscount * TAX_RATE
  const total = afterDiscount + shipping + tax

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setPlaced(true)
    clearCart()
    toast.success('Order placed successfully', {
      description: `Confirmation sent to your email`,
    })
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10">
          <Check className="h-7 w-7 text-success" strokeWidth={2} />
        </div>
        <h1 className="mt-6 font-display text-4xl font-medium tracking-tight">Order confirmed</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you for your order. A confirmation has been sent to your email.
          You can track your order anytime from your account.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/account/orders"
            className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
          >
            View orders
          </Link>
          <Link
            href="/shop"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-foreground/40"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Checkout' }]} />
        <h1 className="mb-8 font-display text-4xl font-medium tracking-tight">Checkout</h1>
        <EmptyState
          title="Your cart is empty"
          description="Add a fragrance to your cart before checking out."
          actionLabel="Shop fragrances"
          actionHref="/shop"
        />
      </div>
    )
  }

  const steps = [
    { key: 'information', label: 'Information' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' },
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="mb-8 font-display text-4xl font-medium tracking-tight">Checkout</h1>

      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <button
              onClick={() => setStep(s.key)}
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors',
                step === s.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full border text-xs',
                  step === s.key ? 'border-foreground bg-foreground text-background' : 'border-border'
                )}
              >
                {i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <span className="h-px w-8 bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handlePlaceOrder} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Form */}
        <div className="space-y-6">
          {step === 'information' && (
            <FormCard title="Contact information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" name="firstName" required />
                <Field label="Last name" name="lastName" required />
                <Field label="Email" name="email" type="email" required full />
                <Field label="Phone" name="phone" type="tel" full />
              </div>
            </FormCard>
          )}

          {step === 'shipping' && (
            <FormCard title="Shipping address">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Address" name="address" required full />
                <Field label="Apartment, suite, etc. (optional)" name="address2" full />
                <Field label="City" name="city" required />
                <Field label="Postal code" name="zip" required />
                <Field label="Country" name="country" required full defaultValue="United States" />
              </div>
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Delivery method
                </p>
                <div className="space-y-2">
                  <DeliveryOption label="Standard shipping" time="3–5 business days" price="Free" />
                  <DeliveryOption label="Express shipping" time="1–2 business days" price="$15" />
                </div>
              </div>
            </FormCard>
          )}

          {step === 'payment' && (
            <FormCard title="Payment method">
              <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm">
                <Lock className="h-4 w-4 text-brand" strokeWidth={1.5} />
                <span className="text-muted-foreground">
                  All transactions are secure and encrypted. We never store your card details.
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Card number" name="cardNumber" placeholder="1234 5678 9012 3456" required />
                <Field label="Name on card" name="cardName" required />
                <Field label="Expiry" name="cardExpiry" placeholder="MM / YY" required />
                <Field label="CVC" name="cardCvc" placeholder="123" required />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
                We accept Visa, Mastercard, Amex and Apple Pay.
              </div>
            </FormCard>
          )}

          {step === 'review' && (
            <FormCard title="Review your order">
              <div className="space-y-3">
                {cart.map((line) => (
                  <div key={`${line.productId}-${line.volume.ml}`} className="flex items-center gap-3">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-surface">
                      <Image src={line.image} alt={line.name} fill sizes="56px" className="object-contain p-1.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{line.brand}</p>
                      <p className="text-sm font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">{line.volume.ml}ml · Qty {line.qty}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(line.volume.price * line.qty)}</span>
                  </div>
                ))}
              </div>
            </FormCard>
          )}

          {/* Step nav */}
          <div className="flex justify-between">
            {step !== 'information' ? (
              <button
                type="button"
                onClick={() => {
                  const idx = steps.findIndex((s) => s.key === step)
                  if (idx > 0) setStep(steps[idx - 1].key)
                }}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/40"
              >
                Back
              </button>
            ) : (
              <Link
                href="/cart"
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/40"
              >
                Back to cart
              </Link>
            )}
            {step !== 'review' ? (
              <button
                type="button"
                onClick={() => {
                  const idx = steps.findIndex((s) => s.key === step)
                  if (idx < steps.length - 1) setStep(steps[idx + 1].key)
                }}
                className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                <Lock className="h-4 w-4" strokeWidth={1.5} />
                Place order · {formatPrice(total)}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-display text-xl font-medium">Order summary</h2>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {cart.map((line) => (
                <div key={`${line.productId}-${line.volume.ml}`} className="flex items-center gap-3">
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-surface">
                    <Image src={line.image} alt={line.name} fill sizes="40px" className="object-contain p-1" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-medium">{line.name}</p>
                    <p className="text-[11px] text-muted-foreground">{line.volume.ml}ml · {line.qty}×</p>
                  </div>
                  <span className="text-xs font-semibold">{formatPrice(line.volume.price * line.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              {discount > 0 && <Row label="Discount" value={`−${formatPrice(discount)}`} accent="success" />}
              <Row label="Shipping" value={shipping === 0 ? 'Free' : formatPrice(shipping)} />
              <Row label="Tax" value={formatPrice(tax)} />
              <div className="my-2 border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="font-display text-2xl font-semibold">{formatPrice(total)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Truck className="h-3.5 w-3.5 text-brand" strokeWidth={1.5} />
              {shipping === 0 ? 'Free shipping applied' : `Add ${formatPrice(FREE_SHIP_THRESHOLD - afterDiscount)} for free shipping`}
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-6">
      <h2 className="mb-4 font-display text-xl font-medium">{title}</h2>
      {children}
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  defaultValue,
  full,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  defaultValue?: string
  full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}{required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground"
      />
    </div>
  )
}

function DeliveryOption({ label, time, price }: { label: string; time: string; price: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-foreground/40">
      <span className="flex items-center gap-3">
        <input type="radio" name="delivery" defaultChecked className="accent-foreground" />
        <span>
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-xs text-muted-foreground">{time}</span>
        </span>
      </span>
      <span className="text-sm font-semibold">{price}</span>
    </label>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: 'success' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', accent === 'success' && 'text-success')}>{value}</span>
    </div>
  )
}
