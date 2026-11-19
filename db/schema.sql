-- Leet-For-Berger runtime database (PostgreSQL 15+, Supabase). See docs/adr/0002-postgres-supabase.md.
--
-- Git stays the source of truth for content: this schema is filled by a sync job from
-- content/ and src/js/problems/ on every merge to main. Clients never write content tables.
-- Expects Supabase's auth schema (auth.users, auth.uid()).

create type difficulty as enum ('Easy', 'Medium', 'Hard');
create type recency as enum ('30d', '3m', '6m', 'older', 'reported');
create type problem_status as enum ('indexed', 'selected', 'authored', 'verified');
create type run_kind as enum ('run', 'submit');

-- ---------- Learning network ----------

create table topics (
  id        text primary key check (id ~ '^[a-z0-9-]+$'),
  title     text not null,
  tier      smallint not null check (tier between 0 and 9),
  position  smallint not null
);

create table topic_prereqs (
  topic_id   text not null references topics on delete cascade,
  prereq_id  text not null references topics on delete cascade,
  primary key (topic_id, prereq_id),
  check (topic_id <> prereq_id)
);

create table subtopics (
  topic_id  text not null references topics on delete cascade,
  id        text not null check (id ~ '^[a-z0-9-]+$'),
  position  smallint not null,
  primary key (topic_id, id)
);

-- ---------- Problem index (every known problem, authored or not) ----------

create table problems (
  slug             text primary key check (slug ~ '^[a-z0-9-]+$'),
  platform         text not null default 'leetcode',
  number           integer,
  title            text not null,
  difficulty       difficulty not null,
  rating           smallint not null check (rating between 1 and 10),
  topic_id         text not null,
  subtopic_id      text,
  url              text not null,
  equivalent_slug  text references problems,
  est_minutes      smallint not null check (est_minutes > 0),
  priority         real not null check (priority between 0 and 1),
  wave             smallint check (wave in (1, 2)),
  status           problem_status not null default 'indexed',
  ladder_step      smallint check (ladder_step >= 0),
  essential_order  smallint check (essential_order >= 0),
  foreign key (topic_id) references topics,
  -- MATCH SIMPLE: a null subtopic skips the check; a set one must exist under the topic.
  foreign key (topic_id, subtopic_id) references subtopics (topic_id, id),
  -- Same rules the build validator enforces (src/js/data/taxonomy.js).
  check (status = 'indexed' or wave is not null),
  check (status = 'indexed' or subtopic_id is not null),
  check (ladder_step is null or status <> 'indexed'),
  check (essential_order is null or wave is not null)
);
create index problems_topic_idx on problems (topic_id, subtopic_id);
create index problems_core_idx on problems (wave) where wave is not null;
-- One essential problem per subtopic.
create unique index problems_one_essential_per_subtopic on problems (topic_id, subtopic_id) where essential_order is not null;

create table problem_secondary_topics (
  problem_slug  text not null references problems on delete cascade,
  topic_id      text not null references topics,
  subtopic_id   text,
  primary key (problem_slug, topic_id),
  foreign key (topic_id, subtopic_id) references subtopics (topic_id, id)
);

create table lists (
  id     text primary key,
  title  text not null
);

create table list_problems (
  list_id       text not null references lists on delete cascade,
  problem_slug  text not null references problems on delete cascade,
  primary key (list_id, problem_slug)
);

create table companies (
  name         text primary key,
  is_israeli   boolean not null default false,
  israel_hub   boolean not null default false,
  oa_platform  text
);

create table company_problems (
  company       text not null references companies on delete cascade,
  problem_slug  text not null references problems on delete cascade,
  frequency     real not null check (frequency between 0 and 100),
  recency       recency not null,
  source_url    text,
  primary key (company, problem_slug),
  check (recency <> 'reported' or source_url is not null)
);
create index company_problems_problem_idx on company_problems (problem_slug);

create table families (
  id     text primary key check (id ~ '^[a-z0-9-]+$'),
  title  text not null
);

create table family_members (
  family_id     text not null references families on delete cascade,
  position      smallint not null check (position >= 0),
  problem_slug  text not null unique references problems on delete cascade,
  twist         text not null,
  primary key (family_id, position)
);

-- ---------- Authored content ----------

create table languages (
  id                      text primary key,
  label                   text not null,
  solution_file           text not null,
  executable_in_browser   boolean not null default false
);

create table problem_content (
  problem_slug     text primary key references problems on delete cascade,
  statement_html   text not null,
  constraints      text[] not null default '{}',
  hints            text[] not null default '{}',
  signature        jsonb not null,
  time_limit_ms    integer not null check (time_limit_ms > 0),
  content_version  text not null  -- git commit the row was synced from
);

