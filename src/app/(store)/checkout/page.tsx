'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Lock, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useStore, cartSubtotal } from '@/lib/store'
import { formatPrice } from '@/lib/format'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { EmptyState } from '@/components/site/empty-state'
import { ContactForm } from '@/components/checkout/contact-form'
import { ShippingAddressForm } from '@/components/checkout/shipping-address-form'
import { DeliverySelector } from '@/components/checkout/delivery-selector'
import { PaymentMethodSelector } from '@/components/checkout/payment-method-selector'
import { OrderSummary } from '@/components/checkout/order-summary'
import { ProgressStepper, type StepDef } from '@/components/checkout/progress-stepper'
import { SuccessCard } from '@/components/checkout/success-card'
import type { PlacedOrderPayment } from '@/components/checkout/success-card'
import { AddressPreviewCard } from '@/components/checkout/address-preview-card'
import { SavedAddressSelector } from '@/components/checkout/saved-address-selector'
import { CheckoutSkeleton } from '@/components/checkout/checkout-skeleton'
import {
  useAddressForm,
  CONTACT_FIELDS,
  ADDRESS_FIELDS,
  DELIVERY_FIELDS,
} from '@/lib/checkout/use-address-form'
import { addressSchema } from '@/lib/checkout/schema'
import { shippingFeeFor, isLocalCourier, estimatedDeliveryFor } from '@/lib/checkout/delivery'
import { DELIVERY_TYPES, LOGISTICS_COMPANIES, type PaymentMethodValue } from '@/lib/checkout/constants'
import type { OrderStatusValue } from '@/lib/checkout/constants'

