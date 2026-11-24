/**
 * Quiz (#/quiz, #/quiz/daily): multiple-choice questions on interview concepts, built for a
 * phone and a few spare minutes, in English or Hebrew (technical terms stay in English). The
 * hub picks the language, how to play and which topics; the same play screen runs free play and
 * the daily quiz. Session rules live in modes/quiz.js (pure); this file draws them, loads the
 * topics a session needs, and saves the result.
 */
import { h, mount, segmented, progressBar, siteFooter, confirmDialog, loadingState, stateBlock, toast } from '../dom.js';
import { QUIZ_TOPICS } from '../../data/quiz-topics.js';
import { QUIZ_INDEX } from '../../data/quiz-index.js';
import { loadQuizTopics } from '../../data/quiz-loader.js';
import { QUIZ_MODES, DAILY_QUIZ_SIZE, dailyQuizNumber, quizMode, pickIds, buildQuiz, startDailyQuiz, dailyQuizIds, topicsFor, currentQuestion, answerQuestion, showNext, endQuiz, isOver, timeLeft, quizSummary, authoredChoices } from '../../modes/quiz.js';
import { shareText } from '../../data/quiz-share.js';
import { services } from '../../auth/services.js';
import { createQuizBoard } from '../../auth/quiz-board.js';
import { loadQuizProgress, saveQuizProgress, recordSession, masteredIds, topicProgress, dailyQuizStreak } from '../../state/quiz-progress.js';
import { dayKey } from '../../state/progress.js';
import { msUntilNextDaily, formatCountdown } from '../../data/daily.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** Device preference: which language the quiz is shown in (not user data, see state/user-data.js). */
const LANG_KEY = 'lfb:quiz-lang';

