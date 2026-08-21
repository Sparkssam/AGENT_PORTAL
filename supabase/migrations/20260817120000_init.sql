-- Kinetic V1 schema: Auth profiles, agents, applications, documents, deposits,
-- corrections, notifications, audit. RLS is defense in depth; privileged
-- status/numbering work runs through SECURITY DEFINER functions.

create extension if not exists "pgcrypto";
set check_function_bodies = false;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('agent', 'admin', 'super_admin');
create type public.agent_lifecycle as enum ('pending', 'active', 'suspended');
create type public.commercial_channel as enum ('retail_partner', 'direct_sales', 'third_party');
create type public.app_status as enum (
  'DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'IN_PROGRESS',
  'NEEDS_CORRECTION', 'COMPLETED', 'REJECTED'
);
create type public.deposit_status as enum (
  'PENDING', 'SUBMITTED', 'CLEARED', 'REJECTED', 'AWAITING_PROOF'
);
create type public.document_status as enum ('missing', 'unverified', 'verified', 'rejected');
create type public.notification_category as enum ('application', 'document', 'deposit', 'system');
create type public.audit_category as enum ('Application', 'Document', 'Agent', 'System', 'Security');
create type public.audit_severity as enum ('info', 'warning', 'critical');
create type public.correction_item_kind as enum ('field', 'document');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create sequence public.application_number_seq;
create sequence public.agent_code_seq;

create or replace function public.next_application_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
  y text;
begin
  n := nextval('public.application_number_seq');
  y := to_char(timezone('utc', now()), 'YYYY');
  return 'APP-' || y || '-' || lpad(n::text, 4, '0');
end;
$$;

create or replace function public.next_agent_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
  y text;
begin
  n := nextval('public.agent_code_seq');
  y := to_char(timezone('utc', now()), 'YYYY');
  return 'AG-' || y || '-' || lpad(n::text, 5, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- Lookup tables
-- ---------------------------------------------------------------------------

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  active boolean not null default true
);

create table public.business_sectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  active boolean not null default true
);

create table public.document_types (
  code text primary key,
  name text not null,
  required boolean not null default false,
  allowed_mime text[] not null default array['image/jpeg', 'image/png', 'application/pdf']::text[],
  max_size_bytes integer not null default 10485760,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'agent',
  full_name text not null default '',
  email text not null,
  phone text,
  title text not null default 'Registered Agent',
  initials text not null default 'AG',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index profiles_email_uq on public.profiles (lower(email));
create unique index profiles_phone_uq on public.profiles (phone) where phone is not null;

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  agent_code text unique,
  status public.agent_lifecycle not null default 'pending',
  commercial_channel public.commercial_channel,
  verified boolean not null default false,
  member_since date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index agents_status_idx on public.agents (status);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.current_agent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.agents where user_id = auth.uid() limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Applications and related
-- ---------------------------------------------------------------------------

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  application_number text unique,
  status public.app_status not null default 'DRAFT',
  channel_id uuid references public.channels (id),
  sector_id uuid references public.business_sectors (id),
  agent_name text,
  business_name text,
  phone text,
  email text,
  id_type text,
  id_number text,
  issued_place text,
  issued_date date,
  expire_date date,
  gender text,
  country text not null default 'Tanzania',
  province text,
  district text,
  ward text,
  street text,
  house_number text,
  lat numeric,
  lng numeric,
  location_accuracy numeric,
  location_captured_at timestamptz,
  channel_parent_type text,
  channel_parent_name text,
  channel_manager_type text,
  channel_manager_name text,
  channel_type text,
  tin_number text,
  notes text,
  admin_notes text,
  fields_complete integer not null default 0,
  fields_total integer not null default 12,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  completed_at timestamptz,
  rejection_reason text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint applications_rejected_needs_reason check (
    status <> 'REJECTED' or rejection_reason is not null
  )
);

create unique index applications_one_open_per_agent
  on public.applications (agent_id)
  where deleted_at is null and status not in ('COMPLETED', 'REJECTED');

