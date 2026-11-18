// Walkthrough prose (explanationHtml): format and coverage of the essential path (docs/PLAN.md, stage D).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { availableProblems } from '../src/js/problems/index.js';
import { pathOrder } from '../src/js/data/learning-path.js';

const SECTIONS = ['Idea', 'Why it works', 'Complexity', 'Pitfall'];

/** What is wrong with one explanation, as messages. */
export function explanationProblems(id, html) {
  const errs = [];
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const heads = [...html.matchAll(/<h4>([^<]+)<\/h4>/g)].map((m) => m[1]);
  if (heads.join('|') !== SECTIONS.join('|')) errs.push(`${id}: sections must be ${SECTIONS.join(', ')} in order, got ${heads.join(', ')}`);
  if (/—/.test(html)) errs.push(`${id}: em dash (use a hyphen)`);
  if (/leetcode/i.test(text)) errs.push(`${id}: mentions LeetCode (explain our problem, in our words)`);
  if (/<script|on\w+=/i.test(html)) errs.push(`${id}: script or inline handler`);
  const words = text.split(' ').length;
  if (words < 60 || words > 260) errs.push(`${id}: ${words} words (keep it 60 to 260)`);
  if (!/O\(/.test(text)) errs.push(`${id}: the Complexity section needs a big-O`);
  return errs;
}

test('every explanation follows the format', () => {
  const errs = availableProblems().filter((p) => p.explanationHtml).flatMap((p) => explanationProblems(p.id, p.explanationHtml));
  assert.deepEqual(errs, []);
});

test('every essential-path problem has an explanation', () => {
  const path = JSON.parse(readFileSync(new URL('../src/js/data/essential-path.json', import.meta.url)));
  const byId = new Map(availableProblems().map((p) => [p.id, p]));
  const missing = pathOrder(path).map((p) => p.id).filter((id) => !byId.get(id)?.explanationHtml);
  // Ratchet: the number may only go down until it reaches zero.
  assert.ok(missing.length <= Number(process.env.EXPLANATIONS_MISSING_MAX ?? 0), `${missing.length} essential problems still need explanationHtml: ${missing.join(', ')}`);
});