-- Visible cases 1-5 are public; hidden cases 6-15 are readable only by the judge (service role).
create table test_cases (
  problem_slug  text not null references problem_content on delete cascade,
  position      smallint not null check (position between 1 and 15),
  visible       boolean not null,
  args          jsonb not null,
  expected      jsonb not null,
  primary key (problem_slug, position),
  check (visible = (position <= 5))
);

create table solutions (
  problem_slug  text not null references problem_content on delete cascade,
  language_id   text not null references languages,
  code          text not null,
  verified_at   timestamptz not null,  -- when CI last ran it against all 15 cases
  primary key (problem_slug, language_id)
);

-- ---------- Users and progress ----------

create table profiles (
  user_id             uuid primary key references auth.users on delete cascade,
  display_name        text,
  target_company      text references companies on delete set null,
  preferred_language  text references languages on delete set null,
  created_at          timestamptz not null default now()
);

-- Written only by the judge, so a client cannot claim a verdict it did not earn.
create table submissions (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references profiles on delete cascade,
  problem_slug  text not null references problem_content,
  language_id   text not null references languages,
  kind          run_kind not null,
  passed        smallint not null check (passed between 0 and 15),
  verdict       text not null,
  runtime_ms    integer,
  code          text not null,
  created_at    timestamptz not null default now()
);
create index submissions_user_idx on submissions (user_id, created_at desc);

-- Practice progress as the browser keeps it (state/progress.js), synced across a user's devices
-- (ADR 0006). Client-reported, so only the user can fake it, and only for themselves: nothing
-- shared or scored reads it. The judge-written tables below stay the trusted record.
create table user_state (
  user_id     uuid primary key references auth.users on delete cascade,
  state       jsonb not null,
  updated_at  timestamptz not null default now(),
  -- localStorage holds about 5 MB; a row is one user's whole practice history, capped well below.
  constraint user_state_size check (pg_column_size(state) < 2000000)
);

-- GitHub sync (ADR 0007): which GitHub App installation and repository a user syncs solutions to.
-- Written only by the github-sync Edge Function (service role) after it verified the installation
-- belongs to the user's GitHub account; the user may only read their own row.
create table github_links (
  user_id          uuid primary key references auth.users on delete cascade,
  installation_id  bigint not null,
  repo             text not null check (repo ~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'),
  auto_sync        boolean not null default true,
  updated_at       timestamptz not null default now()
);

create table solves (
  user_id            uuid not null references profiles on delete cascade,
  problem_slug       text not null references problem_content,
  first_accepted_at  timestamptz,
  assisted           boolean not null default false,  -- the solution was revealed
  primary key (user_id, problem_slug)
);

-- ---------- Row level security ----------

alter table topics enable row level security;
alter table topic_prereqs enable row level security;
alter table subtopics enable row level security;
alter table problems enable row level security;
alter table problem_secondary_topics enable row level security;
alter table lists enable row level security;
alter table list_problems enable row level security;
alter table companies enable row level security;
alter table company_problems enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table languages enable row level security;
alter table problem_content enable row level security;
alter table test_cases enable row level security;
alter table solutions enable row level security;
alter table profiles enable row level security;
alter table submissions enable row level security;
alter table solves enable row level security;
alter table user_state enable row level security;
alter table github_links enable row level security;

-- Catalog and content are public to read; only the sync job (service role) writes them.
create policy read_all on topics for select using (true);
create policy read_all on topic_prereqs for select using (true);
create policy read_all on subtopics for select using (true);
create policy read_all on problems for select using (true);
create policy read_all on problem_secondary_topics for select using (true);
create policy read_all on lists for select using (true);
create policy read_all on list_problems for select using (true);
create policy read_all on companies for select using (true);
create policy read_all on company_problems for select using (true);
create policy read_all on families for select using (true);
create policy read_all on family_members for select using (true);
create policy read_all on languages for select using (true);
create policy read_all on problem_content for select using (true);

-- Hidden cases and solutions have no client policy: invisible to anon and authenticated roles.
create policy read_visible on test_cases for select using (visible);

-- Users see and edit only their own rows; submissions and solves are written by the judge.
create policy own_profile on profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_submissions on submissions for select using (user_id = auth.uid());
create policy own_solves on solves for select using (user_id = auth.uid());
create policy own_state on user_state for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_github_link on github_links for select using (user_id = auth.uid());

-- "Reveal Solution": the only client path to a solution. Marks the problem assisted, then returns
-- the code. security definer so it can read the solutions table that clients cannot.
create function reveal_solution(p_slug text, p_language text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'sign in to reveal a solution';
  end if;
  select code into v_code from solutions where problem_slug = p_slug and language_id = p_language;
  if v_code is null then
    raise exception 'no % solution for %', p_language, p_slug;
  end if;
  insert into solves (user_id, problem_slug, assisted)
  values (auth.uid(), p_slug, true)
  on conflict (user_id, problem_slug) do update set assisted = true;
  return v_code;
end;
$$;
revoke all on function reveal_solution(text, text) from public;