const STEPS: readonly StepDef[] = [
  { key: 'contact', label: 'Contact' },
  { key: 'address', label: 'Address' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
]

type StepKey = (typeof STEPS)[number]['key']

interface PlacedOrder {
  orderNumber: string
  status: OrderStatusValue
  total: number
  paymentMethod: string
  deliveryLabel: string
  estimatedDelivery: string
  payment: PlacedOrderPayment | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const cart = useStore((s) => s.cart)
  const clearCart = useStore((s) => s.clearCart)
  const promo = useStore((s) => s.promo)

  const [step, setStep] = React.useState<StepKey>('contact')
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodValue | undefined>()
  const [placing, setPlacing] = React.useState(false)
  const [placedOrder, setPlacedOrder] = React.useState<PlacedOrder | null>(null)

  const form = useAddressForm()
  const values = form.watch()

  const subtotal = cartSubtotal(cart)
  const discount = promo ? subtotal * promo.discount : 0
  const afterDiscount = subtotal - discount
  const shippingFee = values.province ? shippingFeeFor(values.province, subtotal) : null
  const total = afterDiscount + (shippingFee ?? 0)

  async function goNext() {
    if (step === 'contact') {
      const ok = await form.trigger(CONTACT_FIELDS)
      if (ok) setStep('address')
      return
    }
    if (step === 'address') {
      const ok = await form.trigger(ADDRESS_FIELDS)
      if (ok) setStep('delivery')
      return
    }
    if (step === 'delivery') {
      const ok = await form.trigger(DELIVERY_FIELDS)
      if (ok) setStep('payment')
      return
    }
    if (step === 'payment') {
      if (!paymentMethod) {
        toast.error('Please select a payment method.')
        return
      }
      setStep('review')
    }
  }

  function goBack() {
    const idx = STEPS.findIndex((s) => s.key === step)
    if (idx > 0) setStep(STEPS[idx - 1].key)
  }

  async function handlePlaceOrder() {
    const valid = await form.trigger()
    if (!valid || !paymentMethod) {
      toast.error('Please check the highlighted fields and try again.')
      return
    }

    const raw = form.getValues()
    const parsed = addressSchema.safeParse(raw)
    if (!parsed.success) {
      toast.error('Please check the highlighted fields and try again.')
      return
    }
    const a = parsed.data

    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: a,
          paymentMethod,
          discount,
          items: cart.map((line) => ({
            productId: line.productId,
            name: line.name,
            brand: line.brand,
            image: line.image,
            ml: line.volume.ml,
            price: line.volume.price,
            qty: line.qty,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Unable to place your order. Please try again.')
        return
      }

      const deliveryLabel = isLocalCourier(a.province)
        ? 'Local Courier'
        : LOGISTICS_COMPANIES.find((c) => c.id === a.deliveryCompany)?.displayName || 'Logistics Delivery'

      setPlacedOrder({
        orderNumber: data.order.orderNumber,
        status: data.order.status,
        total: data.order.total,
        paymentMethod,
        deliveryLabel,
        estimatedDelivery: estimatedDeliveryFor(a.province),
        payment: data.payment
          ? {
              paymentId: data.payment.paymentId,
              status: data.payment.status,
              qrImageDataUrl: data.payment.qrImageDataUrl,
              redirectUrl: data.payment.redirectUrl,
              formAction: data.payment.formAction,
              formFields: data.payment.formFields,
            }
          : null,
      })
      clearCart()
      toast.success('Order placed successfully')
    } catch {
      toast.error('Unable to process your order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  // Avoid a blank flash while the session resolves.
  if (sessionStatus === 'loading') {
    return <CheckoutSkeleton />
  }

  // Step 6 — confirmation.
  if (placedOrder) {
    return (
      <SuccessCard
        orderNumber={placedOrder.orderNumber}
        status={placedOrder.status}
        paymentMethod={placedOrder.paymentMethod}
        deliveryMethodLabel={placedOrder.deliveryLabel}
        estimatedDelivery={placedOrder.estimatedDelivery}
        total={placedOrder.total}
        payment={placedOrder.payment}
      />
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

  // Orders are tied to an account so customers can track them.
  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface">
          <LogIn className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-medium tracking-tight">Sign in to checkout</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We tie every order to your account so you can track it and get delivery updates.
        </p>
        <button
          onClick={() => router.push('/login?callbackUrl=/checkout')}
          className="mt-6 rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          Sign in
        </button>
      </div>
    )
  }

  const estimatedDelivery = values.province ? estimatedDeliveryFor(values.province) : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 pb-28 sm:px-6 lg:pb-12">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="mb-8 font-display text-4xl font-medium tracking-tight">Checkout</h1>

      <ProgressStepper steps={STEPS} currentKey={step} onStepClick={(k) => setStep(k as StepKey)} className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Form */}
        <div className="max-w-2xl space-y-6">
          {step === 'contact' && (
            <FormCard title="Contact information">
              <ContactForm form={form} />
            </FormCard>
          )}

          {step === 'address' && (
            <FormCard title="Shipping address">
              <SavedAddressSelector form={form} />
              <ShippingAddressForm form={form} />
            </FormCard>
          )}

          {step === 'delivery' && (
            <FormCard title="Delivery method">
              <DeliverySelector form={form} subtotal={afterDiscount} />
            </FormCard>
          )}

          {step === 'payment' && (
            <FormCard title="Payment method">
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-border p-4 text-sm">
                <Lock className="h-4 w-4 text-brand" strokeWidth={1.5} />
                <span className="text-muted-foreground">
                  Your payment details are never stored on our servers.
                </span>
              </div>
              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
            </FormCard>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <FormCard title="Items">
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

              <FormCard title="Deliver to">
                <p className="mb-3 text-sm font-medium">{values.recipientName} · {values.phone}</p>
                <AddressPreviewCard
                  houseNumber={values.houseNumber}
                  streetAddress={values.streetAddress}
                  district={values.district}
                  province={values.province}
                  onEdit={() => setStep('address')}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {DELIVERY_TYPES.find((t) => t.value === values.deliveryType)?.label}
                  {' · '}
                  {values.province && isLocalCourier(values.province)
                    ? 'Local Courier'
                    : LOGISTICS_COMPANIES.find((c) => c.id === values.deliveryCompany)?.displayName}
                  {' · '}
                  {estimatedDelivery}
                </p>
                {values.deliveryNote && (
                  <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted-foreground">
                    {values.deliveryNote}
                  </p>
                )}
              </FormCard>

              <FormCard title="Payment">
                <p className="text-sm font-medium">{paymentMethod?.replace(/_/g, ' ')}</p>
              </FormCard>
            </div>
          )}

          {/* Step nav (desktop) */}
          <div className="hidden justify-between lg:flex">
            {step !== 'contact' ? (
              <button
                type="button"
                onClick={goBack}
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
                onClick={goNext}
                className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-60"
              >
                <Lock className="h-4 w-4" strokeWidth={1.5} />
                {placing ? 'Placing order…' : `Place order · ${formatPrice(total)}`}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <OrderSummary
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            shippingFee={shippingFee}
            total={total}
            estimatedDelivery={estimatedDelivery}
          />
        </aside>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-muted-foreground">Total</p>
            <p className="font-display text-lg font-semibold">{formatPrice(total)}</p>
          </div>
          {step !== 'review' ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 rounded-lg bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-60"
            >
              <Lock className="h-4 w-4" strokeWidth={1.5} />
              {placing ? 'Placing…' : 'Place order'}
            </button>
          )}
        </div>
      </div>
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
