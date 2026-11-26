#!/usr/bin/env node
/**
 * Audits the quiz bank against content/quiz/classes.json: checks every question is classified,
 * reports counts per topic and per class, and shows how often syntax and trivia questions land
 * in the daily quiz.
 *
 * Usage: node scripts/content/quiz-audit.mjs [--until=YYYY-MM-DD] [--sim=100]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIZ_TOPICS } from '../../src/js/data/quiz-topics.js';
import { QUIZ_INDEX } from '../../src/js/data/quiz-index.js';
import { dailyQuizIds, DAILY_QUIZ_EPOCH } from '../../src/js/modes/quiz.js';
import { readBank } from './build-quiz.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CLASSES_FILE = join(ROOT, 'content/quiz/classes.json');

/** Allowed question classes in content/quiz/classes.json. */
export const QUIZ_CLASSES = ['concept', 'concept-with-code', 'syntax', 'trivia'];

/** Classes eligible for the concept-focused daily quiz. */
export const CONCEPT_CLASSES = new Set(['concept', 'concept-with-code']);

/**
 * Reads content/quiz/classes.json (question id -> class).
 * @returns {Record<string, string>}
 */
export function readClasses() {
  return JSON.parse(readFileSync(CLASSES_FILE, 'utf8'));
}

/**
 * Validates that `classes` covers every question in `bank` with a valid class, has no unknown
 * ids, and agrees with whether each concept question carries a code block.
 * @param {{ id: string, code?: string }[]} bank
 * @param {Record<string, string>} classes
 * @returns {string[]} problems, empty when valid
 */
export function validateClasses(bank, classes) {
  const problems = [];
  const valid = new Set(QUIZ_CLASSES);
  const byId = new Map(bank.map((q) => [q.id, q]));
  const keys = Object.keys(classes);
  const sortedKeys = [...keys].sort((a, b) => (a < b ? -1 : 1));
  if (keys.some((k, i) => k !== sortedKeys[i])) problems.push('classes.json keys must be sorted alphabetically');
  for (const q of bank) {
    const cls = classes[q.id];
    if (!cls) {
      problems.push(`${q.id}: missing class`);
      continue;
    }
    if (!valid.has(cls)) {
      problems.push(`${q.id}: unknown class ${cls}`);
      continue;
    }
    if (cls === 'concept' && q.code) problems.push(`${q.id}: classified as concept but has a code block`);
    if (cls === 'concept-with-code' && !q.code) problems.push(`${q.id}: classified as concept-with-code but has no code block`);
  }
  for (const id of keys) {
    if (!byId.has(id)) problems.push(`${id}: not found in bank`);
  }
  return problems;
}

const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/**
 * Computes counts per class, per topic, per group, and daily-quiz class rates. Pure.
 * @param {{
 *   bank: { id: string, topic: string, code?: string }[],
 *   topics: { id: string, group: string }[],
 *   classes: Record<string, string>,
 *   index: { id: string, topic: string, since?: string }[],
 *   fromDay: string,
 *   untilDay: string,
 *   simDays?: number,
 * }} opts
 */
export function summarizeAudit({ bank, topics, classes, index, fromDay, untilDay, simDays = 100 }) {
  const emptyCounts = () => Object.fromEntries(QUIZ_CLASSES.map((c) => [c, 0]));
  const totals = emptyCounts();
  const byGroup = new Map();
  const byTopic = [];
  for (const t of topics) {
    const counts = emptyCounts();
    const qs = bank.filter((q) => q.topic === t.id);
    for (const q of qs) {
      const cls = classes[q.id];
      counts[cls]++;
      totals[cls]++;
    }
    const g = byGroup.get(t.group) ?? { group: t.group, total: 0, ...emptyCounts() };
    g.total += qs.length;
    for (const c of QUIZ_CLASSES) g[c] += counts[c];
    byGroup.set(t.group, g);
    byTopic.push({
      topic: t.id,
      group: t.group,
      total: qs.length,
      ...counts,
      eligible: counts.concept + counts['concept-with-code'],
    });
  }

  const langTopics = new Set(topics.filter((t) => t.group === 'language').map((t) => t.id));
  const dailyRange = (start, end) => {
    const days = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const ids = dailyQuizIds(index, d);
      const items = ids.map((id) => {
        const entry = index.find((e) => e.id === id);
        return { id, topic: entry?.topic ?? '', cls: classes[id] };
      });
      days.push({ day: d, items });
    }
    const counts = emptyCounts();
    const langSlotsDist = {};
    let daysWithSyntaxOrTrivia = 0;
    let daysWithTwoPlusLang = 0;
    for (const d of days) {
      let hasNonConcept = false;
      let langSlots = 0;
      for (const item of d.items) {
        counts[item.cls]++;
        if (!CONCEPT_CLASSES.has(item.cls)) hasNonConcept = true;
        if (langTopics.has(item.topic)) langSlots++;
      }
      if (hasNonConcept) daysWithSyntaxOrTrivia++;
      if (langSlots >= 2) daysWithTwoPlusLang++;
      langSlotsDist[langSlots] = (langSlotsDist[langSlots] ?? 0) + 1;
    }
    const slots = days.reduce((n, d) => n + d.items.length, 0);
    return { days, counts, slots, daysWithSyntaxOrTrivia, daysWithTwoPlusLang, langSlotsDist };
  };

  const past = dailyRange(fromDay, untilDay);
  const simEnd = addDays(fromDay, simDays - 1);
  const sim = dailyRange(fromDay, simEnd);

  return {
    total: bank.length,
    totals,
    byGroup: [...byGroup.values()],
    byTopic,
    past,
    sim,
  };
}

