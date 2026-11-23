/**
 * Quiz (#/quiz, #/quiz/daily): multiple-choice questions on interview concepts, built for a
 * phone and a few spare minutes. The hub picks how to play and which topics; the same play
 * screen runs free play and the daily quiz. Session rules live in modes/quiz.js (pure); this
 * file only draws them and saves the result.
 */
import { h, mount, segmented, progressBar, siteFooter, confirmDialog } from '../dom.js';
import { QUIZ_TOPICS, QUIZ_QUESTIONS } from '../../data/quiz-bank.js';
import { QUIZ_MODES, DAILY_QUIZ_SIZE, dailyQuizNumber, quizMode, startQuiz, startDailyQuiz, currentQuestion, answerQuestion, showNext, endQuiz, isOver, timeLeft, quizSummary } from '../../modes/quiz.js';
import { loadQuizProgress, saveQuizProgress, recordSession, masteredIds, topicProgress, dailyQuizStreak } from '../../state/quiz-progress.js';
import { dayKey } from '../../state/progress.js';
import { msUntilNextDaily, formatCountdown } from '../../data/daily.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const LEVEL_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const topicTitle = (id) => QUIZ_TOPICS.find((t) => t.id === id)?.title ?? id;

/** "1:05" for a sprint clock. */
function clock(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The last hub setup, so "Play again" and coming back keep the player's choice (in memory only). */
let lastSetup = { mode: 'practice', topics: [] };

/**
 * Quiz hub: daily quiz, how to play, topic picker, start.
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function renderQuizHub(root) {
  let stopPlay = () => {};
  let setup = { mode: lastSetup.mode, topics: [...lastSetup.topics] };

  function renderSetup() {
    stopPlay();
    const progress = loadQuizProgress();
    const perTopic = topicProgress(progress, QUIZ_QUESTIONS);
    const today = dayKey(new Date());
    const todayResult = progress.daily[today];
    const quizStreak = dailyQuizStreak(progress, new Date());

    const pool = () => QUIZ_QUESTIONS.filter((q) => !setup.topics.length || setup.topics.includes(q.topic)).length;
    const scopeLine = h('p.quiz-scope', { 'aria-live': 'polite' });
    const modeNote = h('p.hint-text.quiz-mode-note');
    const sync = () => {
      const n = setup.topics.length;
      scopeLine.textContent = n ? `${n} topic${n === 1 ? '' : 's'}, ${pool()} questions` : `All ${QUIZ_TOPICS.length} topics mixed, ${QUIZ_QUESTIONS.length} questions`;
      modeNote.textContent = quizMode(setup.mode).note;
      allBtn.setAttribute('aria-pressed', String(n === 0));
      topicBtns.forEach((b) => b.setAttribute('aria-pressed', String(setup.topics.includes(b.dataset.topic))));
    };

    const allBtn = h('button.chip.quiz-all', { type: 'button', 'aria-pressed': 'true', onClick: () => { setup.topics = []; sync(); } }, 'All topics');
    const topicBtns = QUIZ_TOPICS.map((t) => {
      const p = perTopic.get(t.id) ?? { total: 0, known: 0 };
      return h(
        'button.quiz-topic',
        {
          type: 'button',
          'data-topic': t.id,
          'aria-pressed': 'false',
          onClick: () => {
            setup.topics = setup.topics.includes(t.id) ? setup.topics.filter((x) => x !== t.id) : [...setup.topics, t.id];
            sync();
          },
        },
        h('span.quiz-topic-title', {}, t.title),
        h('span.quiz-topic-blurb', {}, t.blurb),
        h('span.quiz-topic-meta', {}, progressBar(p.known, p.total), h('span', {}, `${p.known} / ${p.total} known`)),
      );
    });

    const start = () => {
      lastSetup = { mode: setup.mode, topics: [...setup.topics] };
      play(startQuiz({ bank: QUIZ_QUESTIONS, mode: setup.mode, topics: setup.topics, seed: Date.now() >>> 0, now: Date.now(), mastered: masteredIds(loadQuizProgress()) }));
    };

    const dailyCard = h(
      'section.quiz-daily',
      { 'aria-labelledby': 'quiz-daily-title' },
      h('div.quiz-daily-copy', {}, h('span.eyebrow', {}, `Quiz No. ${dailyQuizNumber(today)}`), h('h2#quiz-daily-title', {}, 'Daily quiz'), h('p.hint-text', {}, todayResult ? `Done today: ${todayResult.correct} / ${todayResult.total}. A new one in ${formatCountdown(msUntilNextDaily(new Date()))}.` : `${DAILY_QUIZ_SIZE} questions from ${DAILY_QUIZ_SIZE} topics, the same for everyone today.`)),
      h('div.quiz-daily-side', {}, quizStreak ? h('span.quiz-streak', {}, `${quizStreak}-day quiz streak`) : null, h(`a.btn${todayResult ? '.btn-secondary' : '.btn-primary'}`, { href: '#/quiz/daily' }, todayResult ? 'See today\'s result' : 'Play today\'s quiz')),
    );

    mount(
      root,
      h(
        'div.page.quiz-page',
        {},
        h('header.page-head', {}, h('div', {}, h('span.eyebrow', {}, 'Five spare minutes'), h('h1', {}, 'Quiz'), h('p.page-sub', {}, 'Multiple-choice questions on the ideas interviews test: OOP, design patterns, databases, networking, system design and more. No editor needed, so it works on a phone.'))),
        dailyCard,
        h(
          'section.quiz-setup',
          { 'aria-labelledby': 'quiz-setup-title' },
          h('h2.section-title#quiz-setup-title', {}, 'Free play'),
          h('div.quiz-field', {}, h('span.quiz-label', { id: 'quiz-mode-label' }, 'How to play'), segmented({ label: 'How to play', options: QUIZ_MODES.map((m) => ({ value: m.id, label: m.label })), value: setup.mode, onChange: (v) => { setup.mode = v; sync(); } }), modeNote),
          h('div.quiz-field', {}, h('div.quiz-topics-head', {}, h('span.quiz-label', {}, 'Topics'), allBtn), h('div.quiz-topic-grid', { role: 'group', 'aria-label': 'Topics, pick one or more' }, topicBtns)),
          h('div.quiz-start', {}, scopeLine, h(`button.btn${todayResult ? '.btn-primary' : '.btn-secondary'}.quiz-start-btn`, { type: 'button', onClick: start }, 'Start quiz')),
        ),
        siteFooter(),
      ),
    );
    sync();
  }

  function play(session) {
    stopPlay = renderPlay(root, {
      session,
      onDone: (finished) => {
        const before = loadQuizProgress();
        saveQuizProgress(recordSession(before, finished));
        stopPlay = renderResults(root, { session: finished, prevBest: before.best[finished.mode] ?? 0, onAgain: () => play(startQuiz({ bank: QUIZ_QUESTIONS, mode: finished.mode, topics: finished.topics, seed: Date.now() >>> 0, now: Date.now(), mastered: masteredIds(loadQuizProgress()) })), onRetryMissed: (ids) => play(startQuiz({ bank: QUIZ_QUESTIONS, mode: 'practice', only: ids, seed: Date.now() >>> 0, now: Date.now() })), onBack: renderSetup });
      },
      onQuit: renderSetup,
    });
  }

  renderSetup();
  return () => stopPlay();
}

/**
 * Today's daily quiz. Played once for the record; once done, the page shows the result and can
 * replay it for practice without changing it.
 * @param {HTMLElement} root
 * @returns {() => void} cleanup
 */
export function renderDailyQuiz(root) {
  let stop = () => {};
  const today = dayKey(new Date());
  const number = dailyQuizNumber(today);

  function begin() {
    stop();
    stop = renderPlay(root, {
      session: startDailyQuiz({ bank: QUIZ_QUESTIONS, day: today, now: Date.now() }),
      title: `Daily quiz No. ${number}`,
      onDone: (finished) => {
        const before = loadQuizProgress();
        const first = !before.daily[today];
        saveQuizProgress(recordSession(before, finished));
        stop = renderResults(root, { session: finished, daily: { number, first, streak: dailyQuizStreak(loadQuizProgress(), new Date()) }, onAgain: begin, onRetryMissed: null, onBack: () => (location.hash = '#/quiz') });
      },
      onQuit: () => (location.hash = '#/quiz'),
    });
  }

  const done = loadQuizProgress().daily[today];
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
          h('p.hint-text', {}, `A new quiz in ${formatCountdown(msUntilNextDaily(new Date()))}. Replaying today's does not change your score.`),
          h('div.quiz-actions', {}, h('button.btn.btn-secondary', { type: 'button', onClick: begin }, 'Play it again'), h('a.btn.btn-ghost', { href: '#/quiz' }, 'More quizzes')),
        ),
        siteFooter(),
      ),
    );
  }
  return () => stop();
}

