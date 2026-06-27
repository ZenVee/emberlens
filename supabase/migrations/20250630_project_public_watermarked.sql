-- Migration: optional watermarks on public project pages after client has paid

alter table public.projects
  add column if not exists public_watermarked boolean not null default false;
