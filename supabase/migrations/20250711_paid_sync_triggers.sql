-- Keep booking and project client_paid_at in sync (matches src/lib/paid-sync.ts)

create or replace function public.merge_paid_on_link(
  booking_paid timestamptz,
  project_paid timestamptz
)
returns timestamptz
language sql
immutable
as $$
  select case
    when booking_paid is not null and project_paid is not null then project_paid
    else coalesce(booking_paid, project_paid)
  end;
$$;

create or replace function public.bookings_merge_paid_on_link()
returns trigger
language plpgsql
as $$
declare
  project_paid timestamptz;
begin
  if new.project_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' or new.project_id is distinct from old.project_id then
    select client_paid_at into project_paid
    from public.projects
    where id = new.project_id;

    new.client_paid_at := public.merge_paid_on_link(new.client_paid_at, project_paid);
  end if;

  return new;
end;
$$;

create or replace function public.bookings_sync_paid_to_project()
returns trigger
language plpgsql
as $$
begin
  if new.project_id is null then
    return new;
  end if;

  if tg_op = 'INSERT'
     or old.client_paid_at is distinct from new.client_paid_at
     or old.project_id is distinct from new.project_id then
    update public.projects
    set
      client_paid_at = new.client_paid_at,
      public_watermarked = case
        when new.client_paid_at is null then false
        else public_watermarked
      end,
      updated_at = now()
    where id = new.project_id
      and (
        client_paid_at is distinct from new.client_paid_at
        or (new.client_paid_at is null and public_watermarked is true)
      );
  end if;

  return new;
end;
$$;

create or replace function public.projects_sync_paid_to_bookings()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.client_paid_at is not distinct from new.client_paid_at then
    return new;
  end if;

  update public.bookings
  set
    client_paid_at = new.client_paid_at,
    updated_at = now()
  where project_id = new.id
    and client_paid_at is distinct from new.client_paid_at;

  return new;
end;
$$;

drop trigger if exists bookings_merge_paid_on_link on public.bookings;
create trigger bookings_merge_paid_on_link
  before insert or update on public.bookings
  for each row
  execute function public.bookings_merge_paid_on_link();

drop trigger if exists bookings_sync_paid_to_project on public.bookings;
create trigger bookings_sync_paid_to_project
  after insert or update on public.bookings
  for each row
  execute function public.bookings_sync_paid_to_project();

drop trigger if exists projects_sync_paid_to_bookings on public.projects;
create trigger projects_sync_paid_to_bookings
  after update on public.projects
  for each row
  execute function public.projects_sync_paid_to_bookings();
