-- Migration: singleton site settings for public studio content

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
  footer_studio_body text not null default 'Vinewood Blvd, Los Santos' || E'\n' || 'Open by appointment',
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
