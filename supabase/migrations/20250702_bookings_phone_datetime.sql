-- Migration: booking phone + shoot datetime, drop email/location

alter table public.bookings
  add column if not exists phone_number text,
  add column if not exists shoot_at timestamptz;

update public.bookings
set shoot_at = (shoot_date::timestamp + time '12:00') at time zone 'UTC'
where shoot_at is null and shoot_date is not null;

alter table public.bookings
  alter column shoot_at set not null;

alter table public.bookings
  drop column if exists shoot_date,
  drop column if exists email,
  drop column if exists location;

drop index if exists bookings_shoot_date_idx;
create index if not exists bookings_shoot_at_idx on public.bookings (shoot_at);
