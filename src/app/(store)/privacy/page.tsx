import type { Metadata } from 'next'
import { ProsePage } from '@/components/site/prose-page'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How The Scent Lab collects, uses and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <ProsePage
      title="Privacy Policy"
      eyebrow="Legal"
      description="Last updated: November 2024. Your privacy matters to us."
      crumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
    >
      <p>
        The Scent Lab is committed to protecting your privacy. This policy explains
        what information we collect, how we use it, and the choices you have.
      </p>
      <h2>Information we collect</h2>
      <p>
        We collect information you provide directly — such as your name, email,
        shipping address and payment details when you place an order — as well as
        browsing data collected automatically via cookies and similar technologies.
      </p>
      <h2>How we use your information</h2>
      <ul>
        <li>To process and fulfill your orders, including shipping and returns.</li>
        <li>To respond to your inquiries and provide customer support.</li>
        <li>To send you order updates and, with your consent, marketing communications.</li>
        <li>To improve our website, products and services through analytics.</li>
        <li>To prevent fraud and protect the security of our platform.</li>
      </ul>
      <h2>Cookies</h2>
      <p>
        We use cookies to keep you signed in, remember your preferences, and
        understand how you use our site. You can control cookies through your
        browser settings, though disabling them may affect site functionality.
      </p>
      <h2>Sharing your information</h2>
      <p>
        We do not sell your personal information. We share data only with trusted
        service providers who help us operate our business — such as payment
        processors, shipping carriers and analytics tools — and only as necessary
        to provide our services.
      </p>
      <h2>Your rights</h2>
      <p>
        You may access, correct or delete your personal information at any time by
        contacting us at privacy@thescentlab.com. You may also unsubscribe from
        marketing emails at any time using the link in each email.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy? Email us at privacy@thescentlab.com and we'll
        be happy to help.
      </p>
    </ProsePage>
  )
}
