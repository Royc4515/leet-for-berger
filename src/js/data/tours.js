/**
 * Guided tours: every part of the site explains itself the first time it opens (the owner asked
 * for a guide on every page, short and simple). The very first tour a device sees opens with the
 * one-step welcome. The mentor's tour opens with its panel. Content only: the overlay is
 * ui/tour.js, the placement maths data/tour-layout.js, the seen state state/tours.js.
 *
 * A step's `target` lists selectors and the first one on screen wins (the desktop nav and the
 * phone tab bar hold the same links, a phone shows the Results tab instead of the console). No
 * target centres the card. An `optional` step is dropped when none of its targets is on screen,
 * so the step count a tour shows is always the real one.
 */

/**
 * @typedef {{ title: string, body: string }} TourCopy
 * @typedef {{ title: string, body: string, he?: TourCopy, target?: string[], optional?: boolean }} TourStep
 * @typedef {{ id: string, label: string, labelHe?: string, steps: TourStep[], prefix?: boolean, examRoom?: boolean }} Tour
 *   prefix: shown only in front of another tour (the welcome)
 *   examRoom: runs inside the problem screen (stays English on every site language)
 */

/** Bounds every tour keeps: a few glances, one short line each. */
export const TOUR_LIMITS = { minSteps: 2, maxSteps: 4, title: 24, body: 80 };

/** The welcome step's id; devices that saw the first site tour (id `site`) count as welcomed. */
export const WELCOME = 'welcome';
export const WELCOME_ALIASES = ['site'];

