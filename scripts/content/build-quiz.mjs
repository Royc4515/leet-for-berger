#!/usr/bin/env node
/**
 * Builds the quiz data the site loads from the source bank in content/quiz/<topic>.json
 * (English fields plus a `he` block per question):
 *
 *   src/js/data/quiz/<lang>/<topic>.json  one file per topic and language, fetched on demand
 *   src/js/data/quiz-index.js             id, topic, level, join day and exit day of every
 *                                         question, for planning a session before any text loads
 *   deploy/supabase/functions/daily-quiz/bank.js   id, topic, answer, option count, join day
 *                                         and exit day, plus the daily cap constants, so the
 *                                         daily-quiz Edge Function picks the same questions and
 *                                         scores submissions without trusting the browser
 *
 * The bank is about 1.2 MB in both languages, too much to load at once on a phone; a session
 * fetches only the topics its picked questions come from. tests/quiz.test.js fails when the
 * built files are stale.
 *
 * The daily pool (content/quiz/daily-pool.json) records the day each question joins the daily
 * quiz. A question new to the bank is given a day two days ahead, past "tomorrow" in every time
 * zone, so the daily quiz of a day already shown never changes. A question in the pool cannot be
 * deleted from the bank: that would change the daily quiz of every day since it joined.
 *
 * Daily exits (content/quiz/daily-exits.json) record the day a question leaves the daily quiz
 * (while staying in topic practice, sprint and survival). Exits are append-only: checked against
 * the committed generated bank.js before overwriting it, so removing an exit, moving one to
 * another day, or adding a new exit earlier than tomorrow UTC is refused.
 *
 * Usage: node scripts/content/build-quiz.mjs   (after any edit in content/quiz/)
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { QUIZ_TOPICS, QUIZ_LANGS } from '../../src/js/data/quiz-topics.js';
import {
  validateBank,
  DAILY_QUIZ_EPOCH,
  DAILY_QUIZ_SIZE,
  DAILY_LANG_CAP_SINCE,
  DAILY_LANG_CAP,
  DAILY_CAPPED_TOPICS,
} from '../../src/js/modes/quiz.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'content/quiz');
const OUT = join(ROOT, 'src/js/data/quiz');
const INDEX = join(ROOT, 'src/js/data/quiz-index.js');
const SERVER_BANK = join(ROOT, 'deploy/supabase/functions/daily-quiz/bank.js');
export const POOL = join(ROOT, 'content/quiz/daily-pool.json');
export const EXITS = join(ROOT, 'content/quiz/daily-exits.json');

/**
 * The daily pool file: first day -> ids that join the daily quiz that day.
 * @returns {Record<string, string[]>}
 */
