/**
 * What a share button sends from each part of the site (owner's request): a title, a line of text
 * written for that button, and the link. Spoiler-free by rule: a problem's name and difficulty, a
 * score or a count, never code, test cases or an answer, so a friend who opens it can still solve it.
 *
 * The link is the item's preview page (`page`, under s/ on the public site, built on deploy by
 * scripts/share/build-share-pages.mjs): link previews in chats read its own title and image, then
 * it forwards the reader to the page itself (`hash`). Previews cannot read anything after a # in
 * an address, so the site's own routes would all show the same card.
 *
 * Pure: no DOM; ui/share.js hands the result to the share sheet or the clipboard.
 */

export const SITE_NAME = 'Leet-For-Berger';

/** @typedef {{ title: string, text: string, page: string, hash: string }} SharePayload */

/**
 * The address a shared item opens: its preview page on the public site.
 * @param {string} page e.g. 's/problem/pair-sum-target.html'
 * @param {string} siteUrl the public site, ending in / (config.js SITE_URL)
 * @returns {string}
 */
export function shareUrl(page, siteUrl) {
  return `${siteUrl.replace(/\/?$/, '/')}${page}`;
}

/**
 * Preview page paths, one per shareable thing (the deploy builds one file for each).
 * @type {{ problem: (id: string) => string, company: (slug: string) => string, map: (level: { topic: string, concept?: string|null, problem?: string|null }) => string, path: string, daily: string, interview: string, battle: string, quiz: string, quizDaily: string, quizBoard: string }}
 */
export const SHARE_PAGES = {
  problem: (id) => `s/problem/${id}.html`,
  company: (slug) => `s/company/${slug}.html`,
  map: ({ topic, concept = null, problem = null }) => `s/map/${[topic, concept, problem].filter(Boolean).join('/')}.html`,
  path: 's/path.html',
  daily: 's/daily.html',
  interview: 's/interview.html',
  battle: 's/battle.html',
  quiz: 's/quiz.html',
  quizDaily: 's/quiz-daily.html',
  quizBoard: 's/quiz-board.html',
};

const HE_LEVEL = { Easy: 'קלה', Medium: 'בינונית', Hard: 'קשה' };
const level = (difficulty, lang) => (lang === 'he' ? HE_LEVEL[difficulty] ?? difficulty : difficulty);

/**
 * A problem, to try.
 * @param {{ id: string, title: string, difficulty: string, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function problemShare({ id, title, difficulty, lang = 'en' }) {
  const text =
    lang === 'he'
      ? `מצליחים לפתור את ${title}? שאלה ${level(difficulty, lang)}, נבדקת על 15 בדיקות ישר בדפדפן.`
      : `Can you solve ${title}? ${article(difficulty)} ${difficulty} one, judged on 15 tests right in the browser.`;
  return { title: `${title} · ${SITE_NAME}`, text, page: SHARE_PAGES.problem(id), hash: `#/problem/${id}` };
}

/**
 * A solve, right after an Accepted submit: the problem and the language, never the code.
 * @param {{ id: string, title: string, difficulty: string, language: string, firstSolve?: boolean, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function solveShare({ id, title, difficulty, language, firstSolve = false, lang = 'en' }) {
  const text =
    lang === 'he'
      ? `${firstSolve ? 'פתרתי עכשיו' : 'פתרתי'} את ${title} (${level(difficulty, lang)}) ב-${language}: עברו 15 מתוך 15 בדיקות. תורך.`
      : `${firstSolve ? 'Just solved' : 'Solved'} ${title} (${difficulty}) in ${language}: 15 of 15 tests passed. Your turn.`;
  return { title: lang === 'he' ? `פתרתי את ${title} · ${SITE_NAME}` : `Solved ${title} · ${SITE_NAME}`, text, page: SHARE_PAGES.problem(id), hash: `#/problem/${id}` };
}

/**
 * A company's practice set, with the sharer's progress on it when there is any.
 * @param {{ slug: string, name: string, onSite: number, solved?: number, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function companyShare({ slug, name, onSite, solved = 0, lang = 'en' }) {
  const he = lang === 'he';
  const text =
    solved > 0
      ? he
        ? `מתכוננים ל-${name}: פתרתי כבר ${solved} מתוך ${onSite} השאלות שהכי נשאלות שם בראיונות.`
        : `Practising for ${name}: ${solved} of its ${onSite} most asked interview problems solved so far.`
      : he
        ? `יש לך ראיון ב-${name}? ${onSite} השאלות שהכי נשאלות שם, מוכנות לתרגול בדפדפן.`
        : `Interviewing at ${name}? Its ${onSite} most asked problems, ready to practise in the browser.`;
  return { title: he ? `שאלות ראיון של ${name} · ${SITE_NAME}` : `${name} interview problems · ${SITE_NAME}`, text, page: SHARE_PAGES.company(slug), hash: `#/companies/${slug}` };
}

/**
 * A place on the Problem Map: a topic, a subtopic in it, or a problem in that.
 * @param {{ level: { topic: string, concept?: string|null, problem?: string|null }, hash: string, name: string, where?: string|null, problems?: number|null, lang?: 'en'|'he' }} p
 *   name: the place's own name; where: what it sits in ("Graphs" for a subtopic, "Graphs, Grid traversal" for a problem)
 * @returns {SharePayload}
 */