/**
 * Renders the audit summary as a plain-text report.
 * @param {ReturnType<typeof summarizeAudit>} summary
 * @returns {string}
 */
export function formatAuditReport(summary) {
  const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '0.0%');
  const lines = [];
  lines.push(`Quiz bank audit (${summary.total} questions)`);
  lines.push('');
  lines.push('Overall counts:');
  for (const c of QUIZ_CLASSES) {
    lines.push(`  ${c.padEnd(20)} ${String(summary.totals[c]).padStart(3)}  (${pct(summary.totals[c], summary.total)})`);
  }
  const eligibleTotal = summary.totals.concept + summary.totals['concept-with-code'];
  const nonConceptTotal = summary.totals.syntax + summary.totals.trivia;
  lines.push(`  ${'eligible (concept*)'.padEnd(20)} ${String(eligibleTotal).padStart(3)}  (${pct(eligibleTotal, summary.total)})`);
  lines.push(`  ${'syntax + trivia'.padEnd(20)} ${String(nonConceptTotal).padStart(3)}  (${pct(nonConceptTotal, summary.total)})`);

  lines.push('');
  lines.push('By topic group:');
  lines.push('  group      total  concept  w/code  syntax  trivia  eligible');
  for (const g of summary.byGroup) {
    const elig = g.concept + g['concept-with-code'];
    lines.push(
      `  ${g.group.padEnd(9)}  ${String(g.total).padStart(5)}  ${String(g.concept).padStart(7)}  ${String(g['concept-with-code']).padStart(6)}  ${String(g.syntax).padStart(6)}  ${String(g.trivia).padStart(6)}  ${String(elig).padStart(8)}`,
    );
  }

  lines.push('');
  lines.push('By topic:');
  lines.push('  topic               group     total  concept  w/code  syntax  trivia  eligible');
  for (const t of summary.byTopic) {
    lines.push(
      `  ${t.topic.padEnd(19)} ${t.group.padEnd(8)}  ${String(t.total).padStart(5)}  ${String(t.concept).padStart(7)}  ${String(t['concept-with-code']).padStart(6)}  ${String(t.syntax).padStart(6)}  ${String(t.trivia).padStart(6)}  ${String(t.eligible).padStart(8)}`,
    );
  }

  lines.push('');
  lines.push(`Past daily quizzes (${summary.past.days.length} days, ${summary.past.slots} slots):`);
  for (const d of summary.past.days) {
    lines.push(`  ${d.day}:`);
    for (const item of d.items) {
      lines.push(`    - ${item.id} [${item.topic}] -> ${item.cls}`);
    }
  }
  const pastNon = summary.past.counts.syntax + summary.past.counts.trivia;
  lines.push(
    `  Summary: syntax=${summary.past.counts.syntax}, trivia=${summary.past.counts.trivia}, total syntax+trivia=${pastNon}/${summary.past.slots} (${pct(pastNon, summary.past.slots)}); ${summary.past.daysWithSyntaxOrTrivia}/${summary.past.days.length} days had at least one syntax or trivia question; ${summary.past.daysWithTwoPlusLang}/${summary.past.days.length} days had 2+ language-group questions.`,
  );

  lines.push('');
  const simNon = summary.sim.counts.syntax + summary.sim.counts.trivia;
  const distText = Object.entries(summary.sim.langSlotsDist)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');
  lines.push(
    `Current picker over ${summary.sim.days.length} days (${summary.sim.slots} slots): concept=${summary.sim.counts.concept}, concept-with-code=${summary.sim.counts['concept-with-code']}, syntax=${summary.sim.counts.syntax}, trivia=${summary.sim.counts.trivia}; syntax+trivia=${simNon}/${summary.sim.slots} (${pct(simNon, summary.sim.slots)}), ${summary.sim.daysWithSyntaxOrTrivia}/${summary.sim.days.length} days (${pct(summary.sim.daysWithSyntaxOrTrivia, summary.sim.days.length)}) with at least one.`,
  );
  lines.push(
    `Language-group slots per day (${summary.sim.days.length} days): ${distText} (${summary.sim.daysWithTwoPlusLang}/${summary.sim.days.length} days with 2+ language topics).`,
  );
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (name, fallback) => {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : fallback;
  };
  const untilDay = arg('until', new Date().toISOString().slice(0, 10));
  const simDays = Number(arg('sim', '100'));
  const bank = readBank();
  const classes = readClasses();
  const problems = validateClasses(bank, classes);
  if (problems.length) {
    console.error(`content/quiz/classes.json has ${problems.length} problem(s):\n  ${problems.slice(0, 40).join('\n  ')}`);
    process.exit(1);
  }
  const summary = summarizeAudit({ bank, topics: QUIZ_TOPICS, classes, index: QUIZ_INDEX, fromDay: DAILY_QUIZ_EPOCH, untilDay, simDays });
  console.log(formatAuditReport(summary));
}
