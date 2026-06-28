-- Migration: optional client download link on projects

alter table public.projects
  add column if not exists download_link text;