/** Interface words of the quiz screens, per language. Questions bring their own text. */
const T = {
  en: {
    levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    modes: { practice: 'Practice', sprint: 'Sprint', survival: 'Survival' },
    notes: { practice: '10 questions, no clock, an explanation after each', sprint: '10 questions against a 2 minute clock', survival: 'Keep going until your third wrong answer' },
    question: (n, of) => (of ? `Question ${n} of ${of}` : `Question ${n}`),
    correct: 'Correct.',
    notQuite: (l) => `Not quite. The answer is ${l}.`,
    whyNot: (l) => `Why not ${l}:`,
    readMore: 'Read more',
    next: 'Next',
    seeResults: 'See results',
    leave: 'Leave',
    end: 'End',
    endTitle: 'End the quiz?',
    endBody: 'Your answers so far are scored and saved.',
    endConfirm: 'End quiz',
    answers: 'Answers',
    livesLeft: (n, of) => `${n} of ${of} lives left`,
    timeLeft: 'Time left',
    loading: 'Loading questions...',
    loadFailed: 'Could not load the questions',
    loadFailedBody: 'Check your connection and try again.',
    tryAgain: 'Try again',
    back: 'Back',
    none: 'No questions match this choice.',
    dailyTitle: (n) => `Daily quiz No. ${n}`,
    results: (m) => `${m} results`,
    accuracy: (p) => `${p}% correct`,
    duration: (m, s) => `${m} min ${s} s`,
    streak: (n) => `${n}-day quiz streak`,
    replay: 'Practice replay, your first score stands',
    newBest: 'New best for this mode',
    best: (n) => `Best: ${n}`,
    survivalHead: (n) => `${n} right before the third miss`,
    clean: 'A clean sheet.',
    solid: 'Solid.',
    again: 'Worth another round.',
    playAgain: 'Play again',
    playItAgain: 'Play it again',
    retryMissed: (n) => `Retry the ${n} missed`,
    changeSetup: 'Change setup',
    moreQuizzes: 'More quizzes',
    byTopic: 'By topic',
    reviewMissed: (n) => `Review the ${n} missed`,
    yourAnswer: 'Your answer: ',
    answer: 'Answer: ',
    share: 'Share result',
    shared: 'Copied. Paste it to your friends.',
    shareFailed: 'Could not share. Try again.',
    board: 'Leaderboard',
    today: 'Today',
    week: 'This week',
    boardEmpty: 'No one has played yet. Be the first.',
    boardLoading: 'Loading the leaderboard...',
    boardDown: 'The leaderboard is unavailable right now. Your result is saved on this device.',
    joinBoard: 'Sign in to join the leaderboard and keep your streak on every device.',
    google: 'Continue with Google',
    github: 'Continue with GitHub',
    yourRank: (r, n) => `You are #${r} of ${n} today`,
    alreadyCounted: 'Only your first play today counts on the board.',
    players: (n) => `${n} played today`,
    days: (n) => `${n} day${n === 1 ? '' : 's'}`,
    you: 'you',
  },
  he: {
    levels: { easy: 'קל', medium: 'בינוני', hard: 'קשה' },
    modes: { practice: 'תרגול', sprint: 'ספרינט', survival: 'הישרדות' },
    notes: { practice: '10 שאלות, בלי שעון, הסבר אחרי כל שאלה', sprint: '10 שאלות מול שעון של 2 דקות', survival: 'ממשיכים עד הטעות השלישית' },
    question: (n, of) => (of ? `שאלה ${n} מתוך ${of}` : `שאלה ${n}`),
    correct: 'נכון.',
    notQuite: (l) => `לא בדיוק. התשובה היא ${l}.`,
    whyNot: (l) => `למה לא ${l}:`,
    readMore: 'להרחבה',
    next: 'הבאה',
    seeResults: 'לתוצאות',
    leave: 'יציאה',
    end: 'סיום',
    endTitle: 'לסיים את החידון?',
    endBody: 'התשובות עד עכשיו נספרות ונשמרות.',
    endConfirm: 'לסיים',
    answers: 'תשובות',
    livesLeft: (n, of) => `נשארו ${n} מתוך ${of} חיים`,
    timeLeft: 'זמן שנותר',
    loading: 'טוען שאלות...',
    loadFailed: 'לא הצלחנו לטעון את השאלות',
    loadFailedBody: 'כדאי לבדוק את החיבור ולנסות שוב.',
    tryAgain: 'לנסות שוב',
    back: 'חזרה',
    none: 'אין שאלות שמתאימות לבחירה הזאת.',
    dailyTitle: (n) => `חידון יומי מס' ${n}`,
    results: (m) => `תוצאות: ${m}`,
    accuracy: (p) => `${p}% נכון`,
    duration: (m, s) => `${m} דק' ${s} שנ'`,
    streak: (n) => `רצף של ${n} ימים`,
    replay: 'משחק חוזר לתרגול, התוצאה הראשונה נשארת',
    newBest: 'שיא חדש במצב הזה',
    best: (n) => `שיא: ${n}`,
    survivalHead: (n) => `${n} תשובות נכונות לפני הטעות השלישית`,
    clean: 'בלי אף טעות.',
    solid: 'יפה מאוד.',
    again: 'שווה עוד סיבוב.',
    playAgain: 'עוד סיבוב',
    playItAgain: 'לשחק שוב',
    retryMissed: (n) => `לתרגל שוב את ה-${n} שפספסת`,
    changeSetup: 'לשנות הגדרות',
    moreQuizzes: 'עוד חידונים',
    byTopic: 'לפי נושא',
    reviewMissed: (n) => `סקירת ${n} השאלות שפספסת`,
    yourAnswer: 'התשובה שלך: ',
    answer: 'התשובה: ',
    share: 'לשתף את התוצאה',
    shared: 'הועתק. אפשר להדביק לחברים.',
    shareFailed: 'השיתוף לא הצליח. כדאי לנסות שוב.',
    board: 'טבלת המובילים',
    today: 'היום',
    week: 'השבוע',
    boardEmpty: 'עוד אף אחד לא שיחק. אפשר להיות הראשון.',
    boardLoading: 'טוען את טבלת המובילים...',
    boardDown: 'טבלת המובילים לא זמינה כרגע. התוצאה נשמרה במכשיר.',
    joinBoard: 'אפשר להתחבר כדי להופיע בטבלה ולשמור על הרצף בכל מכשיר.',
    google: 'המשך עם Google',
    github: 'המשך עם GitHub',
    yourRank: (r, n) => `מקום ${r} מתוך ${n} היום`,
    alreadyCounted: 'רק המשחק הראשון של היום נספר בטבלה.',
    players: (n) => `${n} שיחקו היום`,
    days: (n) => `${n} ימים`,
    you: 'אני',
  },
};

/** Saved language, or Hebrew for a browser set to Hebrew. */
function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'he') return saved;
  } catch {
    /* storage blocked: fall through to the browser language */
  }
  return (navigator.language ?? '').toLowerCase().startsWith('he') ? 'he' : 'en';
}

function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
}

const topicTitle = (id, lang) => QUIZ_TOPICS.find((t) => t.id === id)?.title[lang] ?? id;

/**
 * Attributes for a block of quiz text: Hebrew reads right to left. Short labels that may start
 * with an English term (topic titles like "C ו-C++") use dir="auto" instead, or the trailing
 * "++" lands on the wrong side.
 */
const textDir = (lang) => (lang === 'he' ? { dir: 'rtl', lang: 'he' } : { dir: 'ltr', lang: 'en' });

/**
 * "How it works": replays the page guide (data/tours.js); the first visit's guide is started by
 * the router, like every other page.
 * @returns {HTMLElement}
 */
function guideBtn() {
  const b = h('button.btn.btn-ghost.btn-sm.tour-replay', { type: 'button', 'aria-haspopup': 'dialog' }, 'How it works');
  b.addEventListener('click', () => dispatchEvent(new CustomEvent('tour:open', { detail: 'quiz' })));
  return b;
}

