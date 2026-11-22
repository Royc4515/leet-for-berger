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

/* ======================= Hub ======================= */

export function renderModesHub(root) {
  const card = (title, status, body, actions) =>
    h('article.mode-card', {}, h('div.mode-top', {}, h('h2', {}, title), h(`span.tag${status === 'Live' ? '.tag-live' : '.tag-muted'}`, {}, status)), h('p', {}, body), h('div.mode-actions', {}, actions));

  mount(
    root,
    h(
      'div.page',
      {},
      h('header.page-head', {}, h('h1', {}, 'Modes'), h('p.page-sub', {}, 'Same engine, different pressure.')),
      h(
        'div.mode-grid',
        {},
        card(
          'Mock OA and Interview',
          'Live',
          'A phone screen, an online assessment or a hard OA, optionally drawn from one company\'s problems. Timed, locked-down UI: no navigation, no reveal, no mentor. Tab switches are logged. Ends with a scored report.',
          h('a.btn.btn-primary', { href: '#/interview' }, 'Set up a session'),
        ),
        card(
          '1v1 Battle',
          'Bot only',
          'Race a bot on the same problem with live progress bars. Real-time peer battles need the server-side judge (roadmap Phase 3) so nobody can fake progress from the client.',
          h('a.btn.btn-primary', { href: '#/battle' }, 'Race a bot'),
        ),
        card(
          'AI Mentor',
          'Offline',
          'Side panel inside every practice problem. Asks guiding questions, refuses to hand out solutions. Runs on a scripted hint ladder today; the LLM provider plugs into the same interface behind a backend proxy.',
          h('a.btn.btn-secondary', { href: `#/problem/${availableEntries()[0].id}` }, 'Open a problem'),
        ),
      ),
      siteFooter(),
    ),
  );
  return () => {};
}

/* ======================= Interview ======================= */

// Module-level so leaving and re-entering the route resumes instead of restarting.
let interview = null;
let interviewDrafts = null; // survives route changes with the session, reset on a new interview
let interviewProblems = null; // id -> hydrated problem, loaded before the clock starts

export function renderInterview(root, { store }) {
  if (!interview) return renderInterviewSetup(root, { store });
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
        `${format.note} · ${pool.length} problems${companyIds ? ` asked at ${companyName}` : ''}, unsolved first`,
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
    formatCount: ({ filtered, query }) => {
      const n = query.trim() && filtered === 0 ? 0 : Math.max(0, filtered - 1);
      return `${n} ${n === 1 ? 'company' : 'companies'} with enough problems on the site. Optional: draws from that company's list.`;
    },
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
      h('header.page-head', {}, h('h1', {}, 'Mock OA and Interview'), h('p.page-sub', {}, 'Treat it like the real thing. The problems stay hidden until the clock starts.')),
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
          h('li', {}, 'Lockdown mode: navigation, Reveal Solution, AI Mentor and complexity hints stay off.'),
          h('li', {}, 'JavaScript, TypeScript and Python run live; Java, C++, C, C# and Go are editor-only.'),
          h('li', {}, 'Tab switches cost integrity points; your best run per problem counts when time ends.'),
        ),
      ),
      h('div.setup-bar', {}, barSummary, start),
      siteFooter(),
    ),
  );
  return () => {
    disposed = true;
    formatGroup.cleanup();
    companyPicker.cleanup();
  };
}

