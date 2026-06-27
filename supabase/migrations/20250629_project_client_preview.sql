-- Migration: allow client preview of unpublished projects via direct slug link

drop policy if exists "Public can view published photos" on public.photos;
drop policy if exists "Public can view published projects" on public.projects;
drop policy if exists "Public can view photos in published projects" on public.project_photos;

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

create policy "Public can view projects"
  on public.projects
  for select
  using (true);

create policy "Public can view project photos"
  on public.project_photos
  for select
  using (true);