/**
 * The play screen. Draws one question at a time; answering reveals the right option and the
 * explanation, then Next (or Enter) moves on.
 * @param {HTMLElement} root
 * @param {{ session: import('../../modes/quiz.js').QuizSession, title?: string, onDone: (s: any) => void, onQuit: () => void }} opts
 * @returns {() => void} cleanup
 */
function renderPlay(root, { session, title = '', onDone, onQuit }) {
  let s = session;
  let revealed = false;
  let finished = false;
  let timer = 0;
  const mode = quizMode(s.mode);

  const counter = h('span.quiz-counter');
  const clockEl = h('span.quiz-clock', { role: 'timer', 'aria-label': 'Time left' });
  const livesEl = h('span.quiz-lives');
  const bar = h('div.quiz-bar', { 'aria-hidden': 'true' }, h('span.quiz-bar-fill'));
  const body = h('div.quiz-body');
  const live = h('p.sr-only', { 'aria-live': 'assertive' });
  const quitBtn = h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: () => quit() }, 'Leave');

  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    onDone(endQuiz(s, Date.now()));
  };

  const quit = async () => {
    if (!s.answers.length) return (cleanup(), onQuit());
    const ok = await confirmDialog({ title: 'End the quiz?', body: 'Your answers so far are scored and saved.', confirmLabel: 'End quiz' });
    if (ok) finish();
  };

  function drawHud() {
    // Leaving before any answer saves nothing; after one, ending scores the session.
    quitBtn.textContent = s.answers.length ? 'End' : 'Leave';
    const n = s.answers.length + (revealed ? 0 : 1);
    counter.textContent = mode.count == null ? `Question ${Math.max(1, n)}` : `Question ${Math.min(n, s.questions.length)} of ${s.questions.length}`;
    bar.firstChild.style.width = `${(s.answers.length / Math.max(1, s.questions.length)) * 100}%`;
    bar.hidden = mode.count == null;
    if (s.lives != null) {
      mount(livesEl, Array.from({ length: mode.lives }, (_, i) => h(`span.quiz-life${i < s.lives ? '.is-on' : ''}`, { 'aria-hidden': 'true' })), h('span.sr-only', {}, `${s.lives} of ${mode.lives} lives left`));
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
        { 'aria-labelledby': 'quiz-q' },
        h('div.quiz-q-meta', {}, h('span.tag', {}, topicTitle(q.topic)), h('span.quiz-level', {}, LEVEL_LABEL[q.level] ?? q.level)),
        h('h2.quiz-q#quiz-q', { tabindex: '-1' }, q.q),
        q.code ? h('pre.quiz-code', {}, h('code', {}, q.code)) : null,
        h('ol.quiz-options', { 'aria-label': 'Answers' }, optionBtns),
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
    const nextBtn = h('button.btn.btn-primary.quiz-next', { type: 'button', onClick: next }, over ? 'See results' : 'Next');
    mount(
      body.querySelector('.quiz-feedback'),
      h(`p.quiz-verdict${correct ? '.is-correct' : '.is-wrong'}#quiz-verdict`, {}, correct ? 'Correct.' : `Not quite. The answer is ${LETTERS[q.answer]}.`),
      h('p.quiz-why', {}, q.why),
      nextBtn,
    );
    live.textContent = correct ? 'Correct.' : `Not quite. The answer is ${LETTERS[q.answer]}: ${q.options[q.answer]}`;
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

  mount(
    root,
    h(
      'div.page.page-narrow.quiz-page.quiz-play',
      {},
      h(
        'div.quiz-hud',
        {},
        h('div.quiz-hud-row', {}, h('span.eyebrow', {}, title || `${mode.label}${s.topics.length === 1 ? `: ${topicTitle(s.topics[0])}` : ''}`), quitBtn),
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
  if (!s.questions.length) {
    finished = true;
    cleanup();
    mount(root, h('div.page.page-narrow', {}, h('p', {}, 'No questions match this choice.'), h('button.btn.btn-secondary', { type: 'button', onClick: onQuit }, 'Back')));
    return () => {};
  }
  drawQuestion();
  return cleanup;
}

/**
 * Results: score, a per-topic breakdown, and every missed question with its answer and why.
 * @param {HTMLElement} root
 * @param {{ session: any, prevBest?: number, daily?: { number: number, first: boolean, streak: number }|null, onAgain: () => void, onRetryMissed: ((ids: string[]) => void)|null, onBack: () => void }} opts
 * @returns {() => void}
 */
function renderResults(root, { session, prevBest = 0, daily = null, onAgain, onRetryMissed, onBack }) {
  const sum = quizSummary(session, QUIZ_TOPICS);
  const mode = quizMode(session.mode);
  const answerOf = new Map(session.answers.map((a) => [a.id, a.choice]));
  const newBest = !daily && sum.correct > prevBest && sum.correct > 0;
  const secs = Math.round(sum.ms / 1000);
  const lines = [
    `${sum.accuracy}% correct`,
    `${Math.floor(secs / 60)} min ${secs % 60} s`,
    daily ? (daily.first ? `${daily.streak}-day quiz streak` : 'Practice replay, your first score stands') : newBest ? 'New best for this mode' : prevBest ? `Best: ${prevBest}` : null,
  ].filter(Boolean);
  const headline = session.mode === 'survival' ? `${sum.correct} right before the third miss` : sum.correct === sum.total && sum.total ? 'A clean sheet.' : sum.accuracy >= 70 ? 'Solid.' : 'Worth another round.';

  mount(
    root,
    h(
      'div.page.page-narrow.quiz-page.quiz-results',
      {},
      h(
        'section.quiz-result-card',
        { 'aria-labelledby': 'quiz-result-title' },
        h('span.eyebrow', {}, daily ? `Daily quiz No. ${daily.number}` : `${mode.label} results`),
        h('h1#quiz-result-title', { tabindex: '-1' }, headline),
        h('p.quiz-big', {}, session.mode === 'survival' ? `${sum.correct}` : `${sum.correct} / ${sum.total}`),
        h('ul.quiz-result-facts', {}, lines.map((l) => h('li', {}, l))),
        h(
          'div.quiz-actions',
          {},
          h('button.btn.btn-primary', { type: 'button', onClick: onAgain }, daily ? 'Play it again' : 'Play again'),
          onRetryMissed && sum.missed.length ? h('button.btn.btn-secondary', { type: 'button', onClick: () => onRetryMissed(sum.missed.map((q) => q.id)) }, `Retry the ${sum.missed.length} missed`) : null,
          h('button.btn.btn-ghost', { type: 'button', onClick: onBack }, daily ? 'More quizzes' : 'Change setup'),
        ),
      ),
      sum.byTopic.length > 1
        ? h(
            'section.quiz-breakdown',
            { 'aria-labelledby': 'quiz-topics-title' },
            h('h2.section-title#quiz-topics-title', {}, 'By topic'),
            h('ul.quiz-topic-scores', {}, sum.byTopic.map((t) => h('li', {}, h('span.quiz-ts-title', {}, t.title), progressBar(t.correct, t.answered), h('span.quiz-ts-score', {}, `${t.correct} / ${t.answered}`)))),
          )
        : null,
      sum.missed.length
        ? h(
            'section.quiz-review',
            { 'aria-labelledby': 'quiz-review-title' },
            h('h2.section-title#quiz-review-title', {}, `Review the ${sum.missed.length} missed`),
            h(
              'ol.quiz-review-list',
              {},
              sum.missed.map((q) =>
                h(
                  'li.quiz-review-item',
                  {},
                  h('div.quiz-q-meta', {}, h('span.tag', {}, topicTitle(q.topic))),
                  h('p.quiz-review-q', {}, q.q),
                  q.code ? h('pre.quiz-code', {}, h('code', {}, q.code)) : null,
                  h('p.quiz-review-line.is-wrong', {}, h('span.quiz-review-label', {}, 'Your answer: '), q.options[answerOf.get(q.id)] ?? 'none'),
                  h('p.quiz-review-line.is-correct', {}, h('span.quiz-review-label', {}, 'Answer: '), q.options[q.answer]),
                  h('p.quiz-why', {}, q.why),
                ),
              ),
            ),
          )
        : null,
      siteFooter(),
    ),
  );
  root.querySelector('#quiz-result-title')?.focus({ preventScroll: true });
  root.scrollTo?.(0, 0);
  window.scrollTo?.(0, 0);
  return () => {};
}