export function readPool() {
  try {
    return JSON.parse(readFileSync(POOL, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * The daily exits file: first day -> ids that leave the daily quiz from that day on.
 * @returns {Record<string, string[]>}
 */
export function readExits() {
  try {
    return JSON.parse(readFileSync(EXITS, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * The pool with every bank question in it: new questions join on `newDay`. Pure.
 * @param {Record<string, string[]>} pool
 * @param {{ id: string }[]} bank
 * @param {string} newDay
 * @returns {{ pool: Record<string, string[]>, since: Map<string, string>, added: string[], missing: string[] }}
 */
export function extendPool(pool, bank, newDay) {
  const since = new Map();
  for (const [day, ids] of Object.entries(pool)) for (const id of ids) since.set(id, day);
  const inBank = new Set(bank.map((q) => q.id));
  const missing = [...since.keys()].filter((id) => !inBank.has(id));
  const added = bank.map((q) => q.id).filter((id) => !since.has(id));
  for (const id of added) since.set(id, newDay);
  const out = {};
  for (const day of [...new Set(since.values())].sort()) out[day] = [...since].filter(([, d]) => d === day).map(([id]) => id).sort();
  return { pool: out, since, added, missing };
}

/** The pool file text: stable, so an unchanged pool never shows up in a diff. */
export const poolText = (pool) => `${JSON.stringify(pool, null, 1)}\n`;

/**
 * Canonical daily-exits.json text: sorted days, sorted ids per day.
 * @param {Record<string, string[]>} exits
 * @returns {string}
 */
export function exitsText(exits) {
  const out = {};
  for (const day of Object.keys(exits).sort()) {
    const ids = [...exits[day]].sort();
    if (ids.length) out[day] = ids;
  }
  return `${JSON.stringify(out, null, 1)}\n`;
}

/** Two days after `now` (UTC): past "tomorrow" everywhere on Earth (UTC+14 at most). */
export function joinDay(now) {
  return new Date(now + 2 * 86400000).toISOString().slice(0, 10);
}

/** Tomorrow in UTC (`now` + 1 day): earliest day allowed for a newly added daily exit. */
export function nextDay(now) {
  return new Date(now + 86400000).toISOString().slice(0, 10);
}

/**
 * Extracts prior exit days (id -> until) from generated QUIZ_ROWS. Pure.
 * @param {any[][]} rows
 * @returns {Map<string, string>}
 */
export function previousExits(rows) {
  const out = new Map();
  for (const r of rows) {
    if (r[5]) out.set(r[0], r[5]);
  }
  return out;
}

const isIsoDay = (day) =>
  typeof day === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(day) &&
  new Date(Date.parse(`${day}T00:00:00Z`)).toISOString().slice(0, 10) === day;

/**
 * Validates `exits` against the bank, join days and the previous committed exits (append-only:
 * refuses removing an exit, moving an exit to another day, or adding a new exit earlier than
 * `minNewDay`). Pure.
 * @param {{
 *   exits: Record<string, string[]>,
 *   bank: { id: string }[],
 *   since?: Map<string, string>,
 *   prevExits?: Map<string, string>,
 *   minNewDay?: string|null,
 * }} opts
 * @returns {{ until: Map<string, string>, problems: string[] }}
 */
export function validateExits({ exits, bank, since = new Map(), prevExits = new Map(), minNewDay = null }) {
  const problems = [];
  const until = new Map();
  if (!exits || typeof exits !== 'object' || Array.isArray(exits)) {
    return { until, problems: ['daily-exits.json must be an object mapping YYYY-MM-DD to id arrays'] };
  }
  const inBank = new Set(bank.map((q) => q.id));
  for (const [day, ids] of Object.entries(exits)) {
    if (!isIsoDay(day)) problems.push(`${day}: invalid exit day`);
    else if (day < DAILY_QUIZ_EPOCH) problems.push(`${day}: exit day is before ${DAILY_QUIZ_EPOCH}`);
    if (!Array.isArray(ids)) {
      problems.push(`${day}: exit ids must be an array`);
      continue;
    }
    for (const id of ids) {
      if (!inBank.has(id)) problems.push(`${id}: not in bank`);
      if (until.has(id)) {
        problems.push(`${id}: listed more than once in daily-exits.json`);
        continue;
      }
      until.set(id, day);
      const joined = since.get(id);
      if (joined && day < joined) problems.push(`${id}: exit day ${day} is before join day ${joined}`);
    }
  }
  for (const [id, prevDay] of prevExits) {
    if (!until.has(id)) {
      problems.push(`${id}: exited on ${prevDay} and cannot be removed from daily-exits.json`);
    } else if (until.get(id) !== prevDay) {
      problems.push(`${id}: exit day changed from ${prevDay} to ${until.get(id)}; existing exits cannot move`);
    }
  }
  if (minNewDay) {
    for (const [id, day] of until) {
      if (!prevExits.has(id) && day < minNewDay) {
        problems.push(`${id}: new exit day ${day} is earlier than tomorrow UTC (${minNewDay})`);
      }
    }
  }
  return { until, problems };
}

/**
 * Reads every source file in topic order.
 * @returns {any[]}
 */
export function readBank() {
  const files = new Set(readdirSync(SRC).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')));
  return QUIZ_TOPICS.filter((t) => files.has(t.id)).flatMap((t) => JSON.parse(readFileSync(join(SRC, `${t.id}.json`), 'utf8')));
}

/**
 * The question as the site sees it in one language: English keeps every field; Hebrew swaps in
 * the translated prose and keeps code, answer and metadata from the English source.
 * @param {any} q
 * @param {'en'|'he'} lang
 */
export function forLang(q, lang) {
  const text = lang === 'he' ? q.he : q;
  const out = { id: q.id, topic: q.topic, subtopic: q.subtopic, level: q.level, q: text.q };
  if (q.code) Object.assign(out, { code: q.code, lang: q.lang });
  Object.assign(out, { options: text.options, answer: q.answer, why: text.why, wrong: text.wrong });
  if (q.ref) out.ref = q.ref;
  return out;
}

/**
 * Every output file and its text, keyed by absolute path.
 * @param {any[]} bank
 * @param {Map<string, string>} since id -> the day it joins the daily quiz
 * @param {Map<string, string>} [until] id -> the day it leaves the daily quiz
 * @returns {Map<string, string>}
 */
export function buildOutputs(bank, since, until = new Map()) {
  const sinceOf = (id) => since.get(id) ?? DAILY_QUIZ_EPOCH;
  const untilOf = (id) => until.get(id) ?? null;
  const later = bank.filter((q) => sinceOf(q.id) !== DAILY_QUIZ_EPOCH).map((q) => `  ${JSON.stringify(q.id)}: ${JSON.stringify(sinceOf(q.id))},`);
  const exited = bank.filter((q) => untilOf(q.id)).map((q) => `  ${JSON.stringify(q.id)}: ${JSON.stringify(untilOf(q.id))},`);
  const cappedTopics = [...DAILY_CAPPED_TOPICS].sort();
  const out = new Map();
  for (const lang of QUIZ_LANGS) {
    for (const t of QUIZ_TOPICS) {
      const items = bank.filter((q) => q.topic === t.id).map((q) => forLang(q, lang));
      if (items.length) out.set(join(OUT, lang, `${t.id}.json`), `${JSON.stringify(items)}\n`);
    }
  }
  const rows = bank.map((q) => `  [${JSON.stringify(q.id)}, ${JSON.stringify(q.topic)}, ${JSON.stringify(q.level)}],`);
  out.set(
    INDEX,
    [
      '// Generated by scripts/content/build-quiz.mjs from content/quiz/. Do not edit by hand.',
      '// [id, topic, level] for every quiz question: sessions are planned from this before any text loads.',
      'const ROWS = [',
      ...rows,
      '];',
      '// Questions that join the daily quiz after its first day (content/quiz/daily-pool.json).',
      'const SINCE = {',
      ...later,
      '};',
      '// Questions that leave the daily quiz from a given day on (content/quiz/daily-exits.json).',
      'const UNTIL = {',
      ...exited,
      '};',
      '',
      '/** @type {{ id: string, topic: string, level: string, since: string, until: string|null }[]} */',
      `export const QUIZ_INDEX = ROWS.map(([id, topic, level]) => ({ id, topic, level, since: SINCE[id] ?? ${JSON.stringify(DAILY_QUIZ_EPOCH)}, until: UNTIL[id] ?? null }));`,
      '',
    ].join('\n'),
  );
  out.set(
    SERVER_BANK,
    [
      '// Generated by scripts/content/build-quiz.mjs from content/quiz/. Do not edit by hand.',
      '// [id, topic, answer index in authored order, option count, join day, exit day or null].',
      `export const DAILY_QUIZ_EPOCH = ${JSON.stringify(DAILY_QUIZ_EPOCH)};`,
      `export const DAILY_QUIZ_SIZE = ${DAILY_QUIZ_SIZE};`,
      `export const DAILY_LANG_CAP_SINCE = ${JSON.stringify(DAILY_LANG_CAP_SINCE)};`,
      `export const DAILY_LANG_CAP = ${DAILY_LANG_CAP};`,
      `export const DAILY_CAPPED_TOPICS = new Set(${JSON.stringify(cappedTopics)});`,
      'export const QUIZ_ROWS = [',
      ...bank.map((q) => `  [${JSON.stringify(q.id)}, ${JSON.stringify(q.topic)}, ${q.answer}, ${q.options.length}, ${JSON.stringify(sinceOf(q.id))}, ${JSON.stringify(untilOf(q.id))}],`),
      '];',
      '',
    ].join('\n'),
  );
  return out;
}

// Run as a script, not when a test imports the helpers.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const now = Date.now();
  const bank = readBank();
  const problems = validateBank({ topics: QUIZ_TOPICS, questions: bank });
  if (problems.length) {
    console.error(`content/quiz has ${problems.length} problem(s):\n  ${problems.slice(0, 40).join('\n  ')}`);
    process.exit(1);
  }
  const { pool, since, added, missing } = extendPool(readPool(), bank, joinDay(now));
  if (missing.length) {
    console.error(`These questions are in the daily pool but no longer in the bank: ${missing.join(', ')}.\nDeleting a question changes the daily quiz of every day since it joined; edit it instead.`);
    process.exit(1);
  }
  let prevExits = new Map();
  try {
    const prev = await import(pathToFileURL(SERVER_BANK).href);
    prevExits = previousExits(prev.QUIZ_ROWS ?? []);
  } catch {
    // First build before bank.js exists.
  }
  const exits = readExits();
  const { until, problems: exitProblems } = validateExits({ exits, bank, since, prevExits, minNewDay: nextDay(now) });
  if (exitProblems.length) {
    console.error(`content/quiz/daily-exits.json has ${exitProblems.length} problem(s):\n  ${exitProblems.slice(0, 40).join('\n  ')}`);
    process.exit(1);
  }
  writeFileSync(POOL, poolText(pool));
  writeFileSync(EXITS, exitsText(exits));
  if (added.length) console.log(`daily pool: ${added.length} new question(s) join on ${since.get(added[0])}`);
  if (until.size) console.log(`daily exits: ${until.size} question(s) retired from the daily quiz`);
  rmSync(OUT, { recursive: true, force: true });
  for (const [path, text] of buildOutputs(bank, since, until)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
  console.log(`quiz: ${bank.length} questions in ${new Set(bank.map((q) => q.topic)).size} topics, ${QUIZ_LANGS.length} languages`);
}