/** @type {Record<string, Tour>} */
export const TOURS = {
  welcome: {
    id: 'welcome',
    label: 'Welcome',
    labelHe: 'ברוכים הבאים',
    prefix: true,
    steps: [
      {
        title: 'Every problem is a hex',
        body: 'Green is solved, coral tried, grey not started. Amber is your next step.',
        he: { title: 'כל בעיה היא משושה', body: 'ירוק נפתרה, אלמוג ניסית, אפור עוד לא התחלת. ענבר מסמן את הצעד הבא.' },
      },
    ],
  },
  problems: {
    id: 'problems',
    label: 'Problems',
    labelHe: 'בעיות',
    steps: [
      {
        target: ['.today-daily'],
        title: "Today's problem",
        body: 'One problem a day, the same for everyone.',
        he: { title: 'הבעיה של היום', body: 'בעיה אחת ביום, זהה לכולם.' },
      },
      {
        target: ['.dashboard-filters'],
        title: 'Every problem',
        body: 'Search, or filter by difficulty and topic. Solved ones turn green.',
        he: { title: 'כל הבעיות', body: 'חיפוש או סינון לפי רמת קושי ונושא. בעיות שנפתרו נצבעות בירוק.' },
      },
      {
        target: ['nav.view-switch'],
        title: 'List or map',
        body: 'The same problems, drawn as a map.',
        he: { title: 'רשימה או מפה', body: 'אותן בעיות בדיוק, מוצגות כמפה.' },
      },
      {
        target: ['#palette-trigger'],
        title: 'Find anything',
        body: 'Use search, or press Ctrl K, and type a few letters.',
        he: { title: 'למצוא הכול', body: 'פותחים חיפוש או לוחצים \u2066Ctrl K\u2069 ומקלידים כמה אותיות.' },
      },
    ],
  },
  map: {
    id: 'map',
    label: 'Map',
    labelHe: 'מפה',
    steps: [
      {
        target: ['.map-canvas'],
        title: 'One map',
        body: 'Every topic, subtopic and problem. Scroll or pinch to zoom, drag to move.',
        he: { title: 'מפה אחת', body: 'כל נושא, תת-נושא ובעיה. גלילה או צביטה לזום, גרירה להזזה.' },
      },
      {
        target: ['.map-canvas .district.has-next', '.map-canvas .district'],
        title: 'Fly in',
        body: 'Click a topic to fly closer. Names appear as you get near.',
        he: { title: 'להתקרב', body: 'לחיצה על נושא מתקרבת אליו. השמות מופיעים כשמתקרבים.' },
      },
      {
        target: ['.map-lens'],
        title: 'Colour by',
        body: 'Your progress, difficulty, or what one company asks.',
        he: { title: 'צביעה לפי', body: 'לפי ההתקדמות שלך, רמת הקושי או הבעיות של חברה אחת.' },
      },
      {
        target: ['.map-brief'],
        title: 'Where to go next',
        body: 'The panel always points at your next problem.',
        he: { title: 'לאן ממשיכים', body: 'החלונית תמיד מצביעה על הבעיה הבאה שלך.' },
      },
    ],
  },
  path: {
    id: 'path',
    label: 'Path',
    labelHe: 'מסלול הלמידה',
    steps: [
      {
        target: ['.path-summary'],
        title: 'Your next problem',
        body: 'It stays at the top. One click to start.',
        he: { title: 'הבעיה הבאה שלך', body: 'נשארת למעלה. לחיצה אחת כדי להתחיל.' },
      },
      {
        target: ['.path-here'],
        optional: true,
        title: 'You are here',
        body: 'The topic you are working on now.',
        he: { title: 'אתם כאן', body: 'הנושא שבו נמצאת ההתקדמות הנוכחית.' },
      },
      {
        target: ['.checkpoint'],
        optional: true,
        title: 'Checkpoints',
        body: 'What you can do once a tier is done.',
        he: { title: 'בסוף השלב', body: 'מה כבר יודעים לעשות בסיום כל שלב.' },
      },
    ],
  },
  daily: {
    id: 'daily',
    label: 'Daily',
    labelHe: 'האתגר היומי',
    steps: [
      {
        target: ['.today-daily'],
        title: "Today's problem",
        body: 'New at midnight. Solve it to keep your streak.',
        he: { title: 'הבעיה של היום', body: 'בעיה חדשה בחצות. פותרים אותה כדי לשמור על הרצף.' },
      },
      {
        target: ['.cal-scroll'],
        title: 'Your last 16 weeks',
        body: 'A green hex is a day you solved something.',
        he: { title: '16 השבועות האחרונים', body: 'משושה ירוק מסמן יום שבו נפתרה בעיה.' },
      },
    ],
  },
  companies: {
    id: 'companies',
    label: 'Companies',
    labelHe: 'חברות',
    steps: [
      {
        target: ['.company-filters .segmented', '.page .segmented'],
        title: 'Israel first',
        body: 'Hiring in Israel, the top companies, or all of them.',
        he: { title: 'ישראל תחילה', body: 'חברות שמגייסות בישראל, המובילות או כולן.' },
      },
      {
        target: ['.company-card'],
        title: 'Pick a company',
        body: 'See what it asks. Its hex fills as you solve.',
        he: { title: 'בחירת חברה', body: 'רואים אילו בעיות היא שואלת. המשושה שלה מתמלא עם הפתרונות.' },
      },
    ],
  },
  company: {
    id: 'company',
    label: 'Company',
    labelHe: 'חברה',
    steps: [
      {
        target: ['.company-facts'],
        title: 'At a glance',
        body: 'What you can practice here, and how much you solved.',
        he: { title: 'במבט אחד', body: 'מה אפשר לתרגל כאן וכמה כבר נפתר.' },
      },
      {
        target: ['.company-asks'],
        optional: true,
        title: 'What it asks',
        body: 'Its most asked topics, linked to the map.',
        he: { title: 'מה היא שואלת', body: 'הנושאים הכי נפוצים שלה, עם קישור ישיר למפה.' },
      },
      {
        target: ['.company-table'],
        title: 'Its problems',
        body: 'Most asked first. Practice opens one.',
        he: { title: 'הבעיות שלה', body: 'הנפוצות ביותר בראש. לחיצה על "לתרגל" פותחת בעיה.' },
      },
    ],
  },
  modes: {
    id: 'modes',
    label: 'Modes',
    labelHe: 'אימונים',
    steps: [
      {
        target: ['.mode-card'],
        title: 'Mock OA',
        body: 'A timed exam, like the real thing.',
        he: { title: 'מבחן OA מדומה', body: 'מבחן עם שעון, בדיוק כמו בדבר האמיתי.' },
      },
      {
        target: ['.mode-card:nth-of-type(2)'],
        title: 'Battle',
        body: 'Race a bot on the same problem.',
        he: { title: 'קרב 1 על 1', body: 'מרוץ מול בוט על אותה בעיה.' },
      },
      {
        target: ['.mode-quiz'],
        title: 'Quiz',
        body: 'Multiple choice on interview ideas, in English or Hebrew.',
        he: { title: 'חידון', body: 'שאלות אמריקאיות על רעיונות לראיונות, בעברית או באנגלית.' },
      },
      {
        target: ['.mentor-note'],
        optional: true,
        title: 'AI Mentor',
        body: 'Hints inside every problem, never the answer.',
        he: { title: 'AI Mentor', body: 'רמזים בתוך כל בעיה, אף פעם לא הפתרון.' },
      },
    ],
  },
  quiz: {
    id: 'quiz',
    label: 'Quiz',
    labelHe: 'חידון',
    steps: [
      {
        target: ['.quiz-lang .segmented'],
        title: 'English or Hebrew',
        body: 'Hebrew keeps the technical terms in English, as interviewers say them.',
        he: { title: 'עברית או אנגלית', body: 'בעברית המונחים הטכניים נשארים באנגלית, כמו בראיון.' },
      },
      {
        target: ['.quiz-daily'],
        title: 'Daily quiz',
        body: 'Five questions, the same for everyone today.',
        he: { title: 'החידון היומי', body: 'חמש שאלות, זהות לכולם היום.' },
      },
      {
        target: ['[data-tour="quiz-mode"]'],
        title: 'How to play',
        body: 'Practice, a 2 minute sprint, or survival until three misses.',
        he: { title: 'סוג המשחק', body: 'תרגול, ספרינט של 2 דקות או הישרדות עד שלוש טעויות.' },
      },
      {
        target: ['.quiz-topics-head'],
        title: 'Pick topics',
        body: 'Tap one or a few, or keep All topics for a mix. Then start.',
        he: { title: 'בחירת נושאים', body: 'בוחרים נושא או כמה, או משאירים "כל הנושאים" לערבוב ומתחילים.' },
      },
    ],
  },
  workspace: {
    id: 'workspace',
    label: 'Problem',
    examRoom: true,
    steps: [
      { target: ['#ws-description'], title: 'The problem', body: 'Read it here, with examples and limits.' },
      { target: ['button[data-action="run"]'], title: 'Run, then submit', body: 'Run tries your code. Submit counts it.' },
      { target: ['#ws-results', '#ws-tab-results'], title: '15 tests', body: '5 you can open, 10 hidden. Green means passed.' },
      { target: ['button[data-action="mentor"]'], optional: true, title: 'Stuck?', body: 'Ask the mentor for a hint.' },
    ],
  },
  interview: {
    id: 'interview',
    label: 'Interview',
    labelHe: 'ראיון',
    steps: [
      {
        target: ['[data-tour="oa-format"]'],
        title: 'Pick a length',
        body: '45, 70 or 90 minutes.',
        he: { title: 'בחירת משך', body: '45, 70 או 90 דקות.' },
      },
      {
        target: ['[data-tour="oa-company"]'],
        title: 'Pick a company',
        body: 'Optional. You get the problems it asks.',
        he: { title: 'בחירת חברה', body: 'אופציונלי. מקבלים בעיות שהחברה הזו שואלת.' },
      },
      {
        target: ['[data-tour="oa-start"]'],
        title: 'Like a real exam',
        body: 'The problems show when the clock starts. Hints are off.',
        he: { title: 'כמו מבחן אמיתי', body: 'הבעיות נחשפות כשהשעון מתחיל. הרמזים כבויים.' },
      },
    ],
  },
  battle: {
    id: 'battle',
    label: 'Battle',
    labelHe: 'קרב 1 על 1',
    steps: [
      {
        target: ['[data-tour="battle-opponent"]'],
        title: 'Pick a bot',
        body: 'A faster bot is harder to beat.',
        he: { title: 'בחירת בוט', body: 'בוט מהיר יותר קשה יותר לניצחון.' },
      },
      {
        target: ['[data-tour="battle-problem"]'],
        title: 'Pick a problem',
        body: 'Or press Random.',
        he: { title: 'בחירת בעיה', body: 'או לוחצים על "להגריל".' },
      },
      {
        target: ['[data-tour="battle-start"]'],
        title: 'Race',
        body: 'First to pass all 15 tests wins.',
        he: { title: 'מרוץ', body: 'הגשה ראשונה שעוברת את כל 15 הבדיקות מנצחת.' },
      },
    ],
  },
  mentor: {
    id: 'mentor',
    label: 'Mentor',
    examRoom: true,
    steps: [
      { target: ['.mentor-log'], title: 'Hints, not answers', body: 'The mentor helps you think. It never writes the code.' },
      { target: ['.mentor-compose'], title: 'Ask', body: 'Each message gets the next hint.' },
    ],
  },
};

