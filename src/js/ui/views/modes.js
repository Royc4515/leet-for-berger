/**
 * Modes: hub, Interview Simulator, 1v1 Battle (bot).
 */
import { h, mount, toast, confirmDialog, difficultyBadge } from '../dom.js';
import { renderWorkspace } from './workspace.js';
import { availableProblems, getProblem } from '../../problems/index.js';
import * as Interview from '../../modes/interview.js';
import { createBot, BOT_LEVELS } from '../../modes/battle.js';

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
          'Interview Simulator',
          'Live',
          '45 minutes, up to 2 problems, locked-down UI: no navigation, no reveal, no mentor. Tab switches are logged. Ends with a scored performance report.',
          h('a.btn.btn-primary', { href: '#/interview' }, 'Set up interview'),
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
          h('a.btn.btn-secondary', { href: `#/problem/${availableProblems()[0].id}` }, 'Open a problem'),
        ),
      ),
    ),
  );
  return () => {};
}

/* ======================= Interview ======================= */

// Module-level so leaving and re-entering the route resumes instead of restarting.
let interview = null;
let interviewDrafts = null; // survives route changes with the session, reset on a new interview

export function renderInterview(root, { store }) {
  if (!interview) return renderInterviewSetup(root);
  if (interview.endedAt) return renderInterviewReport(root);
  return renderInterviewActive(root, { store });
}

function renderInterviewSetup(root) {
  const problems = availableProblems().slice(0, 2);
  const start = h('button.btn.btn-primary.btn-lg', { type: 'button' }, 'Start interview');
  start.addEventListener('click', () => {
    interview = Interview.createSession({ problemIds: problems.map((p) => p.id) });
    interviewDrafts = new Map();
    interview.activeProblemId = problems[0].id;
    window.dispatchEvent(new HashChangeEvent('hashchange')); // re-render current route
  });

  mount(
    root,
    h(
      'div.page.page-narrow',
      {},
      h('header.page-head', {}, h('h1', {}, 'Interview Simulator'), h('p.page-sub', {}, 'Treat it like the real thing.')),
      h(
        'div.setup-card',
        {},
        h('div.setup-row', {}, h('span', {}, 'Duration'), h('strong', {}, '45:00')),
        h('div.setup-row', {}, h('span', {}, 'Problems'), h('strong', {}, problems.map((p) => p.title).join(', '))),
        problems.length < 2 ? h('p.hint-text', {}, 'The bank has 1 available problem right now; the 2-problem format activates automatically when a second one ships.') : null,
        h('h3', {}, 'Rules'),
        h(
          'ul.rules',
          {},
          h('li', {}, 'Navigation, Reveal Solution and the AI Mentor are locked.'),
          h('li', {}, 'Switching tabs or windows is logged and costs integrity points.'),
          h('li', {}, 'Only your best run per problem counts; accepted submissions earn a speed bonus.'),
          h('li', {}, 'When the clock hits 00:00 the session ends and the report opens.'),
        ),
        start,
      ),
    ),
  );
  return () => {};
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
      problem: getProblem(interview.activeProblemId),
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
          const prob = getProblem(p.id);
          return row(prob.title, `${Math.round(p.coverage * 100)}% tests${p.solved ? ` · solved at ${Interview.formatClock(p.solveTimeMs)}` : ''}`);
        }),
        h('div.mode-actions', {}, again, h('a.btn.btn-ghost', { href: '#/' }, 'Back to problems')),
      ),
    ),
  );
  return () => {};
}

/* ======================= Battle ======================= */

export function renderBattle(root, { store }) {
  const problems = availableProblems();
  let level = 'regular';
  let problemId = problems[0].id;

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
  const select = h('select.select', { 'aria-label': 'Problem' }, problems.map((p) => h('option', { value: p.id }, `${p.title} (${p.difficulty})`)));
  select.addEventListener('change', () => (problemId = select.value));
  const start = h('button.btn.btn-primary.btn-lg', { type: 'button' }, 'Start race');

  let cleanup = () => {};
  start.addEventListener('click', () => {
    cleanup = startBattle(root, { store, problem: getProblem(problemId), level });
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
        select,
        h('p.hint-text', {}, 'Live peer battles: coming with the server-side judge. Assistance (reveal, mentor) is disabled during a race.'),
        start,
      ),
    ),
  );
  return () => cleanup();
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
