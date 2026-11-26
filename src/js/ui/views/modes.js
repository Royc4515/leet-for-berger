/**
 * Modes: hub, Interview Simulator, 1v1 Battle (bot).
 */
import { shareButton } from '../share.js';
import { interviewShare, battleShare } from '../../data/share.js';
import { h, mount, toast, confirmDialog, difficulty, chipGroup, ilMark, companyMark, tp, pageLang } from '../dom.js';
import { siteFooter } from '../footer.js';
import { createPicker, createOptionGroup } from '../picker.js';
import { renderWorkspace } from './workspace.js';
import { availableEntries, catalogEntry, loadProblem, TOPICS, DIFFICULTIES } from '../../problems/index.js';
import * as Interview from '../../modes/interview.js';
import { createBot, BOT_LEVELS, botLabel } from '../../modes/battle.js';
import { OA_FORMATS, pickOaProblems, oaFormatLabel } from '../../modes/mock-oa.js';
import { expandRows, monogram } from '../../data/company-sets.js';
import { loadRankedCompanies } from './companies.js';
import { companyLogo } from '../../data/company-loader.js';
import { israelBadge, israelFilterLabel, ISRAEL_FILTERS, DEFAULT_ISRAEL_FILTER } from '../../data/israel-hiring.js';
import { usedTopics, pickRandom } from '../../modes/battle-picker.js';
import { LAST_SESSIONS_KEY } from '../../state/user-data.js';
import { parseLastResults, formatLastInterview, formatLastBattle } from '../../modes/last-results.js';
import { QUIZ_TOPICS } from '../../data/quiz-topics.js';
import { QUIZ_INDEX } from '../../data/quiz-index.js';
import { QUIZ_MODES } from '../../modes/quiz.js';
import { loadQuizProgress } from '../../state/quiz-progress.js';
import { dailyQuizNeedsSignIn } from '../quiz-card.js';
import { dayKey } from '../../state/progress.js';

/** Hebrew counts with their plural forms (docs/I18N.md): "בעיה אחת", "3 בעיות". */
const problemsHe = (n) => (n === 1 ? 'בעיה אחת' : `${n} בעיות`);
const companiesHe = (n) => (n === 1 ? 'חברה אחת' : `${n} חברות`);

/** Setup and report labels in Hebrew; the running session keeps the English ones (the exam room). */
const QUIZ_MODE_HE = { practice: 'תרגול', sprint: 'ספרינט', survival: 'הישרדות' };
const STATUS_HE = { solved: 'נפתרה', tried: 'ניסית', todo: 'עוד לא התחלת' };

/**
 * "How it works" for a mode's setup page. The first visit's tour is started by the router
 * (main.js, data/tours.js tourForRoute); this button replays it through the same event.
 * @param {string} id
 * @returns {{ replay: HTMLElement, close: () => void }}
 */
