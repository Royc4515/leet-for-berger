-- Web Push reminders (ADR 0011): the push tables (see db/schema.sql) and the hourly run.
-- Written only by the push Edge Function (service role); a user reads their own rows.
create table if not exists push_settings (
  user_id     uuid primary key references auth.users on delete cascade,
  hours       smallint[] not null default '{16,20}' check (cardinality(hours) <= 6),
  off         text[] not null default '{}',
  time_zone   text not null default 'UTC' check (char_length(time_zone) between 1 and 64),
  updated_at  timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users on delete cascade,
  endpoint    text not null unique check (char_length(endpoint) <= 1024),
  p256dh      text not null,
  auth        text not null,
  failures    smallint not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);

create table if not exists push_log (
  user_id  uuid not null references auth.users on delete cascade,
  day      date not null,
  hour     smallint not null check (hour between 0 and 23),
  kind     text not null,
  key      text not null,
  sent_at  timestamptz not null default now(),
  primary key (user_id, day, hour)
);

alter table push_settings enable row level security;
alter table push_subscriptions enable row level security;
alter table push_log enable row level security;
drop policy if exists own_read on push_settings;
create policy own_read on push_settings for select using (auth.uid() = user_id);
drop policy if exists own_read on push_subscriptions;
create policy own_read on push_subscriptions for select using (auth.uid() = user_id);
drop policy if exists own_read on push_log;
create policy own_read on push_log for select using (auth.uid() = user_id);

-- The hourly run: pg_cron calls the function at minute 0 through pg_net. Its address and the shared
-- secret are read from Vault, created once by hand and never kept in git (docs/DEPLOY_AUTH.md):
--   select vault.create_secret('https://<project ref>.supabase.co/functions/v1/push/run', 'push_run_url');
--   select vault.create_secret('<the PUSH_CRON_SECRET value>', 'push_cron_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('push-run') where exists (select 1 from cron.job where jobname = 'push-run');
select cron.schedule(
  'push-run',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'push_run_url'),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