create index applications_status_idx on public.applications (status) where deleted_at is null;
create index applications_agent_id_idx on public.applications (agent_id);
create index applications_phone_idx on public.applications (phone);
create index applications_id_number_idx on public.applications (id_number);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  document_type text not null references public.document_types (code),
  status public.document_status not null default 'missing',
  storage_key text,
  original_name text,
  mime_type text,
  file_size bigint,
  file_extension text,
  rejection_reason text,
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  uploaded_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index documents_one_per_type
  on public.documents (application_id, document_type)
  where deleted_at is null and document_type <> 'other';

create unique index documents_storage_key_uq
  on public.documents (storage_key)
  where storage_key is not null;

create index documents_application_id_idx on public.documents (application_id);

create table public.deposit_records (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  amount numeric not null default 100000,
  currency text not null default 'TZS',
  status public.deposit_status not null default 'PENDING',
  reference text,
  proof_document_id uuid references public.documents (id),
  verified_by uuid references public.profiles (id),
  verified_at timestamptz,
  verification_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  old_status public.app_status,
  new_status public.app_status not null,
  changed_by uuid references public.profiles (id),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index status_history_application_id_idx
  on public.status_history (application_id, created_at desc);

create table public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  summary text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.correction_items (
  id uuid primary key default gen_random_uuid(),
  correction_request_id uuid not null references public.correction_requests (id) on delete cascade,
  kind public.correction_item_kind not null,
  target text not null,
  reason text not null,
  resolved_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category public.notification_category not null,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  actor_role text,
  category public.audit_category not null,
  severity public.audit_severity not null default 'info',
  action text not null,
  detail text not null default '',
  entity_type text,
  entity_id uuid,
  target text,
  ip_address inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_category_idx on public.audit_logs (category);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger agents_set_updated_at before update on public.agents
  for each row execute procedure public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications
  for each row execute procedure public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents
  for each row execute procedure public.set_updated_at();
create trigger deposit_records_set_updated_at before update on public.deposit_records
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth + profile bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.initials_from_name(full_name text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      upper(left(split_part(trim(full_name), ' ', 1), 1)) ||
      coalesce(upper(left(nullif(split_part(trim(full_name), ' ', 2), ''), 1)), ''),
      ''
    ),
    'AG'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_phone text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_phone := nullif(new.raw_user_meta_data->>'phone', '');

  insert into public.profiles (id, role, full_name, email, phone, title, initials)
  values (
    new.id,
    'agent',
    v_name,
    coalesce(new.email, ''),
    v_phone,
    'Registered Agent',
    public.initials_from_name(v_name)
  );

  insert into public.agents (user_id, status)
  values (new.id, 'pending');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.sync_role_to_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', new.role::text)
  where id = new.id;
  return new;
end;
$$;

create trigger profiles_sync_role_insert
  after insert on public.profiles
  for each row execute procedure public.sync_role_to_auth();

create trigger profiles_sync_role
  after update of role on public.profiles
  for each row execute procedure public.sync_role_to_auth();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if current_setting('kinetic.bypass_guards', true) = 'on' then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

create or replace function public.protect_application_mutations()
returns trigger
language plpgsql
as $$
begin
  if current_setting('kinetic.bypass_guards', true) = 'on' then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;
  if new.status is distinct from old.status then
    raise exception 'Agents cannot change application status directly';
  end if;
  if new.admin_notes is distinct from old.admin_notes then
    raise exception 'Agents cannot edit admin notes';
  end if;
  if old.status not in ('DRAFT', 'NEEDS_CORRECTION') then
    raise exception 'Application is locked for agent edits';
  end if;
  return new;
end;
$$;

create trigger applications_protect_mutations
  before update on public.applications
  for each row execute procedure public.protect_application_mutations();

-- ---------------------------------------------------------------------------
-- Privileged RPCs (used by the Next.js BFF)
-- ---------------------------------------------------------------------------

create or replace function public.emit_notification(
  p_user_id uuid,
  p_category public.notification_category,
  p_title text,
  p_message text,
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, category, title, message, entity_type, entity_id)
  values (p_user_id, p_category, p_title, p_message, p_entity_type, p_entity_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.write_audit(
  p_category public.audit_category,
  p_action text,
  p_detail text,
  p_severity public.audit_severity default 'info',
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_target text default null,
  p_ip inet default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_role text;
begin
  select role::text into v_role from public.profiles where id = auth.uid();
  insert into public.audit_logs (
    actor_id, actor_role, category, severity, action, detail,
    entity_type, entity_id, target, ip_address, metadata
  ) values (
    auth.uid(), coalesce(v_role, 'System'), p_category, p_severity, p_action, p_detail,
    p_entity_type, p_entity_id, p_target, p_ip, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.bootstrap_application(p_agent_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app_id uuid;
  v_type text;
  v_name text;
  v_email text;
  v_phone text;
begin
  perform set_config('kinetic.bypass_guards', 'on', true);

  if p_agent_id is distinct from public.current_agent_id() and not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  if exists (
    select 1 from public.applications
    where agent_id = p_agent_id
      and deleted_at is null
      and status not in ('COMPLETED', 'REJECTED')
  ) then
    select id into v_app_id
    from public.applications
    where agent_id = p_agent_id
      and deleted_at is null
      and status not in ('COMPLETED', 'REJECTED')
    limit 1;
    return v_app_id;
  end if;

  select p.full_name, p.email, p.phone
  into v_name, v_email, v_phone
  from public.agents a
  join public.profiles p on p.id = a.user_id
  where a.id = p_agent_id;

  insert into public.applications (agent_id, status, agent_name, email, phone)
  values (p_agent_id, 'DRAFT', v_name, v_email, v_phone)
  returning id into v_app_id;

  insert into public.status_history (application_id, old_status, new_status, changed_by, note)
  values (v_app_id, null, 'DRAFT', auth.uid(), 'Draft created');

  for v_type in
    select code from public.document_types where code <> 'deposit_proof' order by sort_order
  loop
    insert into public.documents (application_id, document_type, status)
    values (v_app_id, v_type, 'missing');
  end loop;

  insert into public.deposit_records (application_id, status)
  values (v_app_id, 'PENDING');

  return v_app_id;
end;
$$;

create or replace function public.submit_application(p_application_id uuid)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.applications;
  v_old public.app_status;
  v_missing int;
  v_agent public.agents;
  v_owner uuid;
begin
  perform set_config('kinetic.bypass_guards', 'on', true);

  select * into v_app
  from public.applications
  where id = p_application_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Application not found';
  end if;

  select * into v_agent from public.agents where id = v_app.agent_id;
  v_owner := v_agent.user_id;

  if v_owner is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  if v_app.status not in ('DRAFT', 'NEEDS_CORRECTION') then
    raise exception 'Application cannot be submitted from status %', v_app.status;
  end if;

  select count(*) into v_missing
  from public.documents d
  join public.document_types t on t.code = d.document_type
  where d.application_id = v_app.id
    and d.deleted_at is null
    and t.required = true
    and d.status in ('missing', 'rejected');

  if v_missing > 0 then
    raise exception 'Required documents are missing or rejected';
  end if;

  if coalesce(v_app.agent_name, '') = ''
     or coalesce(v_app.phone, '') = ''
     or coalesce(v_app.email, '') = ''
     or coalesce(v_app.id_type, '') = ''
     or coalesce(v_app.id_number, '') = ''
     or v_app.channel_id is null
     or v_app.sector_id is null then
    raise exception 'Required application fields are incomplete';
  end if;

  v_old := v_app.status;

  if v_app.application_number is null then
    v_app.application_number := public.next_application_number();
  end if;

  if v_agent.agent_code is null then
    update public.agents
    set agent_code = public.next_agent_code()
    where id = v_agent.id;
  end if;

  update public.applications
  set
    application_number = v_app.application_number,
    status = 'SUBMITTED',
    submitted_at = coalesce(submitted_at, timezone('utc', now()))
  where id = v_app.id;

  insert into public.status_history (application_id, old_status, new_status, changed_by, note)
  values (v_app.id, v_old, 'SUBMITTED', auth.uid(), 'Application submitted');

  update public.applications
  set status = 'PENDING_REVIEW'
  where id = v_app.id;

  insert into public.status_history (application_id, old_status, new_status, changed_by, note)
  values (v_app.id, 'SUBMITTED', 'PENDING_REVIEW', auth.uid(), 'Queued for review');

  update public.correction_requests
  set resolved_at = timezone('utc', now())
  where application_id = v_app.id and resolved_at is null;

  perform public.emit_notification(
    v_owner,
    'application',
    'Application submitted',
    'Your application is pending review.',
    'application',
    v_app.id
  );

  perform public.write_audit(
    'Application',
    'Submitted application',
    coalesce('Submitted ' || v_app.application_number, 'Submitted draft'),
    'info',
    'application',
    v_app.id,
    v_app.application_number
  );

  select * into v_app from public.applications where id = p_application_id;
  return v_app;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.channels enable row level security;
alter table public.business_sectors enable row level security;
alter table public.document_types enable row level security;
alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.deposit_records enable row level security;
alter table public.status_history enable row level security;
alter table public.correction_requests enable row level security;
alter table public.correction_items enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy agents_select on public.agents
  for select using (user_id = auth.uid() or public.is_admin());
create policy agents_update on public.agents
  for update using (user_id = auth.uid() or public.is_admin());
create policy agents_insert_own on public.agents
  for insert with check (user_id = auth.uid() or public.is_admin());

create policy lookups_select_channels on public.channels
  for select to authenticated using (true);
create policy lookups_select_sectors on public.business_sectors
  for select to authenticated using (true);
create policy lookups_select_doc_types on public.document_types
  for select to authenticated using (true);

create policy applications_select on public.applications
  for select using (
    deleted_at is null and (
      public.is_admin() or agent_id = public.current_agent_id()
    )
  );
create policy applications_insert on public.applications
  for insert with check (
    agent_id = public.current_agent_id() or public.is_admin()
  );
create policy applications_update on public.applications
  for update using (
    public.is_admin() or agent_id = public.current_agent_id()
  );

create policy documents_select on public.documents
  for select using (
    deleted_at is null and exists (
      select 1 from public.applications a
      where a.id = documents.application_id
        and a.deleted_at is null
        and (public.is_admin() or a.agent_id = public.current_agent_id())
    )
  );
create policy documents_insert on public.documents
  for insert with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (public.is_admin() or a.agent_id = public.current_agent_id())
    )
  );
create policy documents_update on public.documents
  for update using (
    exists (
      select 1 from public.applications a
      where a.id = documents.application_id
        and (public.is_admin() or a.agent_id = public.current_agent_id())
    )
  );

create policy deposits_select on public.deposit_records
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = deposit_records.application_id
        and a.deleted_at is null
        and (public.is_admin() or a.agent_id = public.current_agent_id())
    )
  );
create policy deposits_insert on public.deposit_records
  for insert with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (public.is_admin() or a.agent_id = public.current_agent_id())
    )
  );