/** "1:05" for a sprint clock. */
function clock(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Loads the topics `ids` need and builds the session, drawing a loading state meanwhile.
 * @param {HTMLElement} root
 * @param {{ ids: string[], lang: 'en'|'he', build: (questions: any[]) => any, onReady: (session: any) => void, onBack: () => void, isDisposed: () => boolean }} opts
 */
function loadAndStart(root, { ids, lang, build, onReady, onBack, isDisposed }) {
  const t = T[lang];
  mount(root, h('div.page.page-narrow.quiz-page', {}, loadingState({ label: t.loading, rows: 4 })));
  loadQuizTopics(topicsFor(QUIZ_INDEX, ids), lang).then(
    (questions) => {
      if (!isDisposed()) onReady(build(questions));
    },
    () => {
      if (isDisposed()) return;
      mount(
        root,
        h(
          'div.page.page-narrow.quiz-page',
          {},
          stateBlock({ title: t.loadFailed, body: t.loadFailedBody, kind: 'error', action: { label: t.tryAgain, onClick: () => loadAndStart(root, { ids, lang, build, onReady, onBack, isDisposed }) }, secondary: { label: t.back, onClick: onBack } }),
        ),
      );
    },
  );
}

/** The board client, or null while accounts are not configured. Built on use: views load per route. */
function quizBoard() {
  const account = services.account;
  if (!account?.config?.enabled) return null;
  return createQuizBoard({ account });
}

const signedIn = () => services.account?.get?.().status === 'signed-in';

/** "1:05" from milliseconds, for the board's time column. */
const mmss = (ms) => clock(Math.max(1000, ms));

/** Where a shared result points: the daily quiz on this site. */
const dailyUrl = () => `${location.origin}${location.pathname}#/quiz/daily`;

/**
 * Shares text through the phone's share sheet, or copies it where there is none.
 * @param {string} text
 * @param {'en'|'he'} lang
 */
async function shareResult(text, lang) {
  const t = T[lang];
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast(t.shared, 'success');
  } catch (err) {
    // The player closing the share sheet is not a failure.
    if (err?.name !== 'AbortError') toast(t.shareFailed, 'error');
  }
}

/**
 * Today's and this week's leaderboard. With `submit`, the player's first play of the day is
 * sent first (choices only; the server scores them) and the board comes back with the answer.
 * @param {{ day: string, lang: 'en'|'he', submit?: { answers: { id: string, choice: number }[], ms: number }|null, onBoard?: (board: any, mine: any) => void }} opts
 * @returns {HTMLElement|null} null when accounts are not configured
 */
function boardBlock({ day, lang, submit = null, onBoard = () => {} }) {
  const t = T[lang];
  const client = quizBoard();
  // No accounts on this site (a fork, a local run): no board at all, rather than a broken one.
  if (!client) return null;
  const body = h('div.quiz-board-body', {}, h('p.hint-text', {}, t.boardLoading));
  const section = h('section.quiz-board', { 'aria-labelledby': 'quiz-board-title', ...textDir(lang) }, h('h2.section-title#quiz-board-title', {}, t.board), body);
  let view = 'daily';
  const rows = (list, kind) =>
    list.length
      ? h(
          'ol.quiz-board-list',
          {},
          list.map((r) =>
            h(
              `li.quiz-board-row${r.you ? '.is-you' : ''}`,
              {},
              h('span.quiz-board-rank', {}, `${r.rank}`),
              h('span.quiz-board-name', { dir: 'auto' }, r.name, r.you ? h('span.quiz-board-you', {}, ` (${t.you})`) : null),
              h('span.quiz-board-score', { dir: 'ltr' }, kind === 'weekly' ? `${r.correct}/${r.days * DAILY_QUIZ_SIZE}` : `${r.correct}/${r.total ?? DAILY_QUIZ_SIZE}`),
              h('span.quiz-board-time', { dir: 'ltr' }, kind === 'weekly' ? t.days(r.days) : mmss(r.ms)),
            ),
          ),
        )
      : h('p.hint-text', {}, t.boardEmpty);
  const draw = (board, mine) => {
    const me = board.daily.find((r) => r.you);
    const toggle = segmented({ label: t.board, options: [{ value: 'daily', label: t.today }, { value: 'weekly', label: t.week }], value: view, onChange: (v) => { view = v; draw(board, mine); } });
    mount(
      body,
      h(
        'div.quiz-board-head',
        {},
        toggle,
        h('span.hint-text', {}, me ? t.yourRank(me.rank, board.players) : t.players(board.players)),
        board.me?.streak ? h('span.quiz-streak-badge', {}, lang === 'he' ? `רצף של ${board.me.streak} ימים` : `${board.me.streak}-day streak`) : null,
      ),
      mine && !mine.recorded ? h('p.hint-text', {}, t.alreadyCounted) : null,
      rows(view === 'daily' ? board.daily : board.weekly, view),
      signedIn()
        ? null
        : h(
            'div.quiz-board-join',
            {},
            h('p.hint-text', {}, t.joinBoard),
            h('div.quiz-actions', {}, h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => services.account?.signIn('google') }, t.google), h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => services.account?.signIn('github') }, t.github)),
          ),
    );
  };
  const go = submit && signedIn() ? client.submit({ day, ...submit }).then((mine) => [mine.board, mine]) : client.board(day).then((board) => [board, null]);
  go.then(
    ([board, mine]) => {
      draw(board, mine);
      onBoard(board, mine);
    },
    () => mount(body, h('p.hint-text', {}, t.boardDown)),
  );
  return section;
}

