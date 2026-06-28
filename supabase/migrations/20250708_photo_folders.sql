-- Migration: admin photo folders

create table public.photo_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.photos
  add column if not exists folder_id uuid references public.photo_folders (id) on delete set null;

create index if not exists photos_folder_id_idx on public.photos (folder_id);

alter table public.photo_folders enable row level security;

create policy "Admins manage photo folders"
  on public.photo_folders
  for all
  using (public.is_admin())
  with check (public.is_admin());
