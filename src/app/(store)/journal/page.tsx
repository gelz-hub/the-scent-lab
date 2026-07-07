import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { JournalCard } from '@/components/site/journal-card'
import { journal } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Stories on scent — guides, house histories and the craft of perfumery from The Scent Lab.',
}

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Journal' }]} />
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          The Journal
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Stories on scent
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Guides, house histories and the craft of perfumery — read at your leisure.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {journal.map((post, i) => (
          <JournalCard key={post.id} post={post} index={i} />
        ))}
      </div>
    </div>
  )
}
