-- Prevent agents from verifying deposits, marking documents verified,
-- changing their own role/lifecycle, or writing privileged columns.

create or replace function public.protect_deposit_mutations()
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
  if new.status in ('VERIFIED', 'CLEARED', 'REJECTED')
     and new.status is distinct from old.status then
    raise exception 'Agents cannot verify or reject deposits';
  end if;
  if new.verified_by is distinct from old.verified_by
     or new.verified_at is distinct from old.verified_at then
    raise exception 'Agents cannot set deposit verification fields';
  end if;
  if old.status in ('VERIFIED', 'CLEARED') then
    raise exception 'Verified deposits are locked';
  end if;
  return new;
end;
$$;

drop trigger if exists deposits_protect_mutations on public.deposit_records;
create trigger deposits_protect_mutations
  before update on public.deposit_records
  for each row execute procedure public.protect_deposit_mutations();

create or replace function public.protect_document_mutations()
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
  if new.status = 'verified' and new.status is distinct from old.status then
    raise exception 'Agents cannot verify documents';
  end if;
  if new.verified_by is distinct from old.verified_by
     or new.verified_at is distinct from old.verified_at then
    raise exception 'Agents cannot set document verification fields';
  end if;
  return new;
end;
$$;

drop trigger if exists documents_protect_mutations on public.documents;
create trigger documents_protect_mutations
  before update on public.documents
  for each row execute procedure public.protect_document_mutations();

create or replace function public.protect_agent_mutations()
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
  if new.status is distinct from old.status
     or new.verified is distinct from old.verified
     or new.agent_code is distinct from old.agent_code then
    raise exception 'Agents cannot change lifecycle, verification, or agent number';
  end if;
  return new;
end;
$$;

drop trigger if exists agents_protect_mutations on public.agents;
create trigger agents_protect_mutations
  before update on public.agents
  for each row execute procedure public.protect_agent_mutations();

-- Compatibility name requested by the product schema (physical table remains deposit_records).
create or replace view public.deposits as
  select * from public.deposit_records;

grant select on public.deposits to authenticated;
