-- Migration: add is_admin to profiles (run if 20250626_profiles.sql was already applied)

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );
