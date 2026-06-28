-- Migration: configurable photo and project categories in site settings

alter table public.site_settings
  add column if not exists photo_categories jsonb not null default '[
    "Portrait",
    "Automotive",
    "Event",
    "Street",
    "Lifestyle",
    "Cityscape"
  ]'::jsonb,
  add column if not exists project_categories jsonb not null default '[
    "Portrait",
    "Automotive",
    "Event",
    "Street",
    "Lifestyle",
    "Cityscape"
  ]'::jsonb;
