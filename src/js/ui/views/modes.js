/**
 * Modes: hub, Interview Simulator, 1v1 Battle (bot).
 */
import { h, mount, toast, confirmDialog, difficultyBadge, siteFooter } from '../dom.js';
import { renderWorkspace } from './workspace.js';
import { availableEntries, catalogEntry, loadProblem, TOPICS, DIFFICULTIES } from '../../problems/index.js';
import * as Interview from '../../modes/interview.js';
import { createBot, BOT_LEVELS } from '../../modes/battle.js';
import { OA_FORMATS, pickOaProblems } from '../../modes/mock-oa.js';
import { expandRows } from '../../data/company-sets.js';
import { loadRankedCompanies, israelFilterControl, israelBadgeEl } from './companies.js';
import { filterRanked, DEFAULT_ISRAEL_FILTER } from '../../data/israel-hiring.js';
import { filterProblems, usedTopics, pickRandom } from '../../modes/battle-picker.js';

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

function renderInterviewSetup(root, { store }) {
  const eligible = oaEligible();
  const eligibleIds = new Set(eligible.map((p) => p.id));
  let format = OA_FORMATS[1];
  let companyIds = null; // null = any company
  let companyName = '';
  let companySlug = ''; // '' = any company
  const companyOf = new Map();
  let ranked = [];
  const cf = { filter: DEFAULT_ISRAEL_FILTER, query: '' };

  const formatGroup = h(
    'div.chip-group',
    { role: 'group', 'aria-label': 'Format' },
    OA_FORMATS.map((f) =>
      h(
        'button.chip',
        {
          type: 'button',
          'aria-pressed': String(f === format),
          onClick: (e) => {
            format = f;
            formatGroup.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
            e.currentTarget.setAttribute('aria-pressed', 'true');
            describe();
          },
        },
        f.label,
      ),
    ),
  );
  const companyList = h('div.chip-group.company-chips', { role: 'group', 'aria-label': 'Company' });
  const companyHint = h('p.hint-text', { role: 'status' }, 'Loading companies...');
  const chip = (slug, name, text, badge) =>
    h(
      'button.chip.company-chip',
      {
        type: 'button',
        'data-slug': slug,
        'aria-pressed': String(slug === companySlug),
        onClick: () => {
          companySlug = slug;
          companyName = name;
          companyIds = slug ? companyOf.get(slug) : null;
          renderCompanies();
          describe();
        },
      },
      text,
      badge,
    );
  function renderCompanies() {
    const shown = filterRanked(ranked, cf).filter((c) => companyOf.has(c.slug));
    const chips = [chip('', '', 'Any company', null)];
    // The selected company stays visible even when the current filter or search hides it.
    const selected = companySlug && !shown.some((c) => c.slug === companySlug) ? ranked.find((c) => c.slug === companySlug) : null;
    for (const c of selected ? [selected, ...shown] : shown) chips.push(chip(c.slug, c.name, `${c.name} (${companyOf.get(c.slug).length})`, c.israel === 'major' ? h('span.il-star', { 'aria-label': 'Major in Israel', title: 'Major in Israel' }, '\u2605') : null));
    mount(companyList, chips);
    companyHint.textContent = `${shown.length} ${shown.length === 1 ? 'company' : 'companies'} with enough problems on the site. Optional: draws from the problems that company asks.`;
  }
  const companySearch = h('input.search.company-search', { type: 'search', placeholder: 'Search companies', 'aria-label': 'Search companies' });
  companySearch.addEventListener('input', () => {
    cf.query = companySearch.value;
    renderCompanies();
  });
  const companyFilter = israelFilterControl(cf.filter, (id) => {
    cf.filter = id;
    renderCompanies();
  });
  const eligibleIdsOf = (c, sets) => [...new Set(expandRows(sets, c).map((r) => r.practice?.contentId).filter((id) => id && eligibleIds.has(id)))];
  loadRankedCompanies().then((d) => {
    if (disposed) return;
    if (!d) {
      companyHint.textContent = 'Company data could not be loaded.';
      return;
    }
    ranked = d.ranked;
    for (const c of ranked) {
      const ids = eligibleIdsOf(c, d.sets);
      if (ids.length >= MIN_COMPANY_PROBLEMS) companyOf.set(c.slug, ids);
    }
    renderCompanies();
  });
  mount(companyList, chip('', '', 'Any company', null));

  const summary = h('div.setup-card-rows');
  const describe = () => {
    const pool = companyIds ? eligible.filter((p) => companyIds.includes(p.id)) : eligible;
    mount(
      summary,
      h('div.setup-row', {}, h('span', {}, 'Duration'), h('strong', {}, `${format.minutes}:00`)),
      h('div.setup-row', {}, h('span', {}, 'Problems'), h('strong', {}, format.note)),
      h('div.setup-row', {}, h('span', {}, 'Drawn from'), h('strong', {}, `${pool.length} problems${companyIds ? ` asked at ${companyName}` : ''}, unsolved first`)),
    );
  };
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
      'div.page.page-narrow',
      {},
      h('header.page-head', {}, h('h1', {}, 'Mock OA and Interview'), h('p.page-sub', {}, 'Treat it like the real thing. The problems stay hidden until the clock starts.')),
      h(
        'div.setup-card',
        {},
        h('h3', {}, 'Format'),
        formatGroup,
        h('h3', {}, 'Company'),
        h('div.filters', {}, companyFilter, companySearch),
        companyList,
        companyHint,
        summary,
        h('h3', {}, 'Rules'),
        h(
          'ul.rules',
          {},
          h('li', {}, 'Navigation, Reveal Solution, the AI Mentor and complexity hints are locked.'),
          h('li', {}, 'JavaScript, TypeScript and Python run; Java, C++, C, C# and Go are editor-only in timed sessions.'),
          h('li', {}, 'Switching tabs or windows is logged and costs integrity points.'),
          h('li', {}, 'Only your best run per problem counts; accepted submissions earn a speed bonus.'),
          h('li', {}, 'When the clock hits 00:00 the session ends and the report opens.'),
        ),
        start,
      ),
      siteFooter(),
    ),
  );
  return () => {
    disposed = true;
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

export function renderBattle(root, { store }) {
  const problems = availableEntries();
  let level = 'regular';
  let problemId = problems[0].id;
  const pf = { query: '', difficulty: 'all', topic: 'all' };
  const topicLabel = (id) => TOPICS.find((t) => t.id === id)?.label ?? id;

  const levelGroup = h(
    'div.chip-group',
    { role: 'group', 'aria-label': 'Bot level' },
    BOT_LEVELS.map((l) =>
      h(
        'button.chip',
        {
          type: 'button',
          'aria-pressed': String(l.id === level),
          onClick: (e) => {
            level = l.id;
            levelGroup.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
            e.currentTarget.setAttribute('aria-pressed', 'true');
          },
        },
        l.label,
      ),
    ),
  );
  const pickList = h('div.pick-list', { role: 'group', 'aria-label': 'Problem' });
  const pickCount = h('p.hint-text', { role: 'status' });
  const selectedLine = h('p.pick-selected');
  const showSelected = () => {
    const p = catalogEntry(problemId);
    mount(selectedLine, 'Selected: ', h('strong', {}, p?.title ?? problemId), ' ', p ? difficultyBadge(p.difficulty) : null);
  };
  function renderPicker() {
    const list = filterProblems(problems, pf);
    pickCount.textContent = `${list.length} of ${problems.length} problems`;
    if (!list.length) {
      mount(pickList, h('p.empty', {}, 'No problems match.'));
      return;
    }
    mount(
      pickList,
      list.map((p) =>
        h(
          'button.pick-row',
          {
            type: 'button',
            'data-id': p.id,
            'aria-pressed': String(p.id === problemId),
            onClick: () => {
              problemId = p.id;
              pickList.querySelectorAll('.pick-row').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === problemId)));
              showSelected();
            },
          },
          h('span.pick-title', {}, p.title),
          difficultyBadge(p.difficulty),
          h('span.pick-topics', {}, p.topics.map((t) => h('span.tag', {}, topicLabel(t)))),
        ),
      ),
    );
  }
  const search = h('input.search.pick-search', { type: 'search', placeholder: 'Search by title', 'aria-label': 'Search problems' });
  search.addEventListener('input', () => {
    pf.query = search.value;
    renderPicker();
  });
  const diffGroup = h(
    'div.chip-group',
    { role: 'group', 'aria-label': 'Difficulty' },
    ['all', ...DIFFICULTIES].map((d) =>
      h(
        'button.chip',
        {
          type: 'button',
          'data-difficulty': d,
          'aria-pressed': String(d === pf.difficulty),
          onClick: () => {
            pf.difficulty = d;
            diffGroup.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.difficulty === d)));
            renderPicker();
          },
        },
        d === 'all' ? 'All difficulties' : d,
      ),
    ),
  );
  const topicSelect = h('select.select', { 'aria-label': 'Topic' }, h('option', { value: 'all' }, 'All topics'), usedTopics(problems, TOPICS).map((t) => h('option', { value: t.id }, t.label)));
  topicSelect.addEventListener('change', () => {
    pf.topic = topicSelect.value;
    renderPicker();
  });
  const random = h('button.btn.btn-secondary.btn-sm', { type: 'button' }, 'Random');
  random.addEventListener('click', () => {
    // Random from what the filters show, so "Hard + Graphs" then Random stays inside that set.
    const p = pickRandom(filterProblems(problems, pf), Math.random());
    if (!p) return;
    problemId = p.id;
    renderPicker();
    showSelected();
    pickList.querySelector(`[data-id="${p.id}"]`)?.scrollIntoView({ block: 'nearest' });
  });
  showSelected();
  renderPicker();
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
      'div.page.page-narrow',
      {},
      h('header.page-head', {}, h('h1', {}, '1v1 Battle'), h('p.page-sub', {}, 'First to an accepted submission wins.')),
      h(
        'div.setup-card',
        {},
        h('h3', {}, 'Opponent'),
        levelGroup,
        h('h3', {}, 'Problem'),
        h('div.filters', {}, diffGroup, topicSelect, search, random),
        pickCount,
        pickList,
        selectedLine,
        h('p.hint-text', {}, 'Live peer battles: coming with the server-side judge. Assistance (reveal, mentor) is disabled during a race.'),
        start,
      ),
      siteFooter(),
    ),
  );
  return () => {
    disposed = true;
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
  const status = h('span.result-meta', {}, difficultyBadge(problem.difficulty));
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
