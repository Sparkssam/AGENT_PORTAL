-- Distinguish staff-uploaded accepted files from agent files that were later reviewed.
alter table public.documents
  add column if not exists admin_uploaded boolean not null default false;

comment on column public.documents.admin_uploaded is
  'True when a staff member uploaded this file on behalf of the agent and it was auto-accepted.';
