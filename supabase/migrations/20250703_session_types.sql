-- Migration: configurable booking session types in site settings

alter table public.site_settings
  add column if not exists session_types jsonb not null default '[
    "Portrait session",
    "Automotive shoot",
    "Event coverage",
    "Lifestyle / Travel"
  ]'::jsonb;
