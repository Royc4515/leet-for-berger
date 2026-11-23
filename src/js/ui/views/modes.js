/**
 * Modes: hub, Interview Simulator, 1v1 Battle (bot).
 */
import { h, mount, toast, confirmDialog, difficulty, chipGroup, ilMark, siteFooter } from '../dom.js';
import { createPicker, createOptionGroup } from '../picker.js';
import { renderWorkspace } from './workspace.js';
import { availableEntries, catalogEntry, loadProblem, TOPICS, DIFFICULTIES } from '../../problems/index.js';
import * as Interview from '../../modes/interview.js';
import { createBot, BOT_LEVELS } from '../../modes/battle.js';
import { OA_FORMATS, pickOaProblems } from '../../modes/mock-oa.js';
import { expandRows, monogram } from '../../data/company-sets.js';
import { loadRankedCompanies } from './companies.js';
import { israelBadge, ISRAEL_FILTERS, DEFAULT_ISRAEL_FILTER } from '../../data/israel-hiring.js';
import { usedTopics, pickRandom } from '../../modes/battle-picker.js';
import { LAST_SESSIONS_KEY } from '../../state/user-data.js';
import { parseLastResults, formatLastInterview, formatLastBattle } from '../../modes/last-results.js';
import { startTour, startTourIfDue } from '../tour.js';

/**
 * A mode's guided tour (data/tours.js): it starts on the first visit to the setup page and the
 * "How it works" button replays it. The returned close goes in the view's cleanup.
 * @param {string} id
 * @returns {{ replay: HTMLElement, close: () => void }}
 */
function modeTour(id) {
  let close = startTourIfDue(id);
  const replay = h('button.btn.btn-ghost.btn-sm.tour-replay', { type: 'button', 'aria-haspopup': 'dialog' }, 'How it works');
  replay.addEventListener('click', () => {
    close();
    close = startTour(id);
  });
  return { replay, close: () => close() };
}

function loadLastResults() {
  try {
    return parseLastResults(localStorage.getItem(LAST_SESSIONS_KEY));
  } catch {
    return { interview: null, battle: null };
  }
}

