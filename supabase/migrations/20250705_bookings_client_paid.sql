-- Migration: client paid status on bookings (synced with linked projects)

alter table public.bookings
  add column if not exists client_paid_at timestamptz;
