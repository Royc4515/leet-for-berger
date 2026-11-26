#!/usr/bin/env node
/**
 * Audits the quiz bank against content/quiz/classes.json: validates every classification and
 * rescue/retire disposition, reports counts per topic and per class, and compares the current
 * daily-quiz picker against the proposed post-Phase-1 picker (retire exits + language cap).
 *
 * Usage: node scripts/content/quiz-audit.mjs [--until=YYYY-MM-DD] [--sim=100]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIZ_TOPICS } from '../../src/js/data/quiz-topics.js';
import { QUIZ_INDEX } from '../../src/js/data/quiz-index.js';
import { dailyQuizIds, DAILY_QUIZ_EPOCH, DAILY_QUIZ_SIZE, shuffled } from '../../src/js/modes/quiz.js';
import { mulberry32 } from '../../src/js/engine/rng.js';
import { hashString } from '../../src/js/data/recommend.js';
import { readBank } from './build-quiz.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CLASSES_FILE = join(ROOT, 'content/quiz/classes.json');

/** Allowed question classes in content/quiz/classes.json. */
export const QUIZ_CLASSES = ['concept', 'concept-with-code', 'syntax', 'trivia'];

/** Allowed actions for syntax and trivia questions. */
export const NON_CONCEPT_ACTIONS = ['rescue', 'retire'];

/** Classes directly eligible for the concept-focused daily quiz. */
export const CONCEPT_CLASSES = new Set(['concept', 'concept-with-code']);

/**
 * Reads content/quiz/classes.json (question id -> { class, action? }).
 * @returns {Record<string, { class: string, action?: 'rescue'|'retire' }>}
 */
export function readClasses() {
  return JSON.parse(readFileSync(CLASSES_FILE, 'utf8'));
}

/**
 * Validates that `classes` covers every question in `bank` with a valid class and disposition,
 * has no unknown ids, and agrees with whether each concept question carries a code block.
 * @param {{ id: string, code?: string }[]} bank
 * @param {Record<string, { class: string, action?: string }>} classes
 * @returns {string[]} problems, empty when valid
 */
export function validateClasses(bank, classes) {
  const problems = [];
  const validClass = new Set(QUIZ_CLASSES);
  const validAction = new Set(NON_CONCEPT_ACTIONS);
  const byId = new Map(bank.map((q) => [q.id, q]));
  const keys = Object.keys(classes);
  const sortedKeys = [...keys].sort((a, b) => (a < b ? -1 : 1));
  if (keys.some((k, i) => k !== sortedKeys[i])) problems.push('classes.json keys must be sorted alphabetically');
  for (const q of bank) {
    const entry = classes[q.id];
    if (!entry || typeof entry !== 'object') {
      problems.push(`${q.id}: missing class entry`);
      continue;
    }
    const { class: cls, action } = entry;
    if (!validClass.has(cls)) {
      problems.push(`${q.id}: unknown class ${cls}`);
      continue;
    }
    if (cls === 'concept' && q.code) problems.push(`${q.id}: classified as concept but has a code block`);
    if (cls === 'concept-with-code' && !q.code) problems.push(`${q.id}: classified as concept-with-code but has no code block`);
    if (CONCEPT_CLASSES.has(cls)) {
      if (action !== undefined) problems.push(`${q.id}: concept question must not have an action`);
    } else if (!validAction.has(action)) {
      problems.push(`${q.id}: ${cls} question requires action rescue or retire`);
    }
  }
  for (const id of keys) {
    if (!byId.has(id)) problems.push(`${id}: not found in bank`);
  }
  return problems;
}

const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/**
 * Simulates the proposed Phase 1 daily picker (excluding `excluded` ids and capping
 * `langTopics` at `langCap` per day). Pure; does not touch production picker code.
 * @param {{ index: { id: string, topic: string, since?: string }[], day: string, excluded: Set<string>, langTopics: Set<string>, langCap?: number }} opts
 * @returns {{ ids: string[], usedFillIn: boolean }}
 */
