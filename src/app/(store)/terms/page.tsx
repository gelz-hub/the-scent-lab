import type { Metadata } from 'next'
import { ProsePage } from '@/components/site/prose-page'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms and conditions that govern your use of The Scent Lab.',
}

export default function TermsPage() {
  return (
    <ProsePage
      title="Terms of Service"
      eyebrow="Legal"
      description="Last updated: November 2024."
      crumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]}
    >
      <p>
        These terms govern your use of The Scent Lab website and the purchase of
        products through it. By using our site, you agree to these terms.
      </p>
      <h2>Orders and acceptance</h2>
      <p>
        All orders are subject to acceptance and availability. We reserve the right
        to refuse or cancel any order at our discretion, including in cases of
        pricing errors or suspected fraud. An order confirmation email does not
        constitute acceptance; acceptance occurs when we dispatch your order.
      </p>
      <h2>Pricing and payment</h2>
      <p>
        All prices are listed in US dollars and include applicable taxes where
        required. We accept major credit cards and Apple Pay. Payment is processed
        securely at checkout.
      </p>
      <h2>Shipping</h2>
      <p>
        We offer complimentary standard shipping on orders over $100. Delivery
        times are estimates and may vary. For full details, see our{' '}
        <a href="/shipping" className="text-brand underline">shipping policy</a>.
      </p>
      <h2>Returns</h2>
      <p>
        Unopened products may be returned within 30 days for a full refund. See our{' '}
        <a href="/returns" className="text-brand underline">returns policy</a> for details.
      </p>
      <h2>Authenticity</h2>
      <p>
        We guarantee that every fragrance we sell is 100% authentic, sourced
        directly from the brand or an authorized distributor. All products arrive
        sealed in their original packaging.
      </p>
      <h2>Intellectual property</h2>
      <p>
        All content on this site — including text, graphics, logos and images — is
        the property of The Scent Lab or its licensors and may not be reproduced
        without permission. Brand names and product names are trademarks of their
        respective owners.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        The Scent Lab is not liable for indirect or consequential damages arising
        from the use of our products or website. Our liability is limited to the
        value of the products purchased.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms? Email us at legal@thescentlab.com.
      </p>
    </ProsePage>
  )
}