function modeTour(id) {
  const replay = h('button.btn.btn-ghost.btn-sm.tour-replay', { type: 'button', 'aria-haspopup': 'dialog' }, tp('How it works', 'איך זה עובד'));
  replay.addEventListener('click', () => dispatchEvent(new CustomEvent('tour:open', { detail: id })));
  return { replay, close: () => {} };
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
  const lang = pageLang();
  const lastInterview = formatLastInterview(last.interview, lang);
  const lastBattle = formatLastBattle(last.battle, lang);
  const firstProblem = availableEntries()[0];

  const card = (cls, eyebrow, title, status, statusText, body, visual, facts, lastEl, actions) =>
    h(
      `article.mode-card.${cls}`,
      {},
      h('div.mode-visual', { 'aria-hidden': 'true' }, visual),
      h(
        'div.mode-copy',
        {},
        h('div.mode-top', {}, h('span.eyebrow', {}, eyebrow), h(`span.tag${status === 'Live' ? '.tag-live' : '.tag-muted'}`, {}, statusText)),
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
    h('div.race-preview-lane', {}, h('span.race-preview-name', {}, tp('You', 'אני')), h('span.race-preview-track', {}, h('span.race-preview-fill.is-you'))),
    h('div.race-preview-lane', {}, h('span.race-preview-name', {}, tp('Bot', 'בוט')), h('span.race-preview-track', {}, h('span.race-preview-fill.is-bot'))),
  );

  const quizToday = loadQuizProgress().daily[dayKey()];
  // The quiz: four answer bars, one lit.
  const quizVisual = h('ol.quiz-preview', {}, ['A', 'B', 'C', 'D'].map((l, i) => h(`li.quiz-preview-row${i === 2 ? '.is-lit' : ''}`, {}, h('span.quiz-preview-key', {}, l), h('span.quiz-preview-line'))));

  mount(
    root,
    h(
      'div.page',
      {},
      h('header.page-head', {}, h('div', {}, h('span.eyebrow', {}, tp('Under pressure', 'תחת לחץ')), h('h1', {}, tp('Modes', 'אימונים')), h('p.page-sub', {}, tp('Practice the way it feels on the day: a timed exam room, a race against a bot, or a quick multiple-choice quiz.', 'אימון שמרגיש כמו ביום הראיון: חדר מבחן עם שעון, מרוץ מול בוט או חידון אמריקאי קצר.')))),
      h(
        'div.mode-grid',
        {},
        card(
          'mode-exam',
          tp('Exam room', 'חדר המבחן'),
          tp('Mock OA and interview', 'מבחן OA מדומה וראיון'),
          'Live',
          tp('Live', 'פעיל'),
          tp('A timed session with the problems hidden until the clock starts, then a scored report.', 'סשן עם שעון: הבעיות מוסתרות עד שהשעון מתחיל, ובסוף מתקבל דוח עם ציון.'),
          clockVisual,
          [
            tp(`${OA_FORMATS.map((f) => `${f.minutes}`).join(', ')} minute formats, optionally from one company`, `פורמטים של ${OA_FORMATS.map((f) => `${f.minutes}`).join(', ')} דקות, אפשר גם מהבעיות של חברה אחת`),
            tp('Navigation, Reveal and Mentor stay off; tab switches are logged', 'בלי ניווט, בלי חשיפת הפתרון ובלי Mentor; כל מעבר לשונית נרשם'),
            tp('JavaScript, TypeScript and Python run; other languages are editor-only here', 'JavaScript, TypeScript ו-Python רצות; בשפות האחרות יש כאן עורך בלבד'),
          ],
          lastInterview ? h(`p.mode-last.band-${lastInterview.band}`, {}, lastInterview.text) : h('p.mode-last.is-empty', {}, tp('No session yet.', 'עוד לא היה סשן.')),
          h('a.btn.btn-primary', { href: '#/interview' }, tp('Set up a session', 'להגדיר סשן')),
        ),
        card(
          'mode-race',
          tp('Race', 'מרוץ'),
          tp('1v1 Battle', 'קרב 1 על 1'),
          'Bot only',
          tp('Bot only', 'בוטים בלבד'),
          tp('Race a paced bot on the same problem. The first accepted submission wins.', 'מרוץ מול בוט בקצב קבוע על אותה בעיה. ההגשה הראשונה שמקבלת Accepted מנצחת.'),
          raceVisual,
          [
            tp(
              `${BOT_LEVELS.length} opponents, from ${BOT_LEVELS[0].label.replace(' bot', '')} to ${BOT_LEVELS.at(-1).label.replace(' bot', '')}`,
              `${BOT_LEVELS.length} יריבים, מ${botLabel(BOT_LEVELS[0].id, 'he').replace('בוט ', '')} ועד ${botLabel(BOT_LEVELS.at(-1).id, 'he').replace('בוט ', '')}`,
            ),
            tp('Two lanes show tests passed out of 15, live', 'שני מסלולים מראים בזמן אמת כמה בדיקות עברו מתוך 15'),
            tp('Bots only: there are no live races against people', 'בוטים בלבד: אין מרוצים חיים מול אנשים'),
          ],
          lastBattle ? h(`p.mode-last${lastBattle.won ? '.is-win' : ''}`, {}, lastBattle.text) : h('p.mode-last.is-empty', {}, tp('No race yet.', 'עוד לא היה מרוץ.')),
          h('a.btn.btn-secondary', { href: '#/battle' }, tp('Race a bot', 'להתחרות בבוט')),
        ),
        card(
          'mode-quiz',
          tp('Five spare minutes', 'חמש דקות פנויות'),
          tp('Quiz', 'חידון'),
          'Live',
          tp('Live', 'פעיל'),
          tp('Multiple-choice questions on the ideas interviews test. No editor, so it works on a phone.', 'שאלות אמריקאיות על הרעיונות שבודקים בראיונות. בלי עורך קוד, אז זה עובד גם בטלפון.'),
          quizVisual,
          [
            tp(`${QUIZ_INDEX.length} questions in ${QUIZ_TOPICS.length} topics, from OOP and data structures to concurrency and SQL`, `${QUIZ_INDEX.length} שאלות ב-${QUIZ_TOPICS.length} נושאים, מ-OOP ומבני נתונים ועד מקביליות ו-SQL`),
            tp(`${QUIZ_MODES.map((m) => m.label).join(', ')}; one topic, a few, or all mixed`, `${QUIZ_MODES.map((m) => QUIZ_MODE_HE[m.id] ?? m.label).join(', ')}; נושא אחד, כמה נושאים או הכול מעורבב`),
            tp('In English or Hebrew, with a daily quiz of 5 questions', 'בעברית או באנגלית, עם חידון יומי של 5 שאלות'),
          ],
          quizToday
            ? h('p.mode-last', {}, tp(`Daily quiz done today: ${quizToday.correct} / ${quizToday.total}`, `החידון היומי הושלם היום: ${quizToday.correct} / ${quizToday.total}`))
            : h('p.mode-last.is-empty', {}, h('a', { href: '#/quiz/daily' }, tp('Today\'s daily quiz is open.', 'החידון של היום פתוח.')), dailyQuizNeedsSignIn() ? tp(' Sign in to play.', ' כדי לשחק צריך להתחבר.') : null),
          h('a.btn.btn-secondary', { href: '#/quiz' }, tp('Start a quiz', 'להתחיל חידון')),
        ),
      ),
      h(
        'section.mentor-note',
        { 'aria-label': 'AI Mentor' },
        h(
          'div.mentor-note-copy',
          {},
          h('div.mentor-note-head', {}, h('h2', {}, 'AI Mentor'), h('span.tag.tag-muted', {}, tp('Scripted', 'רמזים מוכנים מראש'))),
          h('p', {}, tp('A side panel in every practice problem that asks guiding questions instead of handing out the answer. It runs an offline hint ladder for now.', 'חלונית צד בכל בעיה בתרגול, ששואלת שאלות מכוונות במקום לתת את התשובה. בינתיים היא נותנת רמזים מדורגים, בלי AI.')),
        ),
        firstProblem ? h('a.btn.btn-secondary.btn-sm', { href: `#/problem/${firstProblem.id}` }, tp('Try it in a problem', 'לנסות בבעיה')) : null,
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

/**
 * Interview Simulator view: setup, the running session or the report, depending on the session
 * state kept in this module.
 * @param {HTMLElement} root
 * @param {{ store: object }} deps the progress store
 * @returns {() => void} cleanup (invariant 7)
 */
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
  const mix = [...counts.entries()].map(([diff, n]) => `${n} ${diff}`).join(' + ');
  // don't touch / LRI + PDI keep "1 Medium + 1 Easy" one left-to-right run inside Hebrew text; without them RTL reorders the numbers and the plus signs
  return pageLang() === 'he' ? `\u2066${mix}\u2069` : mix;
}

function renderInterviewSetup(root, { store }) {
  const eligible = oaEligible();
  const eligibleIds = new Set(eligible.map((p) => p.id));
  let format = OA_FORMATS[1];
  let companyIds = null; // null = any company
  let companyName = '';
  let logos = null; // company logos for the picker's tiles, once loaded
  const companyOf = new Map();

  const lang = pageLang();
  const minutes = (m) => tp(`${m} min`, `${m} דק׳`);
  const barSummary = h('div.setup-bar-summary', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const describe = () => {
    const pool = companyIds ? eligible.filter((p) => companyIds.includes(p.id)) : eligible;
    mount(
      barSummary,
      h('div.setup-bar-title', {}, h('strong', {}, oaFormatLabel(format, lang)), h('span.setup-bar-meta', {}, minutes(format.minutes))),
      h(
        'div.hint-text.setup-bar-sub',
        {},
        tp(
          `${formatMix(format.slots)} · ${pool.length} problems${companyIds ? ` asked at ${companyName}` : ''}, unsolved first`,
          `${formatMix(format.slots)} · ${problemsHe(pool.length)}${companyIds ? ` שנשאלו ב-${companyName}` : ''}, קודם אלה שעוד לא נפתרו`,
        ),
      ),
    );
  };

  const formatGroup = createOptionGroup({
    label: tp('Format', 'פורמט'),
    className: '.format-grid',
    options: OA_FORMATS,
    value: format.id,
    renderOption: (f) => ({
      className: '.format-card',
      attrs: { 'data-format': f.id },
      content: [
        h('strong.option-card-title', {}, oaFormatLabel(f, lang)),
        h('span.option-card-fact', {}, h('span.option-card-meta', {}, minutes(f.minutes)), ` · ${formatMix(f.slots)}`),
      ],
    }),
    onChange: (next) => {
      format = next;
      describe();
    },
  });

  const anyOption = {
    id: '',
    name: tp('Any company', 'כל חברה'),
    label: tp('Any company', 'כל חברה'),
    searchText: tp('Any company', 'כל חברה Any company'),
    count: eligible.length,
    israeli: false,
    israel: 'none',
  };

  const companyPicker = createPicker({
    label: tp('Company', 'חברה'),
    layout: 'grid',
    items: [anyOption],
    value: '',
    pageSize: 12,
    alwaysIncludeIds: [''],
    keepSelectedOutsideFilter: true,
    scope: {
      label: tp('Show companies', 'אילו חברות להציג'),
      // "Jobs in Israel" is for finding where to apply (the Companies page), not for picking practice.
      options: ISRAEL_FILTERS.filter((f) => f.id !== 'jobs').map((f) => ({ value: f.id, label: israelFilterLabel(f.id, lang) })),
      value: DEFAULT_ISRAEL_FILTER,
    },
    search: { placeholder: tp('Search companies', 'חיפוש חברות'), ariaLabel: tp('Search companies', 'חיפוש חברות') },
    predicate: (item, scopeVal) => {
      if (scopeVal === 'top') return item.israel === 'major';
      if (scopeVal === 'hiring') return item.israel !== 'none';
      return true;
    },
    emptyTitle: tp('No matching companies', 'אין חברות מתאימות'),
    emptyBody: tp('Try another search or switch the scope to All companies.', 'כדאי לנסות חיפוש אחר או לעבור ל"הכול".'),
    formatCount: ({ matched }) =>
      tp(
        `${matched} ${matched === 1 ? 'company' : 'companies'} with enough problems on the site. Optional: draws from that company's list.`,
        `${companiesHe(matched)} עם מספיק בעיות באתר. בחירת חברה מגבילה את הבעיות לרשימה שלה.`,
      ),
    formatSelected: (item) =>
      item
        ? [tp('Selected: ', 'נבחרה: '), h('strong', {}, item.name), ` (${tp(`${item.count} ${item.count === 1 ? 'problem' : 'problems'}`, problemsHe(item.count))})`]
        : tp('Selected: Any company', 'נבחרה: כל חברה'),
    renderOption: (item, { scope: scopeVal }) => ({
      className: '.option-card.company-option',
      attrs: { 'data-slug': item.id, 'data-israel': item.israel },
      content: [
        companyMark({ letters: item.id ? monogram(item.name) : '*', logo: item.id ? companyLogo(logos, item.id) : null, tile: Boolean(logos), size: 'sm' }),
        h('span.company-card-name', {}, item.name, item.israeli ? ilMark() : null),
        h('span.company-card-sub', {}, tp(`${item.count} ${item.count === 1 ? 'problem' : 'problems'}`, problemsHe(item.count))),
        scopeVal === 'all' && israelBadge(item.israel) ? h('span.company-card-sub.company-card-level', {}, israelBadge(item.israel, lang)) : null,
      ],
    }),
    onSelect: (item) => {
      companyName = item.id ? item.name : '';
      companyIds = item.id ? companyOf.get(item.id) : null;
      describe();
    },
  });
  companyPicker.setStatus(tp('Loading companies...', 'טוען חברות…'));

  const eligibleIdsOf = (c, sets) => [...new Set(expandRows(sets, c).map((r) => r.practice?.contentId).filter((id) => id && eligibleIds.has(id)))];
  loadRankedCompanies().then((d) => {
    if (disposed) return;
    if (!d) {
      companyPicker.setStatus(tp('Company data could not be loaded.', 'לא הצלחנו לטעון את נתוני החברות.'));
      return;
    }
    logos = d.logos;
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
  const startLabel = tp('Start interview', 'להתחיל את הראיון');
  const start = h('button.btn.btn-primary.btn-lg', { type: 'button' }, startLabel);
  start.addEventListener('click', async () => {
    const solvedIds = new Set(Object.entries(store.get().problems).filter(([, p]) => p.status === 'solved').map(([id]) => id));
    const candidates = (companyIds ? eligible.filter((p) => companyIds.includes(p.id)) : eligible).map((p) => ({ id: p.id, difficulty: p.difficulty }));
    // The clock seeds the pick so every OA differs; the pick itself is pure and tested.
    const problemIds = pickOaProblems({ candidates, format, seed: Date.now() & 0x7fffffff, solved: solvedIds });
    if (!problemIds.length) {
      toast(tp('No problems available for this setup.', 'אין בעיות זמינות להגדרות האלה.'), 'warn');
      return;
    }
    // Load every problem before creating the session: the clock starts in createSession, and
    // download and test-building time must never count against the candidate.
    start.disabled = true;
    start.textContent = tp('Loading problems...', 'טוען בעיות…');
    let loaded;
    try {
      loaded = await Promise.all(problemIds.map(loadProblem));
    } catch {
      if (disposed) return;
      start.disabled = false;
      start.textContent = startLabel;
      toast(tp('The problems could not be loaded. Check your connection and try again.', 'לא הצלחנו לטעון את הבעיות. כדאי לבדוק את החיבור ולנסות שוב.'), 'error');
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
      h('a.back-link', { href: '#/modes' }, tp('All modes', 'כל האימונים')),
      h('header.page-head', {}, h('h1', {}, tp('Mock OA and Interview', 'מבחן OA מדומה וראיון')), tour.replay, h('p.page-sub', {}, tp('Treat it like the real thing. The problems stay hidden until the clock starts.', 'כדאי להתייחס לזה כמו לדבר האמיתי. הבעיות מוסתרות עד שהשעון מתחיל.'))),
      h(
        'div.setup-card',
        {},
        h('h2.setup-heading', {}, tp('Format', 'פורמט')),
        formatGroup.el,
        h('h2.setup-heading', {}, tp('Company (optional)', 'חברה (לא חובה)')),
        companyPicker.el,
        h('h2.setup-heading', {}, tp('Rules', 'כללים')),
        h(
          'ul.rules.setup-rules',
          {},
          h('li', {}, tp('Lockdown mode: navigation, Reveal, Mentor and complexity hints stay off.', 'מצב נעילה: בלי ניווט, בלי חשיפת הפתרון, בלי Mentor ובלי רמזים על סיבוכיות.')),
          h('li', {}, tp('JavaScript, TypeScript and Python run live; Java, C++, C, C# and Go are editor-only.', 'JavaScript, TypeScript ו-Python רצות בדפדפן; ב-Java, C++, C, C# ו-Go יש עורך בלבד.')),
          h('li', {}, tp('Tab switches cost integrity points; your best run per problem counts when time ends.', 'כל מעבר לשונית מוריד נקודות; כשהזמן נגמר נספרת ההרצה הטובה ביותר בכל בעיה.')),
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
  // don't touch / the exam room stays English and left to right on every site language (docs/I18N.md)
  const host = h('div.session-host', { dir: 'ltr', lang: 'en' });
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
  const a = Interview.analytics(interview, undefined, pageLang());
  const statCell = (label, value) => h('div.stat-cell', {}, h('div.stat-value', {}, value), h('div.stat-label', {}, label));
  const again = h('button.btn.btn-primary', { type: 'button' }, tp('New interview', 'להתחיל ראיון חדש'));
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
      h('header.page-head', {}, h('h1', {}, tp('Interview Report', 'דוח הראיון')), h('p.page-sub', {}, tp('Coverage dominates the score; speed is a bonus; tab switches cost 5 points each (max 20).', 'הציון נקבע בעיקר לפי הבדיקות שעברו. מהירות מוסיפה בונוס. כל מעבר לשונית מוריד 5 נקודות, עד 20 בסך הכול.'))),
      h(
        'div.report-score',
        {},
        h(
          `div.score-ring.band-${a.band.band}`,
          { style: { '--pct': a.score }, 'data-band': a.band.band },
          h('span.score-value', {}, String(a.score)),
          h('small', {}, tp('/ 100', 'מתוך 100')),
        ),
        h(`span.score-band.band-${a.band.band}`, {}, a.band.label),
      ),
      h(
        'div.stats-row.report-stats',
        {},
        statCell(tp('Time used', 'זמן שנוצל'), Interview.formatClock(a.usedMs)),
        statCell(tp('Solved', 'נפתרו'), `${a.solved} / ${a.problems.length}`),
        statCell(tp('Runs / Submits', 'הרצות / הגשות'), `${a.runs} / ${a.submissions}`),
        statCell(tp('Tab switches', 'מעברי לשונית'), String(a.tabSwitches)),
      ),
      h(
        'div.setup-card.report-card',
        {},
        h('h2.setup-heading', {}, tp('Per problem', 'לפי בעיה')),
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
                    tp(stMeta.label, STATUS_HE[p.status] ?? STATUS_HE.todo),
                  ),
                ),
                h(
                  'div.hint-text',
                  {},
                  tp(
                    `${Math.round(p.coverage * 100)}% tests${p.solved ? ` · solved at ${Interview.formatClock(p.solveTimeMs)}` : ''}`,
                    `${Math.round(p.coverage * 100)}% מהבדיקות עברו${p.solved ? ` · נפתרה ב-${Interview.formatClock(p.solveTimeMs)}` : ''}`,
                  ),
                ),
              ),
              h('a.btn.btn-secondary.btn-sm.report-review', { href: `#/problem/${p.id}`, 'aria-label': tp(`Review ${title}`, `לחזור לבעיה ${title}`) }, tp('Review', 'לחזור לבעיה')),
            );
          }),
        ),
        h(
          'div.mode-actions.report-actions',
          {},
          again,
          h('a.btn.btn-secondary', { href: '#/' }, tp('Back to problems', 'לחזור לבעיות')),
          shareButton({ name: tp('Share your interview score', 'לשתף את ציון הראיון'), get: (lang) => interviewShare({ score: a.score, band: Interview.bandLabel(a.band.band, lang), solved: a.solved, total: a.problems.length, lang }) }),
        ),
      ),
      siteFooter(),
    ),
  );
  return () => {};
}

/* ======================= Battle ======================= */

const BOT_META = {
  rookie: { mark: 'Rk', desc: 'Relaxed pace. Solves steadily with pauses.', descHe: 'קצב רגוע. פותר בהתמדה, עם הפסקות.' },
  regular: { mark: 'Rg', desc: 'Interview pace. Solves at a typical speed.', descHe: 'קצב של ראיון. פותר במהירות רגילה.' },
  grandmaster: { mark: 'Gm', desc: 'Fast pace. Nearly twice as fast as Regular.', descHe: 'קצב מהיר. כמעט פי 2 מהר יותר מהבוט הרגיל.' },
};

/**
 * 1v1 Battle view against a bot opponent (modes/battle.js): setup, then the workspace with the bot's live progress.
 * @param {HTMLElement} root
 * @param {{ store: object }} deps the progress store
 * @returns {() => void} cleanup (invariant 7)
 */
export function renderBattle(root, { store }) {
  const problems = availableEntries();
  let level = 'regular';
  let problemId = problems[0].id;
  const pf = { difficulty: 'all', topic: 'all' };
  let topicOpen = false;
  const topicLabel = (id) => TOPICS.find((t) => t.id === id)?.label ?? id;

  const lang = pageLang();
  const barSummary = h('div.setup-bar-summary', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const describeStart = () => {
    const p = catalogEntry(problemId);
    const bot = botLabel(level, lang);
    mount(
      barSummary,
      h('div.setup-bar-title', {}, h('strong', {}, p?.title ?? problemId), p ? difficulty(p.difficulty) : null),
      h('div.hint-text.setup-bar-sub', {}, tp(`${bot} · Bot opponent. Reveal and Mentor stay off.`, `${bot} · בלי חשיפת הפתרון ובלי Mentor.`)),
    );
  };

  const opponentGroup = createOptionGroup({
    label: tp('Opponent', 'יריב'),
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
          h('span.option-card-body', {}, h('strong.option-card-title', {}, botLabel(l.id, lang)), h('span.option-card-fact', {}, tp(meta.desc, meta.descHe ?? meta.desc))),
        ],
      };
    },
    onChange: (next) => {
      level = next.id;
      describeStart();
    },
  });

  const diffGroup = chipGroup({
    label: tp('Difficulty', 'רמת קושי'),
    options: ['all', ...DIFFICULTIES].map((d) => ({ value: d, label: d === 'all' ? tp('All difficulties', 'כל הרמות') : d, attrs: { 'data-difficulty': d } })),
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
    tp('Topic', 'נושא'),
  );

  const syncTopicToggle = () => {
    const active = pf.topic !== 'all';
    topicToggle.textContent = active ? tp(`Topic: ${topicLabel(pf.topic)}`, `נושא: ${topicLabel(pf.topic)}`) : tp('Topic', 'נושא');
    topicToggle.classList.toggle('is-active', active);
  };

  const topicGroup = chipGroup({
    label: tp('Topic', 'נושא'),
    options: [{ value: 'all', label: tp('All topics', 'כל הנושאים'), attrs: { 'data-value': 'all' } }, ...usedTopics(problems, TOPICS).map((t) => ({ value: t.id, label: t.label, attrs: { 'data-value': t.id } }))],
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

  const random = h('button.btn.btn-secondary.btn-sm', { type: 'button' }, tp('Random', 'להגריל'));

  const problemPicker = createPicker({
    label: tp('Problem', 'בעיה'),
    layout: 'list',
    items: problems.map((p) => ({ ...p, label: p.title, searchText: p.title })),
    value: problemId,
    pageSize: 12,
    search: { placeholder: tp('Search problems', 'חיפוש בעיות'), ariaLabel: tp('Search problems', 'חיפוש בעיות') },
    extraControls: [random, diffGroup, topicToggle],
    extraPanel: topicPanel,
    predicate: (p) => (pf.difficulty === 'all' || p.difficulty === pf.difficulty) && (pf.topic === 'all' || p.topics.includes(pf.topic)),
    emptyTitle: tp('No matching problems', 'אין בעיות מתאימות'),
    emptyBody: tp('No problems match these filters. Try another search or clear the active filters.', 'אין בעיות שמתאימות לסינון הזה. כדאי לנסות חיפוש אחר או לנקות את הסינון.'),
    formatCount: ({ filtered, total }) => tp(`${filtered} of ${total} ${total === 1 ? 'problem' : 'problems'}`, total === 1 ? `${filtered} מתוך בעיה אחת` : `${filtered} מתוך ${total} בעיות`),
    formatSelected: (item) => (item ? [tp('Selected: ', 'נבחרה: '), h('strong', {}, item.title), ' ', difficulty(item.difficulty)] : tp('No problem selected', 'לא נבחרה בעיה')),
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
  const startLabel = tp('Start race', 'להתחיל את המרוץ');
  const start = h('button.btn.btn-primary.btn-lg', { type: 'button' }, startLabel);
  const tour = modeTour('battle');

  let cleanup = () => {};
  let disposed = false;
  start.addEventListener('click', async () => {
    start.disabled = true;
    start.textContent = tp('Loading the problem...', 'טוען את הבעיה…');
    let problem;
    try {
      problem = await loadProblem(problemId);
    } catch {
      if (disposed) return;
      start.disabled = false;
      start.textContent = startLabel;
      toast(tp('The problem could not be loaded. Check your connection and try again.', 'לא הצלחנו לטעון את הבעיה. כדאי לבדוק את החיבור ולנסות שוב.'), 'error');
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
      h('a.back-link', { href: '#/modes' }, tp('All modes', 'כל האימונים')),
      h('header.page-head', {}, h('h1', {}, tp('1v1 Battle', 'קרב 1 על 1')), tour.replay, h('p.page-sub', {}, tp('First to an accepted submission wins.', 'ההגשה הראשונה שמקבלת Accepted מנצחת.'))),
      h(
        'div.setup-card',
        {},
        h('h2.setup-heading', {}, tp('Opponent', 'יריב')),
        opponentGroup.el,
        h('h2.setup-heading', {}, tp('Problem', 'בעיה')),
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
      shareButton({ name: 'Share the race result', get: (lang) => battleShare({ won: who === 'you', bot: bot.name, title: problem.title, lang }) }),
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

  // don't touch / the race is the exam room: English and left to right on every site language (docs/I18N.md)
  const host = h('div.session-host', { dir: 'ltr', lang: 'en' });
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