export function simulatePicker({ index, day, excluded, langTopics, langCap = 1 }) {
  const rand = mulberry32(hashString(`quiz:${day}`));
  const sorted = index
    .filter((q) => (!q.since || q.since <= day) && !excluded.has(q.id))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  const topics = shuffled([...new Set(sorted.map((q) => q.topic))].sort(), rand);
  const picks = [];
  let langPicked = 0;
  for (const t of topics) {
    if (picks.length === DAILY_QUIZ_SIZE) break;
    if (langCap != null && langTopics.has(t) && langPicked >= langCap) continue;
    const inTopic = sorted.filter((q) => q.topic === t);
    picks.push(inTopic[Math.floor(rand() * inTopic.length)].id);
    if (langTopics.has(t)) langPicked++;
  }
  const usedFillIn = picks.length < DAILY_QUIZ_SIZE;
  const rest = shuffled(sorted.filter((q) => !picks.includes(q.id)), rand);
  while (picks.length < DAILY_QUIZ_SIZE && rest.length) picks.push(rest.shift().id);
  return { ids: picks, usedFillIn };
}

/**
 * Computes counts per class, rescue/retire splits, per-topic breakdowns, past daily quizzes,
 * and 100-day simulations before and after the proposed Phase 1 rules. Pure.
 * @param {{
 *   bank: { id: string, topic: string, code?: string }[],
 *   topics: { id: string, group: string }[],
 *   classes: Record<string, { class: string, action?: 'rescue'|'retire' }>,
 *   index: { id: string, topic: string, since?: string }[],
 *   fromDay: string,
 *   untilDay: string,
 *   simDays?: number,
 * }} opts
 */
export function summarizeAudit({ bank, topics, classes, index, fromDay, untilDay, simDays = 100 }) {
  const emptyCounts = () => Object.fromEntries(QUIZ_CLASSES.map((c) => [c, 0]));
  const totals = emptyCounts();
  const actionTotals = { rescue: 0, retire: 0 };
  const rescueIds = [];
  const retireIds = [];
  const byGroup = new Map();
  const byTopic = [];

  for (const t of topics) {
    const counts = emptyCounts();
    let rescue = 0;
    let retire = 0;
    const qs = bank.filter((q) => q.topic === t.id);
    for (const q of qs) {
      const entry = classes[q.id];
      counts[entry.class]++;
      totals[entry.class]++;
      if (entry.action === 'rescue') {
        rescue++;
        actionTotals.rescue++;
        rescueIds.push(q.id);
      } else if (entry.action === 'retire') {
        retire++;
        actionTotals.retire++;
        retireIds.push(q.id);
      }
    }
    const g = byGroup.get(t.group) ?? { group: t.group, total: 0, ...emptyCounts(), rescue: 0, retire: 0 };
    g.total += qs.length;
    g.rescue += rescue;
    g.retire += retire;
    for (const c of QUIZ_CLASSES) g[c] += counts[c];
    byGroup.set(t.group, g);
    const conceptTotal = counts.concept + counts['concept-with-code'];
    byTopic.push({
      topic: t.id,
      group: t.group,
      total: qs.length,
      ...counts,
      rescue,
      retire,
      conceptTotal,
      afterRetire: qs.length - retire,
    });
  }

  const langTopics = new Set(topics.filter((t) => t.group === 'language').map((t) => t.id));
  const topicOf = new Map(index.map((e) => [e.id, e.topic]));

  const runWindow = (start, end, pickDay) => {
    const days = [];
    const counts = emptyCounts();
    const actions = { rescue: 0, retire: 0 };
    const langSlotsDist = {};
    let daysWithSyntaxOrTrivia = 0;
    let daysWithRetire = 0;
    let daysWithTwoPlusLang = 0;
    let fillInDays = 0;
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const { ids, usedFillIn } = pickDay(d);
      if (usedFillIn) fillInDays++;
      const items = ids.map((id) => ({
        id,
        topic: topicOf.get(id) ?? '',
        cls: classes[id].class,
        action: classes[id].action ?? null,
      }));
      days.push({ day: d, items });
      let hasNonConcept = false;
      let hasRetire = false;
      let langSlots = 0;
      for (const item of items) {
        counts[item.cls]++;
        if (item.action) actions[item.action]++;
        if (!CONCEPT_CLASSES.has(item.cls)) hasNonConcept = true;
        if (item.action === 'retire') hasRetire = true;
        if (langTopics.has(item.topic)) langSlots++;
      }
      if (hasNonConcept) daysWithSyntaxOrTrivia++;
      if (hasRetire) daysWithRetire++;
      if (langSlots >= 2) daysWithTwoPlusLang++;
      langSlotsDist[langSlots] = (langSlotsDist[langSlots] ?? 0) + 1;
    }
    const slots = days.reduce((n, d) => n + d.items.length, 0);
    return { days, counts, actions, slots, daysWithSyntaxOrTrivia, daysWithRetire, daysWithTwoPlusLang, langSlotsDist, fillInDays };
  };

  const currentPick = (d) => ({ ids: dailyQuizIds(index, d), usedFillIn: false });
  const retireSet = new Set(retireIds);
  const allNonConceptSet = new Set([...retireIds, ...rescueIds]);

  const past = runWindow(fromDay, untilDay, currentPick);
  const simEnd = addDays(fromDay, simDays - 1);
  const simCurrent = runWindow(fromDay, simEnd, currentPick);
  const simRetireOnly = runWindow(fromDay, simEnd, (d) => simulatePicker({ index, day: d, excluded: retireSet, langTopics, langCap: 1 }));
  const simAllNonConcept = runWindow(fromDay, simEnd, (d) => simulatePicker({ index, day: d, excluded: allNonConceptSet, langTopics, langCap: 1 }));

  return {
    total: bank.length,
    totals,
    actionTotals,
    rescueIds,
    retireIds,
    byGroup: [...byGroup.values()],
    byTopic,
    past,
    simCurrent,
    simRetireOnly,
    simAllNonConcept,
  };
}

