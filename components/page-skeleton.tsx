export function PageSkeleton({
  cards = 0,
  table = true,
}: {
  cards?: number
  table?: boolean
}) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      {cards > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: cards }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : null}
      {table ? <div className="h-72 animate-pulse rounded-lg border border-border bg-card" /> : null}
    </div>
  )
}

export function ApplyFormSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-12 animate-pulse rounded-lg bg-muted" />
      <div className="h-[28rem] animate-pulse rounded-lg border border-border bg-card" />
    </div>
  )
}