/** The modes on the Modes hub, each with its own tour, in hub order. */
export const MODE_TOURS = ['interview', 'battle', 'mentor'];

// The route -> tour table lives in data/tour-routes.js: main.js needs it at startup, the copy above
// only when a tour opens (tests/startup-graph.test.js).
export { tourForRoute } from './tour-routes.js';

/**
 * Resolves a tour in the requested language. Exam-room tours (workspace, mentor) always stay
 * English even when `lang === 'he'`. Pure: never reads the DOM or site language.
 * @param {string} id
 * @param {'en'|'he'} [lang]
 * @returns {{ id: string, label: string, lang: 'en'|'he', prefix?: boolean, steps: { title: string, body: string, target?: string[], optional?: boolean }[] }|null}
 */
export function tourCopy(id, lang = 'en') {
  const tour = TOURS[id];
  if (!tour) return null;
  const he = lang === 'he' && !tour.examRoom && Boolean(tour.labelHe);
  return {
    id: tour.id,
    label: he ? tour.labelHe : tour.label,
    lang: he ? 'he' : 'en',
    ...(tour.prefix ? { prefix: true } : {}),
    steps: tour.steps.map((s) => ({
      ...(s.target ? { target: s.target } : {}),
      ...(s.optional ? { optional: true } : {}),
      title: he && s.he ? s.he.title : s.title,
      body: he && s.he ? s.he.body : s.body,
    })),
  };
}

