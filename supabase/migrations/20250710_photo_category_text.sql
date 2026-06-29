-- Migration: store photo/project categories as text (matches CMS settings)
-- No-op if tables are missing or category is already text (e.g. fresh schema.sql install).

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'photos'
      and column_name = 'category'
      and udt_name = 'photo_category'
  ) then
    alter table public.photos
      alter column category type text using category::text;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'category'
      and udt_name = 'photo_category'
  ) then
    alter table public.projects
      alter column category type text using category::text;
  end if;
end $$;

drop type if exists public.photo_category;
