-- Migration: services section for homepage site settings

alter table public.site_settings
  add column if not exists services_eyebrow text not null default 'Services',
  add column if not exists services_title text not null default 'What we shoot',
  add column if not exists services jsonb not null default '[
    {"title": "Portraits", "description": "Editorial-quality portrait sessions, in studio or on location.", "price": "from $250"},
    {"title": "Automotive", "description": "Custom builds, garage features, and rolling shots after dark.", "price": "from $400"},
    {"title": "Events", "description": "Clubs, openings, after-parties — captured cinematic and discreet.", "price": "from $600"},
    {"title": "Lifestyle & Travel", "description": "Editorial photo essays for brands, magazines, and personal stories.", "price": "Custom"}
  ]'::jsonb;

update public.site_settings
set
  services_eyebrow = coalesce(services_eyebrow, 'Services'),
  services_title = coalesce(services_title, 'What we shoot'),
  services = coalesce(
    services,
    '[
      {"title": "Portraits", "description": "Editorial-quality portrait sessions, in studio or on location.", "price": "from $250"},
      {"title": "Automotive", "description": "Custom builds, garage features, and rolling shots after dark.", "price": "from $400"},
      {"title": "Events", "description": "Clubs, openings, after-parties — captured cinematic and discreet.", "price": "from $600"},
      {"title": "Lifestyle & Travel", "description": "Editorial photo essays for brands, magazines, and personal stories.", "price": "Custom"}
    ]'::jsonb
  )
where id = 1;