/**
 * The share button for a finished daily quiz; it reads the rank when the board has answered.
 * @param {{ number: number, results: boolean[], streak: () => number, rank: () => ({ rank: number, players: number }|null), lang: 'en'|'he' }} p
 */
function shareButton({ number, results, streak, rank, lang }) {
  return h(
    'button.btn.btn-secondary.quiz-share-btn',
    { type: 'button', onClick: () => shareResult(shareText({ number, results, streak: streak(), rank: rank()?.rank ?? null, players: rank()?.players ?? null, lang, url: dailyUrl() }), lang) },
    T[lang].share,
  );
}

/** The last hub setup, so "Play again" and coming back keep the player's choice (in memory only). */
let lastSetup = { mode: 'practice', topics: [] };

/**
 * Quiz hub: language, daily quiz, how to play, topic picker, start.
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function renderQuizHub(root) {
  let disposed = false;
  let stopPlay = () => {};
  let setup = { mode: lastSetup.mode, topics: [...lastSetup.topics] };
  let lang = loadLang();

  function renderSetup() {
    stopPlay();
    stopPlay = () => {};
    const t = T[lang];
    const progress = loadQuizProgress();
    const perTopic = topicProgress(progress, QUIZ_INDEX);
    const today = dayKey(new Date());
    const todayResult = progress.daily[today];
    const quizStreak = dailyQuizStreak(progress, new Date());

    const pool = () => QUIZ_INDEX.filter((q) => !setup.topics.length || setup.topics.includes(q.topic)).length;
    const scopeLine = h('p.quiz-scope', { 'aria-live': 'polite' });
    const modeNote = h('p.hint-text.quiz-mode-note', textDir(lang));
    const sync = () => {
      const n = setup.topics.length;
      scopeLine.textContent = n ? `${n} topic${n === 1 ? '' : 's'}, ${pool()} questions` : `All ${QUIZ_TOPICS.length} topics mixed, ${QUIZ_INDEX.length} questions`;
      modeNote.textContent = t.notes[setup.mode];
      allBtn.setAttribute('aria-pressed', String(n === 0));
      topicBtns.forEach((b) => b.setAttribute('aria-pressed', String(setup.topics.includes(b.dataset.topic))));
    };

    const allBtn = h('button.chip.quiz-all', { type: 'button', 'aria-pressed': 'true', onClick: () => { setup.topics = []; sync(); } }, 'All topics');
    const topicBtns = QUIZ_TOPICS.map((tp) => {
      const p = perTopic.get(tp.id) ?? { total: 0, known: 0 };
      return h(
        'button.quiz-topic',
        {
          type: 'button',
          'data-topic': tp.id,
          'aria-pressed': 'false',
          onClick: () => {
            setup.topics = setup.topics.includes(tp.id) ? setup.topics.filter((x) => x !== tp.id) : [...setup.topics, tp.id];
            sync();
          },
        },
        h('span.quiz-topic-title', { dir: 'auto', lang }, tp.title[lang]),
        h('span.quiz-topic-blurb', textDir(lang), tp.blurb[lang]),
        h('span.quiz-topic-meta', {}, progressBar(p.known, p.total), h('span', {}, `${p.known} / ${p.total} known`)),
      );
    });

    const start = () => {
      lastSetup = { mode: setup.mode, topics: [...setup.topics] };
      startFree({ mode: setup.mode, topics: setup.topics });
    };

    const langPicker = segmented({
      label: 'Quiz language',
      options: [{ value: 'en', label: 'English' }, { value: 'he', label: 'עברית' }],
      value: lang,
      onChange: (v) => {
        lang = v;
        saveLang(v);
        renderSetup();
      },
    });

    const dailyCard = h(
      'section.quiz-daily',
      { 'aria-labelledby': 'quiz-daily-title' },
      h('div.quiz-daily-copy', {}, h('span.eyebrow', {}, `Quiz No. ${dailyQuizNumber(today)}`), h('h2#quiz-daily-title', {}, 'Daily quiz'), h('p.hint-text', {}, todayResult ? `Done today: ${todayResult.correct} / ${todayResult.total}. A new one in ${formatCountdown(msUntilNextDaily(new Date()))}.` : `${DAILY_QUIZ_SIZE} questions from ${DAILY_QUIZ_SIZE} topics, the same for everyone today.`)),
      h('div.quiz-daily-side', {}, quizStreak ? h('span.quiz-streak', {}, `${quizStreak}-day quiz streak`) : null, h(`a.btn${todayResult ? '.btn-secondary' : '.btn-primary'}`, { href: '#/quiz/daily' }, todayResult ? 'See today\'s result' : 'Play today\'s quiz'), h('a.btn.btn-ghost', { href: '#/quiz/board' }, 'Leaderboard')),
    );

    mount(
      root,
      h(
        'div.page.quiz-page',
        {},
        h('header.page-head', {}, h('div', {}, h('span.eyebrow', {}, 'Five spare minutes'), h('h1', {}, 'Quiz'), guideBtn(), h('p.page-sub', {}, 'Multiple-choice questions on the ideas student and first-job interviews test: OOP, data structures, databases, concurrency, networking and more. No editor needed, so it works on a phone. In English or Hebrew.'))),
        h('div.quiz-field.quiz-lang', {}, h('span.quiz-label', {}, 'Language'), langPicker, h('p.hint-text', {}, 'Hebrew keeps technical terms in English, as interviewers say them.')),
        dailyCard,
        h(
          'section.quiz-setup',
          { 'aria-labelledby': 'quiz-setup-title' },
          h('h2.section-title#quiz-setup-title', {}, 'Free play'),
          h('div.quiz-field', { 'data-tour': 'quiz-mode' }, h('span.quiz-label', { id: 'quiz-mode-label' }, 'How to play'), segmented({ label: 'How to play', options: QUIZ_MODES.map((m) => ({ value: m.id, label: m.label })), value: setup.mode, onChange: (v) => { setup.mode = v; sync(); } }), modeNote),
          h('div.quiz-field', {}, h('div.quiz-topics-head', {}, h('span.quiz-label', {}, 'Topics'), allBtn), h('div.quiz-topic-grid', { role: 'group', 'aria-label': 'Topics, pick one or more' }, topicBtns)),
          h('div.quiz-start', {}, scopeLine, h(`button.btn${todayResult ? '.btn-primary' : '.btn-secondary'}.quiz-start-btn`, { type: 'button', onClick: start }, 'Start quiz')),
        ),
        siteFooter(),
      ),
    );
    sync();
  }

  /** Picks ids from the index, loads their topics, then plays. */
  function startFree({ mode, topics, only = null }) {
    const seed = Date.now() >>> 0;
    const ids = pickIds({ index: QUIZ_INDEX, topics, count: only ? null : quizMode(mode).count, seed, mastered: masteredIds(loadQuizProgress()), only });
    const playLang = lang;
    loadAndStart(root, {
      ids,
      lang: playLang,
      build: (questions) => buildQuiz({ questions, ids, mode, topics, seed, now: Date.now() }),
      onReady: (session) => play(session, playLang),
      onBack: renderSetup,
      isDisposed: () => disposed,
    });
  }

  function play(session, playLang) {
    stopPlay = renderPlay(root, {
      session,
      lang: playLang,
      onDone: (finished) => {
        const before = loadQuizProgress();
        saveQuizProgress(recordSession(before, finished));
        stopPlay = renderResults(root, {
          session: finished,
          lang: playLang,
          prevBest: before.best[finished.mode] ?? 0,
          onAgain: () => startFree({ mode: finished.mode, topics: finished.topics }),
          onRetryMissed: (ids) => startFree({ mode: 'practice', topics: [], only: ids }),
          onBack: renderSetup,
        });
      },
      onQuit: renderSetup,
    });
  }

  renderSetup();
  return () => {
    disposed = true;
    stopPlay();
  };
}

