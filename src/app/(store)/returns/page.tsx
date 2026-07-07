import type { Metadata } from 'next'
import { ProsePage } from '@/components/site/prose-page'

export const metadata: Metadata = {
  title: 'Returns',
  description: 'Our 30-day return policy at The Scent Lab.',
}

export default function ReturnsPage() {
  return (
    <ProsePage
      title="Returns"
      eyebrow="Help"
      description="Changed your mind? Return within 30 days for a full refund."
      crumbs={[{ label: 'Home', href: '/' }, { label: 'Returns' }]}
    >
      <h2>30-day return policy</h2>
      <p>
        We want you to love every fragrance you buy from us. Unopened products in
        their original packaging may be returned within 30 days of delivery for a
        full refund of the product price.
      </p>
      <h2>Opened products</h2>
      <p>
        Due to the nature of fragrance, opened bottles are non-returnable unless
        faulty. We recommend trying a fragrance with a discovery set or travel
        size before committing to a full bottle.
      </p>
      <h2>How to start a return</h2>
      <ul>
        <li>Sign in to your account and visit Orders.</li>
        <li>Select the order and item(s) you'd like to return.</li>
        <li>Choose your reason and request a return label.</li>
        <li>Drop off your package at any authorized carrier location.</li>
      </ul>
      <h2>Refunds</h2>
      <p>
        Refunds are issued to your original payment method within 5–7 business
        days of receiving your return. You'll get an email confirmation once your
        refund has been processed.
      </p>
      <h2>Exchanges</h2>
      <p>
        We don't offer direct exchanges. To swap a fragrance, please return the
        original item for a refund and place a new order for your preferred scent.
      </p>
      <h2>Damaged or incorrect items</h2>
      <p>
        If your order arrives damaged or incorrect, please contact us at
        hello@thescentlab.com within 7 days of delivery and we'll make it right.
      </p>
    </ProsePage>
  )
}