function saveLastResult(kind, value) {
  try {
    const next = { ...loadLastResults(), [kind]: value };
    localStorage.setItem(LAST_SESSIONS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

/* ======================= Hub ======================= */

/**
 * Render the Modes hub: two mode cards (Mock OA / Interview and 1v1 Battle) with at most one
 * primary button, optional last-session summary lines, and a compact note pointing to AI Mentor
 * inside practice problems.
 * @param {HTMLElement} root
 * @returns {() => void}
 */
export function renderModesHub(root) {
  const last = loadLastResults();
  const lastInterview = formatLastInterview(last.interview);
  const lastBattle = formatLastBattle(last.battle);
  const firstProblem = availableEntries()[0];

  const card = (cls, eyebrow, title, status, body, visual, facts, lastEl, actions) =>
    h(
      `article.mode-card.${cls}`,
      {},
      h('div.mode-visual', { 'aria-hidden': 'true' }, visual),
      h(
        'div.mode-copy',
        {},
        h('div.mode-top', {}, h('span.eyebrow', {}, eyebrow), h(`span.tag${status === 'Live' ? '.tag-live' : '.tag-muted'}`, {}, status)),
        h('h2', {}, title),
        h('p.mode-desc', {}, body),
        h('ul.mode-facts', {}, facts.map((f) => h('li', {}, f))),
        lastEl,
        h('div.mode-actions', {}, actions),
      ),
    );

  // The exam room: a clock face of three format arcs. The race: two lanes.
  const clockVisual = h('div.exam-clock', {}, h('span.exam-hand'), OA_FORMATS.map((f) => h('span.exam-mark', {}, `${f.minutes}`)));
  const raceVisual = h(
    'div.race-preview',
    {},
    h('div.race-preview-lane', {}, h('span.race-preview-name', {}, 'You'), h('span.race-preview-track', {}, h('span.race-preview-fill.is-you'))),
    h('div.race-preview-lane', {}, h('span.race-preview-name', {}, 'Bot'), h('span.race-preview-track', {}, h('span.race-preview-fill.is-bot'))),
  );

  mount(
    root,
    h(
      'div.page',
      {},
      h('header.page-head', {}, h('div', {}, h('span.eyebrow', {}, 'Under pressure'), h('h1', {}, 'Modes'), h('p.page-sub', {}, 'Practice the way it feels on the day: a timed exam room, or a race against a bot. Both use the same 15-case judge.'))),
      h(
        'div.mode-grid',
        {},
        card(
          'mode-exam',
          'Exam room',
          'Mock OA and interview',
          'Live',
          'A timed session with the problems hidden until the clock starts, then a scored report.',
          clockVisual,
          [`${OA_FORMATS.map((f) => `${f.minutes}`).join(', ')} minute formats, optionally from one company`, 'Navigation, Reveal and Mentor stay off; tab switches are logged', 'JavaScript, TypeScript and Python run; other languages are editor-only here'],
          lastInterview ? h(`p.mode-last.band-${lastInterview.band}`, {}, lastInterview.text) : h('p.mode-last.is-empty', {}, 'No session yet.'),
          h('a.btn.btn-primary', { href: '#/interview' }, 'Set up a session'),
        ),
        card(
          'mode-race',
          'Race',
          '1v1 Battle',
          'Bot only',
          'Race a paced bot on the same problem. The first accepted submission wins.',
          raceVisual,
          [`${BOT_LEVELS.length} opponents, from ${BOT_LEVELS[0].label.replace(' bot', '')} to ${BOT_LEVELS.at(-1).label.replace(' bot', '')}`, 'Two lanes show tests passed out of 15, live', 'Bots only: there are no live races against people'],
          lastBattle ? h(`p.mode-last${lastBattle.won ? '.is-win' : ''}`, {}, lastBattle.text) : h('p.mode-last.is-empty', {}, 'No race yet.'),
          h('a.btn.btn-secondary', { href: '#/battle' }, 'Race a bot'),
        ),
      ),
      h(
        'section.mentor-note',
        { 'aria-label': 'AI Mentor' },
        h(
          'div.mentor-note-copy',
          {},
          h('div.mentor-note-head', {}, h('h2', {}, 'AI Mentor'), h('span.tag.tag-muted', {}, 'Scripted')),
          h('p', {}, 'A side panel in every practice problem that asks guiding questions instead of handing out the answer. It runs an offline hint ladder for now.'),
        ),
        firstProblem ? h('a.btn.btn-secondary.btn-sm', { href: `#/problem/${firstProblem.id}` }, 'Try it in a problem') : null,
      ),
      siteFooter(),
    ),
  );
  return () => {};
}

/* ======================= Interview ======================= */

// Module-level so leaving and re-entering the route resumes instead of restarting.
let interview = null;
let interviewFormatLabel = '';
let interviewDrafts = null; // survives route changes with the session, reset on a new interview
let interviewProblems = null; // id -> hydrated problem, loaded before the clock starts

function finishAndRecordInterview() {
  interview = { ...Interview.finish(interview), activeProblemId: interview.activeProblemId };
  const a = Interview.analytics(interview);
  saveLastResult('interview', {
    formatLabel: interviewFormatLabel,
    score: a.score,
    band: a.band.band,
    bandLabel: a.band.label,
    solved: a.solved,
    total: a.problems.length,
  });
}

export function renderInterview(root, { store }) {
  if (!interview) return renderInterviewSetup(root, { store });
  if (!interview.endedAt && Interview.isOver(interview)) {
    finishAndRecordInterview();
  }
  if (interview.endedAt) return renderInterviewReport(root);
  return renderInterviewActive(root, { store });
}

/** Problems a timed session can use: anything with a browser language (SQL problems are their own track). */
const oaEligible = () => availableEntries().filter((p) => p.executable.some((l) => l !== 'sql'));

/** Companies with enough on-site problems to fill a mock OA. */
const MIN_COMPANY_PROBLEMS = 3;

/** Readable slot mix from an OA format (e.g. ['Medium', 'Medium', 'Hard'] -> '2 Medium + 1 Hard'). */
function formatMix(slots) {
  const counts = new Map();
  for (const s of slots) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()].map(([diff, n]) => `${n} ${diff}`).join(' + ');
}

function renderInterviewSetup(root, { store }) {
  const eligible = oaEligible();
  const eligibleIds = new Set(eligible.map((p) => p.id));
  let format = OA_FORMATS[1];
  let companyIds = null; // null = any company
  let companyName = '';
  const companyOf = new Map();

  const barSummary = h('div.setup-bar-summary', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const describe = () => {
    const pool = companyIds ? eligible.filter((p) => companyIds.includes(p.id)) : eligible;
    mount(
      barSummary,
      h('div.setup-bar-title', {}, h('strong', {}, format.label), h('span.setup-bar-meta', {}, `${format.minutes} min`)),
      h(
        'div.hint-text.setup-bar-sub',
        {},
        `${formatMix(format.slots)} · ${pool.length} problems${companyIds ? ` asked at ${companyName}` : ''}, unsolved first`,
      ),
    );
  };

  const formatGroup = createOptionGroup({
    label: 'Format',
    className: '.format-grid',
    options: OA_FORMATS,
    value: format.id,
    renderOption: (f) => ({
      className: '.format-card',
      attrs: { 'data-format': f.id },
      content: [
        h('strong.option-card-title', {}, f.label),
        h('span.option-card-fact', {}, h('span.option-card-meta', {}, `${f.minutes} min`), ` · ${formatMix(f.slots)}`),
      ],
    }),
    onChange: (next) => {
      format = next;
      describe();
    },
  });

  const anyOption = {
    id: '',
    name: 'Any company',
    label: 'Any company',
    searchText: 'Any company',
    count: eligible.length,
    israeli: false,
    israel: 'none',
  };

  const companyPicker = createPicker({
    label: 'Company',
    layout: 'grid',
    items: [anyOption],
    value: '',
    pageSize: 12,
    alwaysIncludeIds: [''],
    keepSelectedOutsideFilter: true,
    scope: {
      label: 'Show companies',
      options: ISRAEL_FILTERS.map((f) => ({ value: f.id, label: f.label })),
      value: DEFAULT_ISRAEL_FILTER,
    },
    search: { placeholder: 'Search companies', ariaLabel: 'Search companies' },
    predicate: (item, scopeVal) => {
      if (scopeVal === 'top') return item.israel === 'major';
      if (scopeVal === 'hiring') return item.israel !== 'none';
      return true;
    },
    emptyTitle: 'No matching companies',
    emptyBody: 'Try another search or switch the scope to All companies.',
    formatCount: ({ matched }) =>
      `${matched} ${matched === 1 ? 'company' : 'companies'} with enough problems on the site. Optional: draws from that company's list.`,
    formatSelected: (item) =>
      item ? ['Selected: ', h('strong', {}, item.name), ` (${item.count} ${item.count === 1 ? 'problem' : 'problems'})`] : 'Selected: Any company',
    renderOption: (item, { scope: scopeVal }) => ({
      className: '.option-card.company-option',
      attrs: { 'data-slug': item.id, 'data-israel': item.israel },
      content: [
        h('span.monogram', { 'aria-hidden': 'true' }, item.id ? monogram(item.name) : '*'),
        h('span.company-card-name', {}, item.name, item.israeli ? ilMark() : null),
        h('span.company-card-sub', {}, `${item.count} ${item.count === 1 ? 'problem' : 'problems'}`),
        scopeVal === 'all' && israelBadge(item.israel) ? h('span.company-card-sub.company-card-level', {}, israelBadge(item.israel)) : null,
      ],
    }),
    onSelect: (item) => {
      companyName = item.id ? item.name : '';
      companyIds = item.id ? companyOf.get(item.id) : null;
      describe();
    },
  });
  companyPicker.setStatus('Loading companies...');

  const eligibleIdsOf = (c, sets) => [...new Set(expandRows(sets, c).map((r) => r.practice?.contentId).filter((id) => id && eligibleIds.has(id)))];
  loadRankedCompanies().then((d) => {
    if (disposed) return;
    if (!d) {
      companyPicker.setStatus('Company data could not be loaded.');
      return;
    }
    const items = [anyOption];
    for (const c of d.ranked) {
      const ids = eligibleIdsOf(c, d.sets);
      if (ids.length >= MIN_COMPANY_PROBLEMS) {
        companyOf.set(c.slug, ids);
        items.push({
          id: c.slug,
          name: c.name,
          label: c.name,
          searchText: [c.name, ...(c.aliases ?? []).map((a) => a.name)].join(' '),
          count: ids.length,
          israeli: Boolean(c.israeli),
          israel: c.israel,
        });
      }
    }
    companyPicker.setItems(items);
  });

  describe();

  let disposed = false;
  const tour = modeTour('interview');
  const start = h('button.btn.btn-primary.btn-lg', { type: 'button' }, 'Start interview');
  start.addEventListener('click', async () => {
    const solvedIds = new Set(Object.entries(store.get().problems).filter(([, p]) => p.status === 'solved').map(([id]) => id));
    const candidates = (companyIds ? eligible.filter((p) => companyIds.includes(p.id)) : eligible).map((p) => ({ id: p.id, difficulty: p.difficulty }));
    // The clock seeds the pick so every OA differs; the pick itself is pure and tested.
    const problemIds = pickOaProblems({ candidates, format, seed: Date.now() & 0x7fffffff, solved: solvedIds });
    if (!problemIds.length) {
      toast('No problems available for this setup.', 'warn');
      return;
    }
    // Load every problem before creating the session: the clock starts in createSession, and
    // download and test-building time must never count against the candidate.
    start.disabled = true;
    start.textContent = 'Loading problems...';
    let loaded;
    try {
      loaded = await Promise.all(problemIds.map(loadProblem));
    } catch {
      if (disposed) return;
      start.disabled = false;
      start.textContent = 'Start interview';
      toast('The problems could not be loaded. Check your connection and try again.', 'error');
      return;
    }
    if (disposed) return;
    interviewProblems = new Map(loaded.map((p) => [p.id, p]));
    // don't touch / the clock starts here, so it must stay after the await above (load time is not the candidate's)
    interview = Interview.createSession({ problemIds, durationMs: format.minutes * 60 * 1000 });
    interviewFormatLabel = format.label;
    interviewDrafts = new Map();
    interview.activeProblemId = problemIds[0];
    window.dispatchEvent(new HashChangeEvent('hashchange')); // re-render current route
  });

  mount(
    root,
    h(
      'div.page.page-narrow.setup-page',
      {},
      h('a.back-link', { href: '#/modes' }, 'All modes'),
      h('header.page-head', {}, h('h1', {}, 'Mock OA and Interview'), tour.replay, h('p.page-sub', {}, 'Treat it like the real thing. The problems stay hidden until the clock starts.')),
      h(
        'div.setup-card',
        {},
        h('h2.setup-heading', {}, 'Format'),
        formatGroup.el,
        h('h2.setup-heading', {}, 'Company (optional)'),
        companyPicker.el,
        h('h2.setup-heading', {}, 'Rules'),
        h(
          'ul.rules.setup-rules',
          {},
          h('li', {}, 'Lockdown mode: navigation, Reveal, Mentor and complexity hints stay off.'),
          h('li', {}, 'JavaScript, TypeScript and Python run live; Java, C++, C, C# and Go are editor-only.'),
          h('li', {}, 'Tab switches cost integrity points; your best run per problem counts when time ends.'),
        ),
      ),
      h('div.setup-bar', { 'data-tour': 'oa-start' }, barSummary, start),
      siteFooter(),
    ),
  );
  formatGroup.el.dataset.tour = 'oa-format';
  companyPicker.el.dataset.tour = 'oa-company';
  return () => {
    disposed = true;
    tour.close();
    formatGroup.cleanup();
    companyPicker.cleanup();
  };
}

/* ======================= Shared Session Banner ======================= */

/**
 * Shared top banner for active Interview and Battle sessions (Step 8):
 * large tabular timer, optional middle content (race bars), state text, single exit button,
 * and a once-only aria-live warning announcement.
 */
function createSessionBanner({ kind, label, clockText, stateEl = null, middleEl = null, exitLabel, exitVariant = 'btn-danger', onExit }) {
  const clock = h('span.clock', { 'aria-live': 'off' }, clockText);
  // Keep the live region mounted and unhidden from first render so AT announces its first text update.
  const liveEl = h('span.sr-only.session-live', { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const alertEl = h('span.session-alert', { 'aria-hidden': 'true', hidden: true });
  const exitBtn = h(`button.btn.${exitVariant}.btn-sm.session-exit`, { type: 'button', onClick: onExit }, exitLabel);
  const el = h(
    `header.session-banner.${kind}`,
    {},
    h('div.session-banner-main', {}, h('strong.session-label', {}, label), clock, alertEl, liveEl, stateEl),
    middleEl ?? null,
    exitBtn,
  );
  let warned = false;
  return {
    el,
    clock,
    alertEl,
    liveEl,
    exitBtn,
    setClock(text) {
      clock.textContent = text;
    },
    announceWarning(text) {
      if (warned) return;
      warned = true;
      alertEl.hidden = false;
      alertEl.textContent = text;
      liveEl.textContent = text;
    },
  };
}

const SWITCHER_STATUS = {
  solved: { cls: 's-solved', label: 'Solved', srOnly: false },
  tried: { cls: 's-attempted', label: 'Tried', srOnly: false },
  todo: { cls: 's-todo', label: 'Not started', srOnly: true },
};

function renderInterviewActive(root, { store }) {
  document.body.classList.add('lockdown');
  const switches = h('span.session-state', {}, `Tab switches: ${interview.tabSwitches}`);

  const end = () => {
    finishAndRecordInterview();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  const banner = createSessionBanner({
    kind: 'interview',
    label: 'Interview',
    clockText: Interview.formatClock(Interview.remainingMs(interview)),
    stateEl: switches,
    exitLabel: 'End interview',
    exitVariant: 'btn-danger',
    onExit: async () => {
      const ok = await confirmDialog({
        title: 'End the interview now?',
        body: 'Your best results so far will be scored. This cannot be undone.',
        confirmLabel: 'End interview',
        danger: true,
      });
      if (ok) end();
    },
  });

  const switcher = interview.problemIds.length > 1 ? h('div.problem-switcher', { role: 'group', 'aria-label': 'Interview problems' }) : null;
  const syncSwitcher = () => {
    if (!switcher) return;
    mount(
      switcher,
      interview.problemIds.map((id, i) => {
        const st = Interview.problemStatus(interview, id);
        const meta = SWITCHER_STATUS[st];
        const active = id === interview.activeProblemId;
        return h(
          'button.chip.switcher-btn',
          {
            type: 'button',
            'data-problem-id': id,
            'data-status': st,
            'aria-pressed': String(active),
            onClick: () => switchTo(id),
          },
          h('span.switcher-label', {}, `Problem ${i + 1}`),
          h(
            `span.status-pill.${meta.cls}`,
            {},
            h('span.status-dot', { 'aria-hidden': 'true' }),
            meta.srOnly ? h('span.sr-only', {}, meta.label) : meta.label,
          ),
        );
      }),
    );
  };
  syncSwitcher();

  let cleanupWs = null;
  interviewDrafts ??= new Map();
  const host = h('div.session-host');
  mount(root, host);

  const mountProblem = () => {
    cleanupWs?.();
    cleanupWs = renderWorkspace(host, {
      problem: interviewProblems.get(interview.activeProblemId),
      store,
      session: {
        kind: 'interview',
        banner: banner.el,
        allowAssist: false,
        problemSwitcher: switcher,
        drafts: interviewDrafts,
        onResult: ({ kind, result, problemId }) => {
          interview = Interview.recordAttempt(interview, { problemId, passed: result.passed, total: result.total, accepted: result.accepted, kind });
          syncSwitcher();
        },
      },
    });
  };
  const switchTo = (id) => {
    interview.activeProblemId = id;
    syncSwitcher();
    mountProblem();
  };
  mountProblem();

  const updateTimer = ({ allowEnd = true } = {}) => {
    const ts = Interview.timerState(interview);
    banner.setClock(Interview.formatClock(ts.ms));
    banner.clock.classList.toggle('warning', ts.warning);
    if (ts.warning) banner.announceWarning('5 minutes left');
    if (allowEnd && ts.expired) {
      toast("Time's up.", 'warn');
      end();
    }
  };
  updateTimer({ allowEnd: false });
  const tick = setInterval(updateTimer, 500);

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      interview = { ...Interview.recordTabSwitch(interview), activeProblemId: interview.activeProblemId };
      switches.textContent = `Tab switches: ${interview.tabSwitches}`;
      switches.classList.toggle('is-warn', interview.tabSwitches > 0);
      toast('Tab switch logged.', 'warn');
    }
  };
  // Refresh/close mid-interview would lose the session; make the browser ask first.
  const onBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = '';
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('beforeunload', onBeforeUnload);

  return () => {
    clearInterval(tick);
    cleanupWs?.();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('beforeunload', onBeforeUnload);
    document.body.classList.remove('lockdown');
  };
}

function renderInterviewReport(root) {
  const a = Interview.analytics(interview);
  const statCell = (label, value) => h('div.stat-cell', {}, h('div.stat-value', {}, value), h('div.stat-label', {}, label));
  const again = h('button.btn.btn-primary', { type: 'button' }, 'New interview');
  again.addEventListener('click', () => {
    interview = null;
    interviewProblems = null;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  mount(
    root,
    h(
      'div.page.page-narrow',
      {},
      h('header.page-head', {}, h('h1', {}, 'Interview Report'), h('p.page-sub', {}, 'Coverage dominates the score; speed is a bonus; tab switches cost 5 points each (max 20).')),
      h(
        'div.report-score',
        {},
        h(
          `div.score-ring.band-${a.band.band}`,
          { style: { '--pct': a.score }, 'data-band': a.band.band },
          h('span.score-value', {}, String(a.score)),
          h('small', {}, '/ 100'),
        ),
        h(`span.score-band.band-${a.band.band}`, {}, a.band.label),
      ),
      h(
        'div.stats-row.report-stats',
        {},
        statCell('Time used', Interview.formatClock(a.usedMs)),
        statCell('Solved', `${a.solved} / ${a.problems.length}`),
        statCell('Runs / Submits', `${a.runs} / ${a.submissions}`),
        statCell('Tab switches', String(a.tabSwitches)),
      ),
      h(
        'div.setup-card.report-card',
        {},
        h('h2.setup-heading', {}, 'Per problem'),
        h(
          'div.report-problems',
          {},
          a.problems.map((p) => {
            const entry = catalogEntry(p.id);
            const title = entry?.title ?? p.id;
            const stMeta = SWITCHER_STATUS[p.status] ?? SWITCHER_STATUS.todo;
            return h(
              'div.report-problem',
              {},
              h(
                'div.report-problem-info',
                {},
                h(
                  'div.report-problem-head',
                  {},
                  h('strong.report-problem-title', {}, title),
                  entry ? difficulty(entry.difficulty) : null,
                  h(
                    `span.status-pill.${stMeta.cls}`,
                    {},
                    h('span.status-dot', { 'aria-hidden': 'true' }),
                    stMeta.label,
                  ),
                ),
                h(
                  'div.hint-text',
                  {},
                  `${Math.round(p.coverage * 100)}% tests${p.solved ? ` · solved at ${Interview.formatClock(p.solveTimeMs)}` : ''}`,
                ),
              ),
              h('a.btn.btn-secondary.btn-sm.report-review', { href: `#/problem/${p.id}`, 'aria-label': `Review ${title}` }, 'Review'),
            );
          }),
        ),
        h('div.mode-actions.report-actions', {}, again, h('a.btn.btn-secondary', { href: '#/' }, 'Back to problems')),
      ),
      siteFooter(),
    ),
  );
  return () => {};
}

/* ======================= Battle ======================= */

const BOT_META = {
  rookie: { mark: 'Rk', desc: 'Relaxed pace. Solves steadily with pauses.' },
  regular: { mark: 'Rg', desc: 'Interview pace. Solves at a typical speed.' },
  grandmaster: { mark: 'Gm', desc: 'Fast pace. Nearly twice as fast as Regular.' },
};

export function renderBattle(root, { store }) {
  const problems = availableEntries();
  let level = 'regular';
  let problemId = problems[0].id;
  const pf = { difficulty: 'all', topic: 'all' };
  let topicOpen = false;
  const topicLabel = (id) => TOPICS.find((t) => t.id === id)?.label ?? id;

  const barSummary = h('div.setup-bar-summary', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const describeStart = () => {
    const p = catalogEntry(problemId);
    const botLabel = BOT_LEVELS.find((l) => l.id === level)?.label ?? level;
    mount(
      barSummary,
      h('div.setup-bar-title', {}, h('strong', {}, p?.title ?? problemId), p ? difficulty(p.difficulty) : null),
      h('div.hint-text.setup-bar-sub', {}, `${botLabel} · Bot opponent. Reveal and Mentor stay off.`),
    );
  };

  const opponentGroup = createOptionGroup({
    label: 'Opponent',
    className: '.opponent-grid',
    options: BOT_LEVELS,
    value: level,
    renderOption: (l) => {
      const meta = BOT_META[l.id] ?? { mark: l.label.slice(0, 2), desc: '' };
      return {
        className: '.opponent-card',
        attrs: { 'data-level': l.id },
        content: [
          h('span.monogram', { 'aria-hidden': 'true' }, meta.mark),
          h('span.option-card-body', {}, h('strong.option-card-title', {}, l.label), h('span.option-card-fact', {}, meta.desc)),
        ],
      };
    },
    onChange: (next) => {
      level = next.id;
      describeStart();
    },
  });

  const diffGroup = chipGroup({
    label: 'Difficulty',
    options: ['all', ...DIFFICULTIES].map((d) => ({ value: d, label: d === 'all' ? 'All difficulties' : d, attrs: { 'data-difficulty': d } })),
    value: pf.difficulty,
    onChange: (d) => {
      pf.difficulty = d;
      problemPicker.refresh();
    },
  });

  const topicToggle = h(
    'button.chip.topic-toggle',
    {
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'battle-topics',
      onClick: () => setTopicOpen(!topicOpen),
    },
    'Topic',
  );

  const syncTopicToggle = () => {
    const active = pf.topic !== 'all';
    topicToggle.textContent = active ? `Topic: ${topicLabel(pf.topic)}` : 'Topic';
    topicToggle.classList.toggle('is-active', active);
  };

  const topicGroup = chipGroup({
    label: 'Topic',
    options: [{ value: 'all', label: 'All topics', attrs: { 'data-value': 'all' } }, ...usedTopics(problems, TOPICS).map((t) => ({ value: t.id, label: t.label, attrs: { 'data-value': t.id } }))],
    value: pf.topic,
    onChange: (value) => {
      pf.topic = value;
      syncTopicToggle();
      problemPicker.refresh();
    },
  });

  const topicPanel = h('div#battle-topics.topic-panel', { hidden: true }, topicGroup);

  function setTopicOpen(next) {
    topicOpen = next;
    topicPanel.hidden = !topicOpen;
    topicToggle.setAttribute('aria-expanded', String(topicOpen));
  }

  const onTopicToggleKeydown = (e) => {
    if (e.key !== 'Escape' || !topicOpen) return;
    e.preventDefault();
    setTopicOpen(false);
  };
  const onTopicPanelKeydown = (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    setTopicOpen(false);
    topicToggle.focus({ preventScroll: true });
  };
  topicToggle.addEventListener('keydown', onTopicToggleKeydown);
  topicPanel.addEventListener('keydown', onTopicPanelKeydown);

  const random = h('button.btn.btn-secondary.btn-sm', { type: 'button' }, 'Random');

  const problemPicker = createPicker({
    label: 'Problem',
    layout: 'list',
    items: problems.map((p) => ({ ...p, label: p.title, searchText: p.title })),
    value: problemId,
    pageSize: 12,
    search: { placeholder: 'Search problems', ariaLabel: 'Search problems' },
    extraControls: [random, diffGroup, topicToggle],
    extraPanel: topicPanel,
    predicate: (p) => (pf.difficulty === 'all' || p.difficulty === pf.difficulty) && (pf.topic === 'all' || p.topics.includes(pf.topic)),
    emptyTitle: 'No matching problems',
    emptyBody: 'No problems match these filters. Try another search or clear the active filters.',
    formatCount: ({ filtered, total }) => `${filtered} of ${total} ${total === 1 ? 'problem' : 'problems'}`,
    formatSelected: (item) => (item ? ['Selected: ', h('strong', {}, item.title), ' ', difficulty(item.difficulty)] : 'No problem selected'),
    renderOption: (p) => ({
      className: '.pick-row',
      attrs: { 'data-id': p.id },
      content: [
        h('span.pick-title', {}, p.title),
        difficulty(p.difficulty),
        h('span.pick-topics', {}, p.topics.map((t) => h('span.tag', {}, topicLabel(t)))),
      ],
    }),
    onSelect: (p) => {
      problemId = p.id;
      describeStart();
    },
    onClear: () => {
      pf.difficulty = 'all';
      pf.topic = 'all';
      diffGroup.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.difficulty === 'all')));
      topicGroup.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === 'all')));
      syncTopicToggle();
      setTopicOpen(false);
    },
  });

  random.addEventListener('click', () => {
    // Random from what the filters show, so "Hard + Graphs" then Random stays inside that set.
    const p = pickRandom(problemPicker.getFiltered(), Math.random());
    if (!p) return;
    problemId = p.id;
    problemPicker.setValue(p.id);
    describeStart();
  });

  describeStart();
  const start = h('button.btn.btn-primary.btn-lg', { type: 'button' }, 'Start race');
  const tour = modeTour('battle');

  let cleanup = () => {};
  let disposed = false;
  start.addEventListener('click', async () => {
    start.disabled = true;
    start.textContent = 'Loading the problem...';
    let problem;
    try {
      problem = await loadProblem(problemId);
    } catch {
      if (disposed) return;
      start.disabled = false;
      start.textContent = 'Start race';
      toast('The problem could not be loaded. Check your connection and try again.', 'error');
      return;
    }
    // don't touch / the race clock and the bot start in startBattle: it must stay after the load, which never costs the user
    if (!disposed) cleanup = startBattle(root, { store, problem, level });
  });

  mount(
    root,
    h(
      'div.page.page-narrow.setup-page',
      {},
      h('a.back-link', { href: '#/modes' }, 'All modes'),
      h('header.page-head', {}, h('h1', {}, '1v1 Battle'), tour.replay, h('p.page-sub', {}, 'First to an accepted submission wins.')),
      h(
        'div.setup-card',
        {},
        h('h2.setup-heading', {}, 'Opponent'),
        opponentGroup.el,
        h('h2.setup-heading', {}, 'Problem'),
        problemPicker.el,
      ),
      h('div.setup-bar', { 'data-tour': 'battle-start' }, barSummary, start),
      siteFooter(),
    ),
  );
  opponentGroup.el.dataset.tour = 'battle-opponent';
  problemPicker.el.dataset.tour = 'battle-problem';
  return () => {
    disposed = true;
    tour.close();
    opponentGroup.cleanup();
    problemPicker.cleanup();
    topicToggle.removeEventListener('keydown', onTopicToggleKeydown);
    topicPanel.removeEventListener('keydown', onTopicPanelKeydown);
    cleanup();
  };
}

function startBattle(root, { store, problem, level }) {
  // Battle is a timed session: hide header and site tab bar like interview lockdown (docs/DESIGN.md).
  document.body.classList.add('lockdown');
  const bot = createBot({ difficulty: problem.difficulty, level, seed: Date.now() & 0xffff });
  const startedAt = Date.now();
  let youPassed = 0;
  let winner = null;

  const bar = (who, side) => {
    const fill = h(`div.race-fill.race-fill-${side}`);
    const label = h('span.race-count', {}, '0 / 15');
    return {
      fill,
      label,
      el: h(
        `div.race-row.race-${side}`,
        {},
        h('span.race-name', {}, h(`span.race-swatch.race-swatch-${side}`, { 'aria-hidden': 'true' }), who),
        h('div.race-track', { 'aria-hidden': 'true' }, fill),
        label,
      ),
    };
  };
  const you = bar('You', 'you');
  const them = bar(bot.name, 'bot');
  // The toast host already announces the race outcome via role="status", so keep this static.
  const raceResult = h('span.session-state', {}, difficulty(problem.difficulty));

  const leave = () => {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  const banner = createSessionBanner({
    kind: 'battle',
    label: 'Battle',
    clockText: '00:00',
    stateEl: raceResult,
    middleEl: h('div.race', {}, you.el, them.el),
    exitLabel: 'Leave race',
    exitVariant: 'btn-secondary',
    onExit: async () => {
      if (winner) {
        leave();
        return;
      }
      const ok = await confirmDialog({
        title: 'Leave the race now?',
        body: 'Your progress in this race will be discarded.',
        confirmLabel: 'Leave race',
        danger: true,
      });
      if (ok) leave();
    },
  });

  const set = (b, n) => {
    b.fill.style.width = `${(n / 15) * 100}%`;
    b.label.textContent = `${n} / 15`;
  };

  const declare = (who) => {
    if (winner) return;
    winner = who;
    saveLastResult('battle', {
      won: who === 'you',
      botName: bot.name,
      problemTitle: problem.title,
    });
    banner.el.classList.add(who === 'you' ? 'won' : 'lost');
    mount(
      raceResult,
      difficulty(problem.difficulty),
      h(`span.race-outcome.${who === 'you' ? 'is-win' : 'is-loss'}`, {}, who === 'you' ? 'You won' : `${bot.name} finished first`),
    );
    toast(who === 'you' ? 'You won the race.' : `${bot.name} finished first. Keep going, finish it anyway.`, who === 'you' ? 'success' : 'warn', 5000);
  };

  const tick = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    banner.setClock(Interview.formatClock(elapsed));
    const botPassed = bot.passedAt(elapsed);
    set(them, botPassed);
    if (botPassed === 15) declare('bot');
  }, 1000);

  const host = h('div.session-host');
  mount(root, host);
  const cleanupWs = renderWorkspace(host, {
    problem,
    store,
    session: {
      kind: 'battle',
      banner: banner.el,
      allowAssist: false,
      drafts: new Map(),
      onResult: ({ kind, result }) => {
        youPassed = Math.max(youPassed, result.passed);
        set(you, youPassed);
        if (kind === 'submit' && result.accepted) declare('you');
      },
    },
  });

  return () => {
    clearInterval(tick);
    cleanupWs();
    document.body.classList.remove('lockdown');
  };
}
