-- Web Push reminders in the user's site language (ADR 0011, Hebrew stage 4).
-- Stores the user's language with their push settings so the push Edge Function sends reminders
-- and test pushes in the language they use on the site. Existing rows default to 'en'.
alter table push_settings
  add column if not exists lang text not null default 'en' check (lang in ('en', 'he'));
