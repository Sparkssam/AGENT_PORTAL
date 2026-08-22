-- Indexes for list/filter/report queries. Safe to re-run.
create index if not exists applications_updated_at_idx
  on public.applications (updated_at desc)
  where deleted_at is null;

create index if not exists applications_channel_id_idx
  on public.applications (channel_id)
  where deleted_at is null;

create index if not exists applications_sector_id_idx
  on public.applications (sector_id)
  where deleted_at is null;

create index if not exists applications_submitted_at_idx
  on public.applications (submitted_at)
  where deleted_at is null and submitted_at is not null;

create index if not exists applications_tin_number_idx
  on public.applications (tin_number)
  where tin_number is not null;

create index if not exists documents_status_idx
  on public.documents (status)
  where deleted_at is null;

create index if not exists documents_application_type_idx
  on public.documents (application_id, document_type)
  where deleted_at is null;

create index if not exists deposit_records_status_idx
  on public.deposit_records (status);

create index if not exists correction_requests_application_open_idx
  on public.correction_requests (application_id)
  where resolved_at is null;

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists audit_logs_actor_id_idx
  on public.audit_logs (actor_id);

create index if not exists document_verifications_application_id_idx
  on public.document_verifications (application_id);
