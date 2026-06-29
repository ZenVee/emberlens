-- Migration: gallery layout orientation (portrait vs wide) for masonry grids
alter table public.photos
  add column if not exists gallery_orientation text not null default 'portrait'
  check (gallery_orientation in ('portrait', 'landscape'));