/**
 * Today's daily quiz. Played once for the record; once done, the page shows the result and can
 * replay it for practice without changing it. The same questions in either language.
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function renderDailyQuiz(root) {
  let disposed = false;
  let stop = () => {};
  const today = dayKey(new Date());
  const number = dailyQuizNumber(today);
  const lang = loadLang();
  const t = T[lang];

  function begin() {
    stop();
    stop = () => {};
    loadAndStart(root, {
      ids: dailyQuizIds(QUIZ_INDEX, today),
      lang,
      build: (questions) => startDailyQuiz({ index: QUIZ_INDEX, questions, day: today, now: Date.now() }),
      onReady: (session) => {
        stop = renderPlay(root, {
          session,
          lang,
          title: t.dailyTitle(number),
          onDone: (finished) => {
            const before = loadQuizProgress();
            const first = !before.daily[today];
            saveQuizProgress(recordSession(before, finished));
            const results = finished.answers.map((a) => a.correct);
            // Only the first play of the day goes to the server; a replay is practice.
            const submit = first ? { answers: authoredChoices(finished), ms: Math.max(0, (finished.endedAt ?? Date.now()) - finished.startedAt) } : null;
            stop = renderResults(root, { session: finished, lang, daily: { number, first, day: today, results, submit, streak: dailyQuizStreak(loadQuizProgress(), new Date()) }, onAgain: begin, onRetryMissed: null, onBack: () => (location.hash = '#/quiz') });
          },
          onQuit: () => (location.hash = '#/quiz'),
        });
      },
      onBack: () => (location.hash = '#/quiz'),
      isDisposed: () => disposed,
    });
  }

  const done = loadQuizProgress().daily[today];
  let boardRank = null;
  let boardStreak = null;
  if (!done) {
    begin();
  } else {
    mount(
      root,
      h(
        'div.page.page-narrow.quiz-page',
        {},
        h(
          'section.quiz-result-card',
          { 'aria-labelledby': 'quiz-done-title' },
          h('span.eyebrow', {}, `Daily quiz No. ${number}`),
          h('h1#quiz-done-title', {}, 'Done for today'),
          h('p.quiz-big', {}, `${done.correct} / ${done.total}`),
          done.results ? h('ol.quiz-squares.quiz-squares-lg', { 'aria-label': `${done.correct} of ${done.total} correct` }, done.results.map((ok) => h(`li.quiz-square${ok ? '.is-correct' : '.is-wrong'}`))) : null,
          h('p.hint-text', {}, `A new quiz in ${formatCountdown(msUntilNextDaily(new Date()))}. Replaying today's does not change your score.`),
          h(
            'div.quiz-actions',
            {},
            done.results ? shareButton({ number, results: done.results, streak: () => boardStreak ?? dailyQuizStreak(loadQuizProgress(), new Date()), rank: () => boardRank, lang }) : null,
            h('button.btn.btn-secondary', { type: 'button', onClick: begin }, 'Play it again'),
            h('a.btn.btn-ghost', { href: '#/quiz' }, 'More quizzes'),
          ),
        ),
        boardBlock({ day: today, lang, onBoard: (board) => { const me = board.daily.find((r) => r.you); boardRank = me ? { rank: me.rank, players: board.players } : null; boardStreak = board.me?.streak ?? null; } }),
        siteFooter(),
      ),
    );
  }
  return () => {
    disposed = true;
    stop();
  };
}

/**
 * The leaderboard page (#/quiz/board): today's and this week's board for the daily quiz, open to
 * everyone; signed-in players also see their synced streak.
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function renderQuizBoard(root) {
  const lang = loadLang();
  const today = dayKey(new Date());
  const done = loadQuizProgress().daily[today];
  mount(
    root,
    h(
      'div.page.page-narrow.quiz-page',
      {},
      h('header.page-head', {}, h('div', {}, h('span.eyebrow', {}, `Daily quiz No. ${dailyQuizNumber(today)}`), h('h1', {}, 'Leaderboard'), h('p.page-sub', {}, 'Scores are checked on the server, and only your first play of the day counts. Ties go to the faster player. Weeks run Sunday to Saturday.'))),
      h('div.quiz-actions.quiz-board-cta', {}, h(`a.btn${done ? '.btn-secondary' : '.btn-primary'}`, { href: '#/quiz/daily' }, done ? "See today's result" : "Play today's quiz"), h('a.btn.btn-ghost', { href: '#/quiz' }, 'More quizzes')),
      boardBlock({ day: today, lang }),
      siteFooter(),
    ),
  );
  return () => {};
}

/**
 * The play screen. Draws one question at a time; answering reveals the right option, why it is
 * right and, after a miss, why the chosen option is wrong; then Next (or Enter) moves on.
 * @param {HTMLElement} root
 * @param {{ session: import('../../modes/quiz.js').QuizSession, lang: 'en'|'he', title?: string, onDone: (s: any) => void, onQuit: () => void }} opts
 * @returns {() => void} cleanup
 */