create policy deposits_update on public.deposit_records
  for update using (
    exists (
      select 1 from public.applications a
      where a.id = deposit_records.application_id
        and (public.is_admin() or a.agent_id = public.current_agent_id())
    )
  );

create policy status_history_select on public.status_history
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = status_history.application_id
        and (public.is_admin() or a.agent_id = public.current_agent_id())
    )
  );

create policy corrections_select on public.correction_requests
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = correction_requests.application_id
        and (public.is_admin() or a.agent_id = public.current_agent_id())
    )
  );
create policy corrections_insert on public.correction_requests
  for insert with check (public.is_admin());

create policy correction_items_select on public.correction_items
  for select using (
    exists (
      select 1
      from public.correction_requests r
      join public.applications a on a.id = r.application_id
      where r.id = correction_items.correction_request_id
        and (public.is_admin() or a.agent_id = public.current_agent_id())
    )
  );
create policy correction_items_insert on public.correction_items
  for insert with check (public.is_admin());

create policy notifications_select on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy notifications_update on public.notifications
  for update using (user_id = auth.uid());

create policy audit_logs_select on public.audit_logs
  for select using (public.is_admin());

grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.current_agent_id() to authenticated;
grant execute on function public.next_application_number() to authenticated;
grant execute on function public.next_agent_code() to authenticated;
grant execute on function public.bootstrap_application(uuid) to authenticated;
grant execute on function public.submit_application(uuid) to authenticated;
grant execute on function public.emit_notification(uuid, public.notification_category, text, text, text, uuid) to authenticated;
grant execute on function public.write_audit(public.audit_category, text, text, public.audit_severity, text, uuid, text, inet, jsonb) to authenticated;
