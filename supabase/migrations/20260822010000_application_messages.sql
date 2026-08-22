create table if not exists public.application_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists application_messages_application_id_idx
  on public.application_messages (application_id, created_at);

alter table public.application_messages enable row level security;

comment on table public.application_messages is
  'Per-application comment thread between the assigned agent and staff reviewers.';