/**
 * Renders the audit summary as a plain-text report.
 * @param {ReturnType<typeof summarizeAudit>} summary
 * @returns {string}
 */
export function formatAuditReport(summary) {
  const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '0.0%');
  const distText = (dist) =>
    Object.entries(dist)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([k, v]) => `${k}:${v}`)
      .join(' ');
  const lines = [];
  lines.push(`Quiz bank audit (${summary.total} questions)`);
  lines.push('');
  lines.push('Overall counts:');
  for (const c of QUIZ_CLASSES) {
    lines.push(`  ${c.padEnd(20)} ${String(summary.totals[c]).padStart(3)}  (${pct(summary.totals[c], summary.total)})`);
  }
  const conceptTotal = summary.totals.concept + summary.totals['concept-with-code'];
  const nonConceptTotal = summary.totals.syntax + summary.totals.trivia;
  lines.push(`  ${'concept + w/code'.padEnd(20)} ${String(conceptTotal).padStart(3)}  (${pct(conceptTotal, summary.total)})`);
  lines.push(`  ${'syntax + trivia'.padEnd(20)} ${String(nonConceptTotal).padStart(3)}  (${pct(nonConceptTotal, summary.total)})`);
  lines.push(`    -> rescue          ${String(summary.actionTotals.rescue).padStart(3)}  (${pct(summary.actionTotals.rescue, nonConceptTotal)} of syntax+trivia)`);
  lines.push(`    -> retire          ${String(summary.actionTotals.retire).padStart(3)}  (${pct(summary.actionTotals.retire, nonConceptTotal)} of syntax+trivia)`);

  lines.push('');
  lines.push('By topic group:');
  lines.push('  group      total  concept  w/code  syntax  trivia  rescue  retire  concept*  after-retire');
  for (const g of summary.byGroup) {
    const conc = g.concept + g['concept-with-code'];
    lines.push(
      `  ${g.group.padEnd(9)}  ${String(g.total).padStart(5)}  ${String(g.concept).padStart(7)}  ${String(g['concept-with-code']).padStart(6)}  ${String(g.syntax).padStart(6)}  ${String(g.trivia).padStart(6)}  ${String(g.rescue).padStart(6)}  ${String(g.retire).padStart(6)}  ${String(conc).padStart(8)}  ${String(g.total - g.retire).padStart(12)}`,
    );
  }

  lines.push('');
  lines.push('By topic:');
  lines.push('  topic               group     total  concept  w/code  syntax  trivia  rescue  retire  concept*  after-retire');
  for (const t of summary.byTopic) {
    lines.push(
      `  ${t.topic.padEnd(19)} ${t.group.padEnd(8)}  ${String(t.total).padStart(5)}  ${String(t.concept).padStart(7)}  ${String(t['concept-with-code']).padStart(6)}  ${String(t.syntax).padStart(6)}  ${String(t.trivia).padStart(6)}  ${String(t.rescue).padStart(6)}  ${String(t.retire).padStart(6)}  ${String(t.conceptTotal).padStart(8)}  ${String(t.afterRetire).padStart(12)}`,
    );
  }

  lines.push('');
  lines.push(`Past daily quizzes (${summary.past.days.length} days, ${summary.past.slots} slots):`);
  for (const d of summary.past.days) {
    lines.push(`  ${d.day}:`);
    for (const item of d.items) {
      const tag = item.action ? `${item.cls} (${item.action})` : item.cls;
      lines.push(`    - ${item.id} [${item.topic}] -> ${tag}`);
    }
  }
  const pastNon = summary.past.counts.syntax + summary.past.counts.trivia;
  lines.push(
    `  Summary: syntax=${summary.past.counts.syntax}, trivia=${summary.past.counts.trivia}, total=${pastNon}/${summary.past.slots} (${pct(pastNon, summary.past.slots)}); ${summary.past.daysWithSyntaxOrTrivia}/${summary.past.days.length} days with syntax/trivia; ${summary.past.daysWithTwoPlusLang}/${summary.past.days.length} days with 2+ language topics.`,
  );

  const fmtSim = (label, sim) => {
    const non = sim.counts.syntax + sim.counts.trivia;
    lines.push('');
    lines.push(`${label} (${sim.days.length} days, ${sim.slots} slots):`);
    lines.push(
      `  classes: concept=${sim.counts.concept}, concept-with-code=${sim.counts['concept-with-code']}, syntax=${sim.counts.syntax}, trivia=${sim.counts.trivia} (syntax+trivia=${non}/${sim.slots} = ${pct(non, sim.slots)}; ${sim.daysWithSyntaxOrTrivia}/${sim.days.length} days with any; retire=${sim.actions.retire}/${sim.slots})`,
    );
    lines.push(
      `  language slots/day: ${distText(sim.langSlotsDist)} (${sim.daysWithTwoPlusLang}/${sim.days.length} days with 2+); fill-in loop used: ${sim.fillInDays}/${sim.days.length} days`,
    );
  };

  fmtSim('Simulation BEFORE (current picker)', summary.simCurrent);
  fmtSim('Simulation AFTER A (retire exited + lang cap <= 1; rescue rewritten in Phase 2 -> 0% syntax/trivia after Phase 2)', summary.simRetireOnly);
  fmtSim('Simulation AFTER B (all syntax+trivia exited + lang cap <= 1)', summary.simAllNonConcept);

  lines.push('');
  lines.push(`Rescue list (${summary.rescueIds.length}):`);
  for (const id of summary.rescueIds) lines.push(`  - ${id}`);
  lines.push('');
  lines.push(`Retire list (${summary.retireIds.length}):`);
  for (const id of summary.retireIds) lines.push(`  - ${id}`);

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
