export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-3 w-40 animate-pulse rounded bg-surface" />
        <div className="mt-2 h-8 w-56 animate-pulse rounded bg-surface" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-surface" />
        </div>
        <div className="space-y-4 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-surface" />
          ))}
        </div>
      </div>
    </div>
  )
}
