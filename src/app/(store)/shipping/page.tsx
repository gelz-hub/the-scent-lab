import type { Metadata } from 'next'
import { ProsePage } from '@/components/site/prose-page'

export const metadata: Metadata = {
  title: 'Shipping',
  description: 'Shipping options, delivery times and rates at The Scent Lab.',
}

export default function ShippingPage() {
  return (
    <ProsePage
      title="Shipping"
      eyebrow="Help"
      description="Fast, tracked delivery on every order. Complimentary over $100."
      crumbs={[{ label: 'Home', href: '/' }, { label: 'Shipping' }]}
    >
      <h2>Standard shipping</h2>
      <ul>
        <li>Free on all orders over $100.</li>
        <li>$9 flat rate on orders under $100.</li>
        <li>Delivery in 3–5 business days within the United States.</li>
        <li>Tracking provided by email once your order ships.</li>
      </ul>
      <h2>Express shipping</h2>
      <ul>
        <li>$15 flat rate.</li>
        <li>Delivery in 1–2 business days.</li>
        <li>Available at checkout for in-stock items.</li>
      </ul>
      <h2>International shipping</h2>
      <p>
        We ship to over 40 countries worldwide. International delivery takes 5–10
        business days and costs a flat $25, waived on orders over $200. Customs
        duties and taxes are the responsibility of the recipient.
      </p>
      <h2>Order processing</h2>
      <p>
        Orders placed before 2pm EST ship the same business day. Orders placed on
        weekends or holidays ship the next business day. You'll receive a shipping
        confirmation email with tracking as soon as your order is on its way.
      </p>
      <h2>Packaging</h2>
      <p>
        Every order is packed with care in recyclable materials and includes
        complimentary samples so you can discover something new. Gift wrapping is
        available at checkout at no charge.
      </p>
    </ProsePage>
  )
}
