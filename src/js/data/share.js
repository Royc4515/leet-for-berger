/**
 * What a share button sends from each part of the site (owner's request): a title, a line of text
 * and the page it points to. Spoiler-free by rule: a problem's name and difficulty, a score or a
 * count, never code, test cases or an answer, so a friend who opens the link can still solve it.
 *
 * Pure: no DOM; ui/share.js hands the result to the share sheet or the clipboard.
 */

export const SITE_NAME = 'Leet-For-Berger';

/** @typedef {{ title: string, text: string, hash: string }} SharePayload */

/**
 * The address a shared page opens: this site, at the page's hash route.
 * @param {string} hash e.g. '#/problem/pair-sum-target'
 * @param {{ origin: string, pathname: string }} base where the site is served (location in the browser)
 * @returns {string}
 */
export function shareUrl(hash, base) {
  return `${base.origin}${base.pathname}${hash}`;
}

/**
 * A problem, to try.
 * @param {{ id: string, title: string, difficulty: string }} p
 * @returns {SharePayload}
 */
export function problemShare({ id, title, difficulty }) {
  return { title: `${title} · ${SITE_NAME}`, text: `${title} (${difficulty}): solve it in the browser against 15 tests.`, hash: `#/problem/${id}` };
}

/**
 * A solve, right after an Accepted submit: the problem and the language, never the code.
 * @param {{ id: string, title: string, difficulty: string, language: string, firstSolve?: boolean }} p
 * @returns {SharePayload}
 */
export function solveShare({ id, title, difficulty, language, firstSolve = false }) {
  return {
    title: `Solved ${title} · ${SITE_NAME}`,
    text: `${firstSolve ? 'First solve' : 'Solved'}: ${title} (${difficulty}) in ${language}, 15 of 15 tests passed. Your turn.`,
    hash: `#/problem/${id}`,
  };
}

/**
 * A company's practice set, with the sharer's progress on it when there is any.
 * @param {{ slug: string, name: string, onSite: number, solved?: number }} p
 * @returns {SharePayload}
 */
export function companyShare({ slug, name, onSite, solved = 0 }) {
  const text = solved > 0 ? `${solved} of ${onSite} of ${name}'s most asked interview problems solved.` : `${name}'s most asked interview problems: ${onSite} to practise in the browser.`;
  return { title: `${name} interview problems · ${SITE_NAME}`, text, hash: `#/companies/${slug}` };
}

/**
 * A place on the Problem Map: a topic, a subtopic or a problem.
 * @param {{ hash: string, name: string }} p
 * @returns {SharePayload}
 */
export function mapShare({ hash, name }) {
  return { title: `${name} · ${SITE_NAME} map`, text: `${name} on the ${SITE_NAME} map of interview topics.`, hash };
}

/**
 * Progress along the learning path.
 * @param {{ solved: number, total: number }} p
 * @returns {SharePayload}
 */
export function pathShare({ solved, total }) {
  const text = solved > 0 ? `${solved} of ${total} problems along the ${SITE_NAME} learning path.` : `The ${SITE_NAME} learning path: ${total} problems, one per core pattern, in order.`;
  return { title: `Learning path · ${SITE_NAME}`, text, hash: '#/path' };
}

/**
 * Today's daily challenge: its number and problem, whether the sharer solved it, their streak.
 * @param {{ number: number, title: string, solved?: boolean, streak?: number }} p
 * @returns {SharePayload}
 */
export function dailyShare({ number, title, solved = false, streak = 0 }) {
  const parts = [`Daily challenge #${number}: ${title}`];
  if (solved) parts.push('solved');
  if (streak > 1) parts.push(`${streak}-day streak`);
  return { title: `Daily challenge #${number} · ${SITE_NAME}`, text: `${parts.join(' · ')}. Same problem for everyone today.`, hash: '#/daily' };
}

/**
 * A finished mock interview or mock OA: the score and how many were solved.
 * @param {{ score: number, band: string, solved: number, total: number }} p
 * @returns {SharePayload}
 */
export function interviewShare({ score, band, solved, total }) {
  return { title: `Mock interview · ${SITE_NAME}`, text: `Mock interview: ${score}/100 (${band}), ${solved} of ${total} solved.`, hash: '#/modes' };
}

/**
 * A finished race against a bot.
 * @param {{ won: boolean, bot: string, title: string }} p
 * @returns {SharePayload}
 */
export function battleShare({ won, bot, title }) {
  return { title: `Battle · ${SITE_NAME}`, text: won ? `Won a race against ${bot} on ${title}.` : `Raced ${bot} on ${title}.`, hash: '#/battle' };
}
