// Turns the content in git into one SQL transaction that syncs the runtime database.
// This is the sync job from docs/adr/0002-postgres-supabase.md: git is the source of truth,
// content tables are a projection of it. No database driver needed: pipe the output into psql.
// Usage: node scripts/db/export-sql.mjs > /tmp/sync.sql && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/sync.sql
//
// Never TRUNCATE: user tables (profiles, submissions, solves) reference content, and a cascade
// would wipe them. Instead: stage what git has, delete content git dropped (leaves first), then
// upsert (roots first). If git drops a problem that users have submissions for, the foreign key
// stops the delete and the whole transaction fails loudly. Nothing is lost silently.
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { TOPICS } from '../../src/js/data/taxonomy.js';
import { LANGUAGES } from '../../src/js/engine/codegen.js';
import { SQL_LANGUAGE } from '../../src/js/engine/sql.js';
import { availableProblems } from '../../src/js/problems/index.js';
import { buildSuite } from '../../src/js/engine/harness.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const read = async (p) => JSON.parse(await readFile(ROOT + p, 'utf8'));

/** SQL literal for scalars. */
const lit = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `'${String(v).replace(/'/g, "''")}'`;
};
/** jsonb literal for any JSON value, strings included ("abc" must arrive as a JSON string). */
const jlit = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const textArray = (a) => `array[${a.map(lit).join(',')}]::text[]`;

const { problems } = await read('content/index/problems.json');
const { families } = await read('content/families.json');
const companyGroups = await read('content/companies.json');
const version = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();

/**
 * In parent -> child order. `key` decides which rows git still has (others are deleted);
 * `conflict` is the primary key the upsert targets (defaults to `key`).
 * `rows` is an array, or a generator function for tables too large to hold as SQL text at once.
 * @type {{ table: string, cols: string[], key: string[], rows: string[][] | (() => Iterable<string[]>), conflict: string[] }[]}
 */
const tables = [];
const add = (table, cols, key, rows, conflict = key) => tables.push({ table, cols, key, rows, conflict });

add('languages', ['id', 'label', 'solution_file', 'executable_in_browser'], ['id'],
  [...LANGUAGES, SQL_LANGUAGE].map((l) => [lit(l.id), lit(l.label), lit(l.file), lit(l.executable)]));
add('topics', ['id', 'title', 'tier', 'position'], ['id'], TOPICS.map((t, i) => [lit(t.id), lit(t.title), t.tier, i]));
add('subtopics', ['topic_id', 'id', 'position'], ['topic_id', 'id'], TOPICS.flatMap((t) => t.concepts.map((c, i) => [lit(t.id), lit(c), i])));
add('topic_prereqs', ['topic_id', 'prereq_id'], ['topic_id', 'prereq_id'], TOPICS.flatMap((t) => t.prereqs.map((p) => [lit(t.id), lit(p)])));
add('problems',
  ['slug', 'platform', 'number', 'title', 'difficulty', 'rating', 'topic_id', 'subtopic_id', 'url', 'equivalent_slug', 'est_minutes', 'priority', 'wave', 'status', 'ladder_step', 'essential_order'],
  ['slug'],
  problems.map((p) => [lit(p.slug), lit(p.platform), lit(p.number), lit(p.title), lit(p.difficulty), p.rating, lit(p.topic), lit(p.concept), lit(p.url), lit(p.equivalent), p.estMinutes, p.priority, lit(p.wave), lit(p.status), lit(p.ladderStep), lit(p.essential ? p.essential.order : null)]));
add('problem_secondary_topics', ['problem_slug', 'topic_id', 'subtopic_id'], ['problem_slug', 'topic_id'],
  problems.flatMap((p) => p.secondary.map((s) => [lit(p.slug), lit(s.topic), lit(s.concept)])));
const listIds = [...new Set(problems.flatMap((p) => p.lists))];
add('lists', ['id', 'title'], ['id'], listIds.map((l) => [lit(l), lit(l)]));
add('list_problems', ['list_id', 'problem_slug'], ['list_id', 'problem_slug'], problems.flatMap((p) => p.lists.map((l) => [lit(l), lit(p.slug)])));
const companyNames = [...new Set(problems.flatMap((p) => p.companies.map((c) => c.name)))];
add('companies', ['name', 'is_israeli', 'israel_hub'], ['name'],
  companyNames.map((n) => [lit(n), lit(companyGroups.israeli.includes(n)), lit(companyGroups.israelHubs.includes(n))]));
