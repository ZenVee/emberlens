-- Ember Lens master schema

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );

-- Photos & projects

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
  public_watermarked boolean not null default false,
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
  download_link text,
  cover_photo_id uuid references public.photos (id) on delete set null,
  published boolean not null default false,
  client_paid_at timestamptz,
  public_watermarked boolean not null default false,
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

create policy "Public can view published photos or project photos"
  on public.photos
  for select
  using (
    published = true
    or public.is_admin()
    or exists (
      select 1
      from public.project_photos pp
      where pp.photo_id = id
    )
  );

create policy "Admins manage photos"
  on public.photos
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can view projects"
  on public.projects
  for select
  using (true);

create policy "Admins manage projects"
  on public.projects
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can view project photos"
  on public.project_photos
  for select
  using (true);

create policy "Admins manage project photos"
  on public.project_photos
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Bookings

create type public.booking_status as enum ('Pending', 'Confirmed', 'Declined');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  session_type text not null,
  shoot_at timestamptz not null,
  phone_number text,
  notes text,
  status public.booking_status not null default 'Pending',
  project_id uuid references public.projects(id) on delete set null,
  client_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_shoot_at_idx on public.bookings (shoot_at);
create index bookings_status_idx on public.bookings (status);
create index bookings_project_id_idx on public.bookings (project_id);

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

-- Site settings (singleton row)

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  studio_name text not null default 'Ember Lens',
  tagline text not null default 'Capturing Los Santos, one frame at a time.',
  location text not null default 'Vinewood Blvd, Los Santos',
  bio text not null default '',
  hero_image_url text,
  hero_image_fivemanage_id text,
  hero_title text not null default 'Ember Lens',
  hero_text text not null default '',
  footer_tagline text not null default 'Capturing Los Santos, one frame at a time.',
  footer_studio_heading text not null default 'Studio',
  footer_studio_body text not null default E'Vinewood Blvd, Los Santos\nOpen by appointment',
  footer_contact_heading text not null default 'Contact',
  footer_contact_body text not null default '@emberlens / RP-only studio',
  footer_copyright text not null default '© 2026 Ember Lens — A fictional studio for GTA V roleplay. Not affiliated with Rockstar Games.',
  gallery_eyebrow text not null default 'Gallery',
  gallery_title text not null default 'The full archive',
  gallery_description text not null default 'Click any frame to view it full-screen. Filtered by category, refreshed monthly.',
  gallery_show_categories boolean not null default true,
  projects_eyebrow text not null default 'Projects',
  projects_title text not null default 'Selected work',
  projects_description text not null default 'A curated set of recent projects across portraits, automotive, events, and editorial.',
  services_eyebrow text not null default 'Services',
  services_title text not null default 'What we shoot',
  services jsonb not null default '[
    {"title": "Portraits", "description": "Editorial-quality portrait sessions, in studio or on location.", "price": "from $250"},
    {"title": "Automotive", "description": "Custom builds, garage features, and rolling shots after dark.", "price": "from $400"},
    {"title": "Events", "description": "Clubs, openings, after-parties — captured cinematic and discreet.", "price": "from $600"},
    {"title": "Lifestyle & Travel", "description": "Editorial photo essays for brands, magazines, and personal stories.", "price": "Custom"}
  ]'::jsonb,
  photo_categories jsonb not null default '[
    "Portrait",
    "Automotive",
    "Event",
    "Street",
    "Lifestyle",
    "Cityscape"
  ]'::jsonb,
  project_categories jsonb not null default '[
    "Portrait",
    "Automotive",
    "Event",
    "Street",
    "Lifestyle",
    "Cityscape"
  ]'::jsonb,
  session_types jsonb not null default '[
    "Portrait session",
    "Automotive shoot",
    "Event coverage",
    "Lifestyle / Travel"
  ]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1);

alter table public.site_settings enable row level security;

create policy "Public can read site settings"
  on public.site_settings
  for select
  using (true);

create policy "Admins manage site settings"
  on public.site_settings
  for all
  using (public.is_admin())
  with check (public.is_admin());
