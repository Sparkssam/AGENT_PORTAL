export function SetupBanner({ mode, message }: { mode: string; message?: string }) {
  if (mode !== "setup") return null
  return (
    <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
      Supabase is configured but the database schema is not ready. Set{" "}
      <code className="font-mono text-xs">DATABASE_URL</code> (port 6543, pooled) and{" "}
      <code className="font-mono text-xs">DIRECT_URL</code> (port 5432, session) from Database settings. Then apply
      SQL in this order:{" "}
      <code className="font-mono text-xs">supabase/migrations/20260817120000_init.sql</code>,{" "}
      <code className="font-mono text-xs">supabase/seed.sql</code>,{" "}
      <code className="font-mono text-xs">supabase/migrations/20260817140000_storage.sql</code>,{" "}
      <code className="font-mono text-xs">supabase/migrations/20260817150000_mutation_guards.sql</code>,{" "}
      <code className="font-mono text-xs">supabase/migrations/20260819120000_document_verifications.sql</code>,{" "}
      <code className="font-mono text-xs">supabase/migrations/20260819140000_business_sectors.sql</code>. Documents
      are stored in the private Supabase Storage bucket, not R2. {message}
    </div>
  )
}
