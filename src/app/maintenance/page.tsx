import { Wrench } from 'lucide-react'

export const metadata = { title: 'Under maintenance — The Scent Lab' }

export default function MaintenancePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <Wrench className="h-12 w-12 text-brand" strokeWidth={1.5} />
      <h1 className="mt-6 font-display text-3xl font-medium tracking-tight">We'll be right back</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        The Scent Lab is undergoing scheduled maintenance. Please check back shortly — we
        apologize for the inconvenience.
      </p>
    </div>
  )
}