function renderInterviewActive(root, { store }) {
  document.body.classList.add('lockdown');
  const clock = h('span.clock', { 'aria-live': 'off' }, Interview.formatClock(Interview.remainingMs(interview)));
  const switches = h('span.result-meta', {}, `Tab switches: ${interview.tabSwitches}`);
  const endBtn = h('button.btn.btn-danger.btn-sm', { type: 'button' }, 'End interview');
  const banner = h('div.session-banner.interview', {}, h('strong', {}, 'Interview in progress'), clock, switches, h('div.toolbar-spacer'), endBtn);

  const switcher = interview.problemIds.length > 1
    ? h(
        'div.problem-switcher',
        { role: 'tablist' },
        interview.problemIds.map((id, i) =>
          h('button.chip', { type: 'button', role: 'tab', 'aria-pressed': String(id === interview.activeProblemId), onClick: () => switchTo(id) }, `Problem ${i + 1}`),
        ),
      )
    : null;

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
        banner,
        allowAssist: false,
        problemSwitcher: switcher,
        drafts: interviewDrafts,
        onResult: ({ kind, result, problemId }) => {
          interview = Interview.recordAttempt(interview, { problemId, passed: result.passed, total: result.total, accepted: result.accepted, kind });
        },
      },
    });
  };
  const switchTo = (id) => {
    interview.activeProblemId = id;
    mountProblem();
  };
  mountProblem();

  const end = () => {
    interview = { ...Interview.finish(interview), activeProblemId: interview.activeProblemId };
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  const tick = setInterval(() => {
    const ms = Interview.remainingMs(interview);
    clock.textContent = Interview.formatClock(ms);
    clock.classList.toggle('urgent', ms < 5 * 60e3);
    if (ms === 0) {
      toast("Time's up.", 'warn');
      end();
    }
  }, 500);

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      interview = { ...Interview.recordTabSwitch(interview), activeProblemId: interview.activeProblemId };
      switches.textContent = `Tab switches: ${interview.tabSwitches}`;
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

  endBtn.addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'End the interview now?', body: 'Your best results so far will be scored. This cannot be undone.', confirmLabel: 'End interview', danger: true });
    if (ok) end();
  });

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
  const row = (label, value) => h('div.setup-row', {}, h('span', {}, label), h('strong', {}, value));
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
      h('div.score-ring', { style: { '--pct': a.score } }, h('span', {}, String(a.score)), h('small', {}, '/ 100')),
      h(
        'div.setup-card',
        {},
        row('Time used', Interview.formatClock(a.usedMs)),
        row('Solved', `${a.solved} / ${a.problems.length}`),
        row('Runs / Submissions', `${a.runs} / ${a.submissions}`),
        row('Tab switches', String(a.tabSwitches)),
        h('h3', {}, 'Per problem'),
        a.problems.map((p) => {
          return row(catalogEntry(p.id)?.title ?? p.id, `${Math.round(p.coverage * 100)}% tests${p.solved ? ` · solved at ${Interview.formatClock(p.solveTimeMs)}` : ''}`);
        }),
        h('div.mode-actions', {}, again, h('a.btn.btn-ghost', { href: '#/' }, 'Back to problems')),
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
      h('div.hint-text.setup-bar-sub', {}, `${botLabel} · Bot opponent. Reveal and AI Mentor stay off.`),
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
      h('header.page-head', {}, h('h1', {}, '1v1 Battle'), h('p.page-sub', {}, 'First to an accepted submission wins.')),
      h(
        'div.setup-card',
        {},
        h('h2.setup-heading', {}, 'Opponent'),
        opponentGroup.el,
        h('h2.setup-heading', {}, 'Problem'),
        problemPicker.el,
      ),
      h('div.setup-bar', {}, barSummary, start),
      siteFooter(),
    ),
  );
  return () => {
    disposed = true;
    opponentGroup.cleanup();
    problemPicker.cleanup();
    topicToggle.removeEventListener('keydown', onTopicToggleKeydown);
    topicPanel.removeEventListener('keydown', onTopicPanelKeydown);
    cleanup();
  };
}

function startBattle(root, { store, problem, level }) {
  const bot = createBot({ difficulty: problem.difficulty, level, seed: Date.now() & 0xffff });
  const startedAt = Date.now();
  let youPassed = 0;
  let winner = null;

  const bar = (who) => {
    const fill = h('div.progress-fill');
    const label = h('span.race-count', {}, '0 / 15');
    return { fill, label, el: h('div.race-row', {}, h('span.race-name', {}, who), h('div.progress', {}, fill), label) };
  };
  const you = bar('You');
  const them = bar(bot.name);
  const clock = h('span.clock', {}, '00:00');
  const status = h('span.result-meta', {}, difficulty(problem.difficulty));
  const banner = h('div.session-banner.battle', {}, h('strong', {}, 'Battle'), clock, h('div.race', {}, you.el, them.el), status);

  const set = (b, n) => {
    b.fill.style.width = `${(n / 15) * 100}%`;
    b.label.textContent = `${n} / 15`;
  };

  const declare = (who) => {
    if (winner) return;
    winner = who;
    banner.classList.add(who === 'you' ? 'won' : 'lost');
    toast(who === 'you' ? 'You won the race.' : `${bot.name} finished first. Keep going, finish it anyway.`, who === 'you' ? 'success' : 'warn', 5000);
  };

  const tick = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    clock.textContent = Interview.formatClock(elapsed);
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
      banner,
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
  };
}
