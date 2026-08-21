export function SetupBanner({ mode, message }: { mode: string; message?: string }) {
  if (mode !== "setup") return null
  return (
    <div className="portal-callout portal-callout-warning">
      {message ??
        "The database is not ready. Check DATABASE_URL and DIRECT_URL in .env.local, then apply the SQL files listed there."}
    </div>
  )
}
