export function PageSkeleton({
  cards = 0,
  table = true,
}: {
  cards?: number
  table?: boolean
}) {
  return (
    <div className="portal-page">
      <div className="flex flex-col gap-3">
        <div className="h-10 w-48 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-full bg-muted" />
      </div>
      {cards > 0 ? (
        <div className="portal-stat-grid">
          {Array.from({ length: cards }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-card ring-1 ring-border/60" />
          ))}
        </div>
      ) : null}
      {table ? <div className="h-72 animate-pulse rounded-3xl bg-card ring-1 ring-border/60" /> : null}
    </div>
  )
}

export function ApplyFormSkeleton() {
  return (
    <div className="portal-page-form">
      <div className="flex flex-col gap-3">
        <div className="h-10 w-64 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-12 animate-pulse rounded-full bg-muted" />
      <div className="h-[28rem] animate-pulse rounded-3xl bg-card ring-1 ring-border/60" />
    </div>
  )
}
