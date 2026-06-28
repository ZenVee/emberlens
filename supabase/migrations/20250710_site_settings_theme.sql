alter table public.site_settings
  add column if not exists theme_primary_color text not null default '#e5a050',
  add column if not exists theme_secondary_color text not null default '#4a423c',
  add column if not exists theme_accent_color text not null default '#e8b49a',
  add column if not exists theme_ember_color text not null default '#d99548',
  add column if not exists theme_font_sans text not null default 'Inter',
  add column if not exists theme_font_display text not null default 'Fraunces',
  add column if not exists theme_border_radius text not null default '1rem';
