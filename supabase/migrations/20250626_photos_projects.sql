-- Migration: photos, projects, project_photos (Fivemanage CDN + publish/watermark support)

create type public.photo_category as enum (
  'Portrait',
  'Automotive',
  'Event',
  'Street',
  'Lifestyle',
  'Cityscape'
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.photo_category not null,
  fivemanage_id text not null unique,
  cdn_url text not null,
  watermarked_cdn_url text,
  original_url text,
  alt_text text,
  sort_order int not null default 0,
  featured boolean not null default false,
  published boolean not null default false,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  client text,
  shoot_date date,
  category public.photo_category,
  description text,
  cover_photo_id uuid references public.photos (id) on delete set null,
  published boolean not null default false,
  client_paid_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_photos (
  project_id uuid not null references public.projects (id) on delete cascade,
  photo_id uuid not null references public.photos (id) on delete cascade,
  sort_order int not null default 0,
  primary key (project_id, photo_id)
);

create index photos_published_idx on public.photos (published, sort_order);
create index photos_featured_idx on public.photos (featured) where featured = true;
create index projects_published_idx on public.projects (published, sort_order);
create index project_photos_project_sort_idx on public.project_photos (project_id, sort_order);

alter table public.photos enable row level security;
alter table public.projects enable row level security;
alter table public.project_photos enable row level security;

create policy "Public can view published photos"
  on public.photos
  for select
  using (published = true or public.is_admin());

create policy "Admins manage photos"
  on public.photos
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can view published projects"
  on public.projects
  for select
  using (published = true or public.is_admin());

create policy "Admins manage projects"
  on public.projects
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can view photos in published projects"
  on public.project_photos
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = project_id
        and p.published = true
    )
  );

create policy "Admins manage project photos"
  on public.project_photos
  for all
  using (public.is_admin())
  with check (public.is_admin());
