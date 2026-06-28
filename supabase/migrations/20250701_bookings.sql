-- Migration: studio booking requests

create type public.booking_status as enum ('Pending', 'Confirmed', 'Declined');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  session_type text not null,
  shoot_date date not null,
  location text,
  email text,
  notes text,
  status public.booking_status not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_shoot_date_idx on public.bookings (shoot_date);
create index bookings_status_idx on public.bookings (status);

alter table public.bookings enable row level security;

create policy "Anyone can submit a booking request"
  on public.bookings
  for insert
  with check (status = 'Pending');

create policy "Admins manage bookings"
  on public.bookings
  for all
  using (public.is_admin())
  with check (public.is_admin());
