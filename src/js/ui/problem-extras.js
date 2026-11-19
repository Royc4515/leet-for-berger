/**
 * Below the statement in practice mode: the walkthrough (unlocked by an Accepted submit or a
 * revealed solution) and this problem's submission history.
 */
import { h, mount, trustedHtml } from './dom.js';
import { loadProblemMeta } from './problem-context.js';

const when = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

/**
 * @param {{ problem: any, store: any, getLanguage: () => string, languageLabel: (id: string) => string,
 *   loadSolution: (problemId: string, lang: string) => Promise<string>, onLoadCode: (lang: string, code: string) => void,
 *   canPush?: () => boolean, onPush?: (entry: any) => void }} opts
 * @returns {{ el: HTMLElement, dispose: () => void }}
 */
export function createProblemExtras({ problem, store, getLanguage, languageLabel, loadSolution, onLoadCode, canPush = () => false, onPush = () => {} }) {
  const walkthroughBody = h('div.walkthrough-body');
  const historyBody = h('div.history-body');
  const historySummary = h('span', {}, 'Submissions');
  const walkthrough = h('details.extra-card.walkthrough', {}, h('summary', {}, 'Walkthrough'), walkthroughBody);
  const history = h('details.extra-card.history', {}, h('summary', {}, historySummary), historyBody);
  const el = h('div.problem-extras', {}, walkthrough, history);
  let codeToken = 0;

  async function showSolution(target) {
    const lang = getLanguage();
    const token = ++codeToken;
    mount(target, h('p.hint-text', {}, 'Loading the solution...'));
    try {
      const code = await loadSolution(problem.id, lang);
      if (token !== codeToken) return;
      mount(target, h('div.hint-text', {}, `Verified solution, ${languageLabel(lang)}. It passes all 15 tests in CI.`), h('pre.solution-code', {}, h('code', {}, code)));
    } catch (err) {
      if (token === codeToken) mount(target, h('p.hint-text', {}, `Could not load the solution: ${err.message}`));
    }
  }

  function renderWalkthrough(entry) {
    const unlocked = entry?.status === 'solved' || entry?.revealed;
    if (!unlocked) {
      mount(walkthroughBody, h('p.hint-text', {}, 'Unlocks after an Accepted submit. Reveal Solution unlocks it too, and marks the problem as assisted.'));
      return;
    }
    const complexity = h('div.walkthrough-complexity');
    loadProblemMeta().then((all) => {
      const m = all[problem.id];
      const parts = [];
      if (problem.growth?.target) parts.push(h('div', {}, 'Growth target here: ', h('code', {}, problem.growth.target)));
      if (m?.bestKnown) parts.push(h('div', {}, `Best known for LeetCode ${m.number}: `, h('code', {}, m.bestKnown.time), ' time', m.bestKnown.space ? [', ', h('code', {}, m.bestKnown.space), ' space'] : null));
      mount(complexity, parts.length ? [h('h3', {}, 'Complexity'), parts] : null);
    });
    const solution = h('div.walkthrough-solution');
    const showBtn = h('button.btn.btn-secondary.btn-sm', { type: 'button' }, 'Show the verified solution');
    showBtn.addEventListener('click', () => {
      showBtn.hidden = true;
      showSolution(solution);
    });
    mount(
      walkthroughBody,
      // Author-written prose, same trust level as the statement.
      problem.explanationHtml ? trustedHtml('div.statement', problem.explanationHtml) : null,
      problem.patterns?.length ? [h('h3', {}, 'Key idea'), h('div.problem-tags', {}, problem.patterns.map((p) => h('span.tag', {}, p)))] : null,
      problem.hints?.length ? [h('h3', {}, 'Reasoning, step by step'), h('ol.walkthrough-steps', {}, problem.hints.map((hint) => h('li', {}, hint)))] : null,
      complexity,
      h('h3', {}, 'Solution'),
      solution,
      showBtn,
    );
  }

  function renderHistory(entry) {
    const items = entry?.history ?? [];
    historySummary.textContent = items.length ? `Submissions (${items.length})` : 'Submissions';
    if (!items.length) {
      mount(historyBody, h('p.hint-text', {}, 'No submissions yet. Submit keeps your last 10 here, with the code.'));
      return;
    }
    mount(
      historyBody,
      h(
        'ol.history-list',
        {},
        items.map((s) => {
          const load = h('button.btn.btn-ghost.btn-sm', { type: 'button', disabled: !s.code, title: s.code ? 'Replace the editor content with this code' : 'This code was too long to keep' }, 'Load code');
          load.addEventListener('click', () => s.code && onLoadCode(s.language, s.code));
          const push = canPush() && s.code && s.verdict === 'Accepted' ? h('button.btn.btn-ghost.btn-sm', { type: 'button', title: entry?.revealed ? 'Marked assisted: the solution was revealed' : 'Commit this code to your GitHub repository' }, 'Push to GitHub') : null;
          push?.addEventListener('click', () => onPush(s));
          return h(
            'li',
            {},
            h(`span.history-verdict${s.verdict === 'Accepted' ? '.ok' : '.bad'}`, {}, s.verdict),
            h('span.history-meta', {}, `${s.passed}/${s.total} · ${languageLabel(s.language)} · ${when(s.at)}`),
            load,
            push,
          );
        }),
      ),
    );
  }

  let lastEntry;
  const render = () => {
    const entry = store.get().problems[problem.id];
    // Re-rendering the walkthrough on every store change would reset an open solution view.
    if (entry === lastEntry) return;
    const wasUnlocked = lastEntry?.status === 'solved' || lastEntry?.revealed;
    const isUnlocked = entry?.status === 'solved' || entry?.revealed;
    if (lastEntry === undefined || wasUnlocked !== isUnlocked) renderWalkthrough(entry);
    renderHistory(entry);
    lastEntry = entry ?? null;
  };
  render();
  const unsub = store.subscribe(render);
  return {
    el,
    dispose: () => {
      codeToken++;
      unsub();
    },
  };
}
