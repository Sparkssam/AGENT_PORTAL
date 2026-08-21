-- Automated document verification results (quality, OCR, rule checks).
-- Authenticity APIs (Persona / Onfido / Stripe Identity) plug in later via `authenticity`.

create type public.verification_review_status as enum ('pending', 'flagged', 'approved', 'dismissed');

create table public.document_verifications (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  document_type text not null,
  passed boolean not null default false,
  issues text[] not null default '{}',
  extracted jsonb not null default '{}'::jsonb,
  quality jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0,
  provider text,
  authenticity jsonb not null default '{}'::jsonb,
  review_status public.verification_review_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index document_verifications_document_id_idx
  on public.document_verifications (document_id, created_at desc);
create index document_verifications_review_status_idx
  on public.document_verifications (review_status, created_at desc);

alter table public.document_verifications enable row level security;

create policy document_verifications_select
  on public.document_verifications
  for select using (user_id = auth.uid() or public.is_admin());

create policy document_verifications_insert_own
  on public.document_verifications
  for insert with check (user_id = auth.uid() or public.is_admin());

create policy document_verifications_update_admin
  on public.document_verifications
  for update using (public.is_admin());

grant usage on type public.verification_review_status to anon, authenticated, service_role;
grant select, insert, update on table public.document_verifications to authenticated, service_role;
