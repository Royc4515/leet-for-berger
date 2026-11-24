/**
 * What the preview pages are built from (scripts/share/pages.mjs), read from the site's own data:
 * the shipped problems, where each sits on the map, the topics, the companies with their logos,
 * the learning path and the quiz. Shared by the builder and its tests.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { availableEntries } from '../../src/js/problems/index.js';
import { TOPICS } from '../../src/js/data/taxonomy.js';
import { conceptLabel } from '../../src/js/data/learning-path.js';
import { expandRows, companyProgress, monogram } from '../../src/js/data/company-sets.js';
import { QUIZ_TOPICS } from '../../src/js/data/quiz-topics.js';
import { QUIZ_INDEX } from '../../src/js/data/quiz-index.js';
import { DAILY_QUIZ_SIZE } from '../../src/js/modes/quiz.js';

/**
 * @param {string} [root] the repository
 * @returns {Parameters<typeof import('./pages.mjs').sharePages>[0]}
 */
export function shareData(root = fileURLToPath(new URL('../../', import.meta.url))) {
  const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
  const sets = read('src/js/data/company-sets.json');
  const logos = read('src/js/data/company-logos.json').logos;
  const path = read('src/js/data/essential-path.json');
  return {
    problems: availableEntries(),
    placed: read('src/js/data/problem-topics.json'),
    topics: TOPICS,
    conceptTitle: conceptLabel,
    companies: sets.companies.map((c) => ({
      slug: c.slug,
      name: c.name,
      israel: c.israel,
      onSite: companyProgress(expandRows(sets, c), () => false).onSite,
      // Relative to scripts/share/card.html, where the image is drawn.
      logo: logos[c.slug] ? `../../src/brand/companies/${c.slug}.webp` : null,
      letters: monogram(c.name),
      bleed: logos[c.slug]?.bleed,
      color: logos[c.slug]?.color,
    })),
    path: { total: path.reduce((n, t) => n + t.topics.reduce((m, tp) => m + tp.problems.length, 0), 0), tiers: path.length },
    quiz: { topics: QUIZ_TOPICS.length, questions: QUIZ_INDEX.length, daily: DAILY_QUIZ_SIZE },
  };
}