export function mapShare({ level: at, hash, name, where = null, problems = null, lang = 'en' }) {
  let text;
  if (lang === 'he') {
    const count = problems ? `, ${problems === 1 ? 'שאלה אחת' : `${problems} שאלות`}` : '';
    text = where ? `${name}, בתוך ${where}${count}, במפת נושאי הראיונות של ${SITE_NAME}.` : `${name}${count}: אפשר לחקור במפת נושאי הראיונות של ${SITE_NAME}.`;
  } else {
    const count = problems ? `, ${problems} ${problems === 1 ? 'problem' : 'problems'}` : '';
    text = where ? `${name}, in ${where}${count}, on the ${SITE_NAME} map of interview topics.` : `${name}${count}: explore it on the ${SITE_NAME} map of interview topics.`;
  }
  return { title: `${name} · ${SITE_NAME} map`, text, page: SHARE_PAGES.map(at), hash };
}

/**
 * Progress along the learning path.
 * @param {{ solved: number, total: number, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function pathShare({ solved, total, lang = 'en' }) {
  const he = lang === 'he';
  const text =
    solved > 0
      ? he
        ? `עברתי ${solved} מתוך ${total} במסלול הלמידה: שאלה אחת לכל דפוס מרכזי בראיונות, לפי הסדר.`
        : `${solved} of ${total} along the learning path: one problem per core interview pattern, in order.`
      : he
        ? `מסלול הלמידה: ${total} שאלות, אחת לכל דפוס מרכזי בראיונות, לפי הסדר שבו הם נבנים זה על זה.`
        : `The learning path: ${total} problems, one per core interview pattern, in the order they build on each other.`;
  return { title: he ? `מסלול הלמידה · ${SITE_NAME}` : `Learning path · ${SITE_NAME}`, text, page: SHARE_PAGES.path, hash: '#/path' };
}

/**
 * Today's daily challenge: its number and problem, whether the sharer solved it, their streak.
 * @param {{ number: number, title: string, solved?: boolean, streak?: number, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function dailyShare({ number, title, solved = false, streak = 0, lang = 'en' }) {
  const he = lang === 'he';
  const done = solved ? (he ? (streak > 1 ? ` פתרתי, ${streak} ימים ברצף.` : ' פתרתי.') : streak > 1 ? ` Solved, ${streak} days in a row.` : ' Solved.') : '';
  return {
    title: he ? `אתגר יומי #${number} · ${SITE_NAME}` : `Daily challenge #${number} · ${SITE_NAME}`,
    text: he ? `אתגר יומי #${number}: ${title}.${done} אותה שאלה לכולם היום, מה איתך?` : `Daily challenge #${number}: ${title}.${done} Same problem for everyone today, can you?`,
    page: SHARE_PAGES.daily,
    hash: '#/daily',
  };
}

/**
 * A finished mock interview or mock OA: the score and how many were solved.
 * @param {{ score: number, band: string, solved: number, total: number, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function interviewShare({ score, band, solved, total, lang = 'en' }) {
  const he = lang === 'he';
  return {
    title: he ? `ראיון מדומה · ${SITE_NAME}` : `Mock interview · ${SITE_NAME}`,
    text: he ? `ראיון מדומה: ${score}/100 (${band}), פתרתי ${solved} מתוך ${total} מול השעון. מי עושה יותר?` : `Mock interview: ${score}/100 (${band}), ${solved} of ${total} solved against the clock. Think you can beat it?`,
    page: SHARE_PAGES.interview,
    hash: '#/modes',
  };
}

/**
 * A finished race against a bot.
 * @param {{ won: boolean, bot: string, title: string, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function battleShare({ won, bot, title, lang = 'en' }) {
  const he = lang === 'he';
  const text = he
    ? won
      ? `ניצחתי את ${bot} במרוץ על ${title}. מי בא למרוץ?`
      : `מרוץ מול ${bot} על ${title}: הפעם הבוט ניצח. בפעם הבאה.`
    : won
      ? `Beat ${bot} in a race on ${title}. Race me?`
      : `Raced ${bot} on ${title}, and ${bot} got there first. Rematch soon.`;
  return { title: he ? `מרוץ · ${SITE_NAME}` : `Battle · ${SITE_NAME}`, text, page: SHARE_PAGES.battle, hash: '#/battle' };
}

/**
 * The quiz, to try: an invitation from the quiz hub.
 * @param {{ lang?: 'en'|'he' }} [p]
 * @returns {SharePayload}
 */