function renderPlay(root, { session, lang, title = '', onDone, onQuit }) {
  const t = T[lang];
  let s = session;
  let revealed = false;
  let finished = false;
  let timer = 0;
  const mode = quizMode(s.mode);
  const capped = s.mode === 'survival';

  const counter = h('span.quiz-counter', textDir(lang));
  const clockEl = h('span.quiz-clock', { role: 'timer', 'aria-label': t.timeLeft });
  const livesEl = h('span.quiz-lives');
  const bar = h('div.quiz-bar', { 'aria-hidden': 'true' }, h('span.quiz-bar-fill'));
  const body = h('div.quiz-body');
  const live = h('p.sr-only', { 'aria-live': 'assertive', ...textDir(lang) });
  const quitBtn = h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: () => quit() }, t.leave);

  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    onDone(endQuiz(s, Date.now()));
  };

  const quit = async () => {
    if (!s.answers.length) return (cleanup(), onQuit());
    const ok = await confirmDialog({ title: t.endTitle, body: t.endBody, confirmLabel: t.endConfirm });
    if (ok) finish();
  };

  function drawHud() {
    // Leaving before any answer saves nothing; after one, ending scores the session.
    quitBtn.textContent = s.answers.length ? t.end : t.leave;
    const n = Math.min(s.answers.length + (revealed ? 0 : 1), s.questions.length);
    counter.textContent = capped ? t.question(Math.max(1, n)) : t.question(n, s.questions.length);
    bar.firstChild.style.width = `${(s.answers.length / Math.max(1, s.questions.length)) * 100}%`;
    bar.hidden = capped;
    if (s.lives != null) {
      mount(livesEl, Array.from({ length: mode.lives }, (_, i) => h(`span.quiz-life${i < s.lives ? '.is-on' : ''}`, { 'aria-hidden': 'true' })), h('span.sr-only', {}, t.livesLeft(s.lives, mode.lives)));
    }
    const left = timeLeft(s, Date.now());
    if (left != null) {
      clockEl.textContent = clock(left);
      clockEl.classList.toggle('is-low', left <= 15000);
    }
  }

  function drawQuestion() {
    const q = s.questions[s.answers.length];
    if (!q) return finish();
    revealed = false;
    const optionBtns = q.options.map((text, i) =>
      h('li', {}, h('button.quiz-option', { type: 'button', 'data-index': String(i), 'aria-keyshortcuts': String(i + 1), onClick: () => choose(i) }, h('span.quiz-key', { 'aria-hidden': 'true' }, LETTERS[i]), h('span.quiz-option-text', {}, text))),
    );
    mount(
      body,
      h(
        'article.quiz-card',
        { 'aria-labelledby': 'quiz-q', ...textDir(lang) },
        h('div.quiz-q-meta', {}, h('span.tag', { dir: 'auto' }, topicTitle(q.topic, lang)), h('span.quiz-level', {}, t.levels[q.level] ?? q.level)),
        h('h2.quiz-q#quiz-q', { tabindex: '-1' }, q.q),
        // Code reads left to right in either language.
        q.code ? h('pre.quiz-code', { dir: 'ltr', lang: 'en' }, h('code', {}, q.code)) : null,
        h('ol.quiz-options', { 'aria-label': t.answers }, optionBtns),
        h('div.quiz-feedback'),
      ),
    );
    drawHud();
    body.querySelector('.quiz-q')?.focus({ preventScroll: true });
  }

  function choose(i) {
    if (revealed || finished) return;
    const q = currentQuestion(s);
    if (!q) return;
    s = answerQuestion(s, i, Date.now());
    revealed = true;
    const correct = i === q.answer;
    body.querySelectorAll('.quiz-option').forEach((b, k) => {
      b.disabled = true;
      if (k === q.answer) b.classList.add('is-correct');
      else if (k === i) b.classList.add('is-wrong');
      if (k === i) b.setAttribute('aria-describedby', 'quiz-verdict');
    });
    const over = isOver(s, Date.now());
    const nextBtn = h('button.btn.btn-primary.quiz-next', { type: 'button', onClick: next }, over ? t.seeResults : t.next);
    const whyNot = !correct && q.wrong?.[i];
    mount(
      body.querySelector('.quiz-feedback'),
      h(`p.quiz-verdict${correct ? '.is-correct' : '.is-wrong'}#quiz-verdict`, {}, correct ? t.correct : t.notQuite(LETTERS[q.answer])),
      h('p.quiz-why', {}, q.why),
      whyNot ? h('p.quiz-why-not', {}, h('span.quiz-review-label', {}, t.whyNot(LETTERS[i])), ' ', whyNot) : null,
      q.ref ? h('a.quiz-ref', { href: q.ref, target: '_blank', rel: 'noopener noreferrer' }, t.readMore) : null,
      nextBtn,
    );
    live.textContent = correct ? t.correct : `${t.notQuite(LETTERS[q.answer])} ${q.options[q.answer]}`;
    drawHud();
    nextBtn.focus({ preventScroll: true });
    nextBtn.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }

  function next() {
    if (!revealed || finished) return;
    if (isOver(s, Date.now())) return finish();
    s = showNext(s, Date.now());
    drawQuestion();
    root.querySelector('.quiz-hud')?.scrollIntoView?.({ block: 'nearest' });
  }

  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
    const k = e.key.toLowerCase();
    const idx = /^[1-5]$/.test(k) ? Number(k) - 1 : LETTERS.map((l) => l.toLowerCase()).indexOf(k);
    if (!revealed && idx >= 0 && idx < (currentQuestion(s)?.options.length ?? 0)) {
      e.preventDefault();
      choose(idx);
    } else if (revealed && e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      next();
    }
  };

  function cleanup() {
    clearInterval(timer);
    document.removeEventListener('keydown', onKey);
  }

  if (!s.questions.length) {
    mount(root, h('div.page.page-narrow', {}, h('p', textDir(lang), t.none), h('button.btn.btn-secondary', { type: 'button', onClick: onQuit }, t.back)));
    return () => {};
  }

  mount(
    root,
    h(
      'div.page.page-narrow.quiz-page.quiz-play',
      {},
      h(
        'div.quiz-hud',
        textDir(lang),
        h('div.quiz-hud-row', {}, h('span.eyebrow', {}, title || `${t.modes[mode.id]}${s.topics.length === 1 ? `: ${topicTitle(s.topics[0], lang)}` : ''}`), quitBtn),
        h('div.quiz-hud-row', {}, counter, s.lives != null ? livesEl : null, s.deadline != null ? clockEl : null),
        bar,
      ),
      body,
      live,
    ),
  );
  document.addEventListener('keydown', onKey);
  if (s.deadline != null) {
    timer = setInterval(() => {
      if (isOver(s, Date.now()) && !revealed) return finish();
      if (timeLeft(s, Date.now()) === 0) return finish();
      drawHud();
    }, 250);
  }
  drawQuestion();
  return cleanup;
}

