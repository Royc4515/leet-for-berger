-- Daily quiz results for the leaderboard and the synced quiz streak (see db/schema.sql).
-- Written only by the daily-quiz Edge Function (service role), which scores the player's choices
-- itself, so a client cannot post a score it did not earn. Players may read their own rows; the
-- public board is served by the function with display names only.
create table if not exists quiz_daily_results (
  user_id       uuid not null references auth.users on delete cascade,
  day           date not null,
  correct       smallint not null check (correct between 0 and 5),
  total         smallint not null check (total between 1 and 5),
  ms            integer not null check (ms >= 0),
  answers       jsonb not null,
  submitted_at  timestamptz not null default now(),
  primary key (user_id, day)
);
create index if not exists quiz_daily_results_day_idx on quiz_daily_results (day);

alter table quiz_daily_results enable row level security;
drop policy if exists own_read on quiz_daily_results;
create policy own_read on quiz_daily_results for select using (auth.uid() = user_id);