add('company_problems', ['company', 'problem_slug', 'frequency', 'recency', 'source_url'], ['company', 'problem_slug'],
  problems.flatMap((p) => p.companies.map((c) => [lit(c.name), lit(p.slug), c.frequency, lit(c.recency), lit(c.source ?? null)])));
add('families', ['id', 'title'], ['id'], families.map((f) => [lit(f.id), lit(f.title)]));
// Keyed on every column: a member that moved position must be deleted and re-inserted, or the
// unique(problem_slug) constraint would trip on the upsert.
add('family_members', ['family_id', 'position', 'problem_slug', 'twist'], ['family_id', 'position', 'problem_slug'],
  families.flatMap((f) => f.members.map((m, i) => [lit(f.id), i, lit(m.slug), lit(m.twist)])), ['family_id', 'position']);

const slugOf = Object.fromEntries(problems.filter((p) => p.contentId).map((p) => [p.contentId, p.slug]));
const now = new Date().toISOString();
const shipped = availableProblems();
for (const problem of shipped) if (!slugOf[problem.id]) throw new Error(`${problem.id} has no index record`);

// Content rows are generated lazily, one problem at a time: the test data runs to hundreds of
// MB of SQL, and building it as one string ran node out of heap.
add('problem_content', ['problem_slug', 'statement_html', 'constraints', 'hints', 'signature', 'time_limit_ms', 'content_version'], ['problem_slug'],
  function* () {
    for (const p of shipped) yield [lit(slugOf[p.id]), lit(p.statementHtml.trim()), textArray(p.constraints), textArray(p.hints), jlit(p.signature), p.timeLimitMs, lit(version)];
  });
add('test_cases', ['problem_slug', 'position', 'visible', 'args', 'expected'], ['problem_slug', 'position'],
  function* () {
    for (const p of shipped) for (const tc of buildSuite(p)) yield [lit(slugOf[p.id]), tc.id, lit(tc.visible), jlit(tc.args), jlit(tc.expected)];
  });
// Algorithm problems ship 8 solutions; SQL problems ship one (problem.languages, set by hydrate).
add('solutions', ['problem_slug', 'language_id', 'code', 'verified_at'], ['problem_slug', 'language_id'],
  function* () {
    for (const p of shipped) for (const l of p.languages) yield [lit(slugOf[p.id]), lit(l.id), lit(readFileSync(`${ROOT}src/js/problems/${p.id}/solutions/${l.file}`, 'utf8')), lit(now)];
  });

/** Writes to stdout and waits when the pipe is full, so memory stays flat even when piped to psql. */
const write = (text) => new Promise((resolve) => (process.stdout.write(text) ? resolve() : process.stdout.once('drain', resolve)));
const BATCH_CHARS = 1 << 20;

await write('begin;\n');
for (const { table, cols, rows } of tables) {
  await write(`create temp table stage_${table} (like ${table} including defaults) on commit drop;\n`);
  let batch = [];
  let size = 0;
  const flush = async () => {
    if (batch.length) await write(`insert into stage_${table} (${cols.join(', ')}) values\n${batch.join(',\n')};\n`);
    batch = [];
    size = 0;
  };
  for (const r of typeof rows === 'function' ? rows() : rows) {
    const tuple = `(${r.join(', ')})`;
    batch.push(tuple);
    size += tuple.length;
    if (size >= BATCH_CHARS) await flush();
  }
  await flush();
}
for (const { table, key } of [...tables].reverse()) {
  const match = key.map((k) => `t.${k} is not distinct from s.${k}`).join(' and ');
  await write(`delete from ${table} t where not exists (select 1 from stage_${table} s where ${match});\n`);
}
for (const { table, cols, conflict } of tables) {
  const nonKey = cols.filter((c) => !conflict.includes(c));
  const action = nonKey.length ? `update set ${nonKey.map((c) => `${c} = excluded.${c}`).join(', ')}` : 'nothing';
  await write(`insert into ${table} (${cols.join(', ')}) select ${cols.join(', ')} from stage_${table} on conflict (${conflict.join(', ')}) do ${action};\n`);
}
await write('commit;\n');