const HEBREW = /[\u0590-\u05FF]/;

function checkCopy(at, copy, problems, requireHebrew = false) {
  if (!copy?.title || !copy?.body) problems.push(`${at}: title and body are required`);
  if ((copy?.title ?? '').length > TOUR_LIMITS.title) problems.push(`${at}: title longer than ${TOUR_LIMITS.title}`);
  if ((copy?.body ?? '').length > TOUR_LIMITS.body) problems.push(`${at}: body longer than ${TOUR_LIMITS.body}`);
  const text = `${copy?.title ?? ''} ${copy?.body ?? ''}`;
  if (text.includes('!')) problems.push(`${at}: no exclamation marks in a tour`);
  if (text.includes('\u2014')) problems.push(`${at}: no em dash, use a regular hyphen or a full stop`);
  if (requireHebrew && !HEBREW.test(copy?.body ?? '')) problems.push(`${at}: Hebrew body must contain Hebrew`);
}

/**
 * Checks a tour against TOUR_LIMITS and the house voice (docs/DESIGN.md: no em dashes, no
 * exclamation marks outside a genuine success), in both English and Hebrew (for non-exam-room
 * tours, or whenever Hebrew fields are present). A prefix tour may be a single step.
 * @param {Tour} tour
 * @returns {string[]} problems, empty when the tour is fine
 */
export function validateTour(tour) {
  const problems = [];
  const n = tour?.steps?.length ?? 0;
  const min = tour?.prefix ? 1 : TOUR_LIMITS.minSteps;
  const hasHe = Boolean(tour?.labelHe) || (tour?.steps ?? []).some((s) => s.he);
  if (!tour?.id || !tour?.label) problems.push('a tour needs an id and a label');
  if (hasHe && (!tour?.labelHe || !HEBREW.test(tour.labelHe))) problems.push(`${tour?.id}: labelHe must contain Hebrew`);
  if (n < min || n > TOUR_LIMITS.maxSteps) problems.push(`${tour?.id}: ${n} steps, keep ${min} to ${TOUR_LIMITS.maxSteps}`);
  for (const [i, s] of (tour?.steps ?? []).entries()) {
    const at = `${tour.id} step ${i + 1}`;
    checkCopy(at, s, problems);
    if (hasHe || s.he) checkCopy(`${at} (he)`, s.he, problems, true);
    if (s.target !== undefined && (!Array.isArray(s.target) || !s.target.every((t) => typeof t === 'string' && t))) problems.push(`${at}: target must be a list of selectors`);
    if (s.optional && !s.target?.length) problems.push(`${at}: an optional step needs a target`);
  }
  return problems;
}
