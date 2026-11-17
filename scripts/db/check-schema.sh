#!/usr/bin/env bash
# Validates db/schema.sql and the git -> database sync against a throwaway local PostgreSQL:
#   1. the schema applies, and a full sync of the real content passes every constraint
#   2. user data survives a re-sync
#   3. dropping a problem that users submitted to fails loudly instead of deleting their data
#   4. row level security: anon sees visible test cases only, never hidden ones or solutions
#   5. reveal_solution needs a signed-in user and marks the problem assisted
# Needs PostgreSQL server binaries (initdb, pg_ctl) and psql. Usage: bash scripts/db/check-schema.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

PGBIN=${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}
PORT=${PORT:-54329}
WORK=$(mktemp -d)
RUN_AS=""
if [ "$(id -u)" = "0" ]; then
  # initdb refuses to run as root.
  id lfbpg >/dev/null 2>&1 || useradd -m lfbpg
  chown lfbpg "$WORK"
  RUN_AS="su lfbpg -c"
fi
pg() { if [ -n "$RUN_AS" ]; then $RUN_AS "$*"; else bash -c "$*"; fi; }
pg "$PGBIN/initdb -D $WORK/data -A trust -U postgres >/dev/null"
pg "$PGBIN/pg_ctl -D $WORK/data -o '-p $PORT -k $WORK' -l $WORK/log start >/dev/null"
trap '[ -z "${KEEP:-}" ] && { pg "$PGBIN/pg_ctl -D $WORK/data stop -m fast >/dev/null" || true; rm -rf "$WORK"; }' EXIT
sleep 1

SQL="psql -h $WORK -p $PORT -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
VAL="psql -h $WORK -p $PORT -U postgres -d postgres -At"
fail() { echo "FAIL: $*"; exit 1; }

# Minimal stand-in for Supabase's auth schema and API roles.
$SQL <<'EOF'
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create role anon nologin;
create role authenticated nologin;
EOF
$SQL -f db/schema.sql
grant_sql="grant usage on schema public to anon, authenticated; grant select on all tables in schema public to anon, authenticated; grant execute on function reveal_solution(text, text) to authenticated;"
$SQL -c "$grant_sql"

node scripts/db/export-sql.mjs > "$WORK/sync.sql"
$SQL -f "$WORK/sync.sql"
echo "1. schema + sync: $($VAL -c "select count(*) from problems") problems, $($VAL -c "select count(*) from test_cases") test cases, $($VAL -c "select count(*) from solutions") solutions"

USER_ID=11111111-1111-1111-1111-111111111111
$SQL -c "insert into auth.users values ('$USER_ID');
  insert into profiles (user_id, target_company) values ('$USER_ID', 'Meta');
  insert into submissions (user_id, problem_slug, language_id, kind, passed, verdict, code)
  values ('$USER_ID', 'notify-recipients', 'python', 'submit', 15, 'Accepted', 'x');"
$SQL -f "$WORK/sync.sql"
[ "$($VAL -c "select count(*) from submissions")" = "1" ] || fail "re-sync lost user submissions"
echo "2. re-sync keeps user data"

grep -v "^('notify-recipients'" "$WORK/sync.sql" > "$WORK/sync-drop.sql"
if $SQL -f "$WORK/sync-drop.sql" 2>/dev/null; then fail "dropping a problem with submissions succeeded"; fi
[ "$($VAL -c "select count(*) from problems where slug = 'notify-recipients'")" = "1" ] || fail "problem was deleted"
echo "3. dropping a problem with submissions fails and changes nothing"

as_role() { $VAL -q -c "set role $1; set request.jwt.claim.sub = '${2:-}'; $3"; }
[ "$(as_role anon '' "select count(*) from test_cases where not visible")" = "0" ] || fail "anon can read hidden test cases"
[ "$(as_role anon '' "select count(*) from test_cases where visible")" -gt 0 ] || fail "anon cannot read visible test cases"
[ "$(as_role anon '' "select count(*) from solutions")" = "0" ] || fail "anon can read solutions"
[ "$(as_role authenticated "$USER_ID" "select count(*) from solutions")" = "0" ] || fail "signed-in user can read solutions directly"
echo "4. RLS: hidden test cases and solutions are invisible to clients"

if as_role anon '' "select reveal_solution('notify-recipients', 'python')" >/dev/null 2>&1; then fail "anon could reveal a solution"; fi
code=$(as_role authenticated "$USER_ID" "select reveal_solution('notify-recipients', 'python')")
echo "$code" | grep -q "def notify_recipients" || fail "reveal_solution returned the wrong code"
[ "$($VAL -c "select assisted from solves where user_id = '$USER_ID' and problem_slug = 'notify-recipients'")" = "t" ] || fail "reveal did not mark the problem assisted"
echo "5. reveal_solution: signed-in only, marks the problem assisted"
echo "All database checks passed."