/**
 * Results: score, a per-topic breakdown, and every missed question with its answer, why it is
 * right, and why the chosen option is wrong.
 * @param {HTMLElement} root
 * @param {{ session: any, lang: 'en'|'he', prevBest?: number, daily?: { number: number, first: boolean, streak: number, day: string, results: boolean[], submit: any }|null, onAgain: () => void, onRetryMissed: ((ids: string[]) => void)|null, onBack: () => void }} opts
 * @returns {() => void}
 */
function renderResults(root, { session, lang, prevBest = 0, daily = null, onAgain, onRetryMissed, onBack }) {
  const t = T[lang];
  let boardRank = null;
  let boardStreak = null;
  const sum = quizSummary(session, (id) => topicTitle(id, lang));
  const mode = quizMode(session.mode);
  const answerOf = new Map(session.answers.map((a) => [a.id, a.choice]));
  const newBest = !daily && sum.correct > prevBest && sum.correct > 0;
  const secs = Math.round(sum.ms / 1000);
  const lines = [
    t.accuracy(sum.accuracy),
    t.duration(Math.floor(secs / 60), secs % 60),
    daily ? (daily.first ? t.streak(daily.streak) : t.replay) : newBest ? t.newBest : prevBest ? t.best(prevBest) : null,
  ].filter(Boolean);
  const headline = session.mode === 'survival' ? t.survivalHead(sum.correct) : sum.correct === sum.total && sum.total ? t.clean : sum.accuracy >= 70 ? t.solid : t.again;

  mount(
    root,
    h(
      'div.page.page-narrow.quiz-page.quiz-results',
      textDir(lang),
      h(
        'section.quiz-result-card',
        { 'aria-labelledby': 'quiz-result-title' },
        h('span.eyebrow', {}, daily ? t.dailyTitle(daily.number) : t.results(t.modes[mode.id])),
        h('h1#quiz-result-title', { tabindex: '-1' }, headline),
        h('p.quiz-big', { dir: 'ltr' }, session.mode === 'survival' ? `${sum.correct}` : `${sum.correct} / ${sum.total}`),
        h('ul.quiz-result-facts', {}, lines.map((l) => h('li', {}, l))),
        h(
          'div.quiz-actions',
          {},
          h('button.btn.btn-primary', { type: 'button', onClick: onAgain }, daily ? t.playItAgain : t.playAgain),
          onRetryMissed && sum.missed.length ? h('button.btn.btn-secondary', { type: 'button', onClick: () => onRetryMissed(sum.missed.map((q) => q.id)) }, t.retryMissed(sum.missed.length)) : null,
          h('button.btn.btn-ghost', { type: 'button', onClick: onBack }, daily ? t.moreQuizzes : t.changeSetup),
        ),
        daily ? h('ol.quiz-squares.quiz-squares-lg', { 'aria-hidden': 'true' }, daily.results.map((ok) => h(`li.quiz-square${ok ? '.is-correct' : '.is-wrong'}`))) : null,
        daily ? shareButton({ number: daily.number, results: daily.results, streak: () => boardStreak ?? daily.streak, rank: () => boardRank, lang }) : null,
      ),
      daily
        ? boardBlock({
            day: daily.day,
            lang,
            submit: daily.submit,
            onBoard: (board) => {
              const me = board.daily.find((r) => r.you);
              boardRank = me ? { rank: me.rank, players: board.players } : null;
              boardStreak = board.me?.streak ?? null;
            },
          })
        : null,
      sum.byTopic.length > 1
        ? h(
            'section.quiz-breakdown',
            { 'aria-labelledby': 'quiz-topics-title' },
            h('h2.section-title#quiz-topics-title', {}, t.byTopic),
            h('ul.quiz-topic-scores', {}, sum.byTopic.map((tp) => h('li', {}, h('span.quiz-ts-title', { dir: 'auto' }, tp.title), progressBar(tp.correct, tp.answered), h('span.quiz-ts-score', { dir: 'ltr' }, `${tp.correct} / ${tp.answered}`)))),
          )
        : null,
      sum.missed.length
        ? h(
            'section.quiz-review',
            { 'aria-labelledby': 'quiz-review-title' },
            h('h2.section-title#quiz-review-title', {}, t.reviewMissed(sum.missed.length)),
            h(
              'ol.quiz-review-list',
              {},
              sum.missed.map((q) => {
                const chosen = answerOf.get(q.id);
                return h(
                  'li.quiz-review-item',
                  {},
                  h('div.quiz-q-meta', {}, h('span.tag', { dir: 'auto' }, topicTitle(q.topic, lang))),
                  h('p.quiz-review-q', {}, q.q),
                  q.code ? h('pre.quiz-code', { dir: 'ltr', lang: 'en' }, h('code', {}, q.code)) : null,
                  h('p.quiz-review-line.is-wrong', {}, h('span.quiz-review-label', {}, t.yourAnswer), q.options[chosen] ?? '-'),
                  q.wrong?.[chosen] ? h('p.quiz-why-not', {}, q.wrong[chosen]) : null,
                  h('p.quiz-review-line.is-correct', {}, h('span.quiz-review-label', {}, t.answer), q.options[q.answer]),
                  h('p.quiz-why', {}, q.why),
                );
              }),
            ),
          )
        : null,
      siteFooter(),
    ),
  );
  root.querySelector('#quiz-result-title')?.focus({ preventScroll: true });
  window.scrollTo?.(0, 0);
  return () => {};
}
