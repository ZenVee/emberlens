-- Migration: remove watermark columns and simplify paid-sync trigger

alter table public.photos
  drop column if exists watermarked_cdn_url,
  drop column if exists public_watermarked;

alter table public.projects
  drop column if exists public_watermarked;

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
      updated_at = now()
    where id = new.project_id
      and client_paid_at is distinct from new.client_paid_at;
  end if;

  return new;
end;
$$;
