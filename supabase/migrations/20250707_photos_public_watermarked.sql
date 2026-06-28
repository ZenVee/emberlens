-- Migration: per-photo watermark toggle for public gallery

alter table public.photos
  add column if not exists public_watermarked boolean not null default false;
