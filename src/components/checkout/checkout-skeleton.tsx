export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-12 sm:px-6" aria-busy="true" aria-label="Loading checkout">
      <div className="mb-8 h-4 w-48 rounded bg-surface" />
      <div className="mb-8 h-9 w-56 rounded bg-surface" />
      <div className="mb-8 h-7 w-full max-w-md rounded bg-surface" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4 rounded-xl border border-border p-6">
          <div className="h-5 w-32 rounded bg-surface" />
          <div className="h-11 w-full rounded bg-surface" />
          <div className="h-11 w-full rounded bg-surface" />
          <div className="h-11 w-2/3 rounded bg-surface" />
        </div>
        <div className="hidden space-y-3 rounded-xl border border-border p-6 lg:block">
          <div className="h-5 w-28 rounded bg-surface" />
          <div className="h-12 w-full rounded bg-surface" />
          <div className="h-12 w-full rounded bg-surface" />
          <div className="h-8 w-full rounded bg-surface" />
        </div>
      </div>
    </div>
  )
}
