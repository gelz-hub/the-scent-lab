export default function AccountLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-3 w-32 animate-pulse rounded bg-surface" />
        <div className="mt-2 h-8 w-48 animate-pulse rounded bg-surface" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  )
}
