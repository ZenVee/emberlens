-- Migration: optional project link on bookings

alter table public.bookings
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists bookings_project_id_idx on public.bookings (project_id);