export function quizShare({ lang = 'en' } = {}) {
  const he = lang === 'he';
  return {
    title: he ? `חידון ראיונות · ${SITE_NAME}` : `Interview quiz · ${SITE_NAME}`,
    text: he
      ? 'חידונים אמריקאיים על מה ששואלים בראיונות: OOP, מבני נתונים, מסדי נתונים, מקביליות ועוד. בעברית או באנגלית, חמש דקות מהטלפון.'
      : 'Multiple-choice quizzes on what interviews test: OOP, data structures, databases, concurrency and more. In English or Hebrew, five minutes on a phone.',
    page: SHARE_PAGES.quiz,
    hash: '#/quiz',
  };
}

const QUIZ_MODE_NAME = { en: { practice: 'Practice', sprint: 'Sprint', survival: 'Survival' }, he: { practice: 'תרגול', sprint: 'ספרינט', survival: 'הישרדות' } };

/**
 * A finished free-play quiz: the mode, the score and, for a one-topic round, the topic. Never a
 * question or an answer.
 * @param {{ mode: string, correct: number, total: number, topic?: string|null, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function quizResultShare({ mode, correct, total, topic = null, lang = 'en' }) {
  const he = lang === 'he';
  const name = QUIZ_MODE_NAME[he ? 'he' : 'en'][mode] ?? QUIZ_MODE_NAME[he ? 'he' : 'en'].practice;
  const on = topic ? (he ? ` בנושא ${topic}` : ` on ${topic}`) : '';
  let text;
  if (mode === 'survival') {
    text = he ? `חידון הישרדות${on}: ${correct} תשובות נכונות לפני הטעות השלישית. מי מגיע רחוק יותר?` : `Survival quiz${on}: ${correct} right before the third miss. Can you go further?`;
  } else {
    text = he ? `חידון ${name}${on}: ${correct}/${total} נכונות. מי עושה יותר?` : `${name} quiz${on}: ${correct}/${total} correct. Think you can beat it?`;
  }
  return { title: he ? `חידון ראיונות · ${SITE_NAME}` : `Interview quiz · ${SITE_NAME}`, text, page: SHARE_PAGES.quiz, hash: '#/quiz' };
}

/**
 * Today's daily quiz, to play: an invitation, before or without a result. A finished daily quiz
 * shares its squares instead (data/quiz-share.js), with the same link.
 * @param {{ number: number, size?: number, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function quizDailyShare({ number, size = 5, lang = 'en' }) {
  const he = lang === 'he';
  return {
    title: he ? `חידון יומי #${number} · ${SITE_NAME}` : `Daily quiz #${number} · ${SITE_NAME}`,
    text: he ? `חידון יומי #${number}: ${size} שאלות, אותן שאלות לכולם היום. מה איתך?` : `Daily quiz #${number}: ${size} questions, the same for everyone today. How many can you get?`,
    page: SHARE_PAGES.quizDaily,
    hash: '#/quiz/daily',
  };
}

/**
 * The daily quiz leaderboard: the sharer's place on it today when they have one, else the board.
 * @param {{ number: number, rank?: number|null, players?: number|null, size?: number, lang?: 'en'|'he' }} p
 * @returns {SharePayload}
 */
export function quizBoardShare({ number, rank = null, players = null, size = 5, lang = 'en' }) {
  const he = lang === 'he';
  let text;
  if (rank && players) {
    text = he ? `מקום ${rank} מתוך ${players} בטבלת המובילים של חידון יומי #${number}. מי עוקף אותי?` : `#${rank} of ${players} on the daily quiz #${number} leaderboard. Think you can beat it?`;
  } else {
    const played = players ? (he ? `: ${players} שיחקו היום` : `: ${players} played today`) : '';
    text = he ? `טבלת המובילים של חידון יומי #${number}${played}. אותן ${size} שאלות לכולם, ורק המשחק הראשון נספר. מצטרפים?` : `Daily quiz #${number} leaderboard${played}. The same ${size} questions for everyone, only the first play counts. Join in?`;
  }
  return { title: he ? `טבלת המובילים · ${SITE_NAME}` : `Quiz leaderboard · ${SITE_NAME}`, text, page: SHARE_PAGES.quizBoard, hash: '#/quiz/board' };
}

/**
 * The language a share is written in: the reader's own (the language they chose for the quiz, or
 * their browser's), Hebrew or English.
 * @param {{ stored?: string|null, languages?: readonly string[] }} p
 * @returns {'en'|'he'}
 */
export function shareLanguage({ stored = null, languages = [] } = {}) {
  if (stored === 'he' || stored === 'en') return stored;
  return /^(he|iw)\b/i.test(languages[0] ?? '') ? 'he' : 'en';
}

/** "An Easy", "A Medium", "A Hard". */
function article(word) {
  return /^[aeiou]/i.test(word) ? 'An' : 'A';
}
