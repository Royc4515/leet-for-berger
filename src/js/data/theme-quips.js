/**
 * What the site says when someone switches a theme (owner's request, lines approved by the owner):
 * a tease for going light, a nod for going dark, a line per code theme. The lines rotate at random
 * and never repeat back to back. Shown as a toast by ui/theme-quips.js; only for a switch the user
 * made, never inside a session.
 *
 * Pure: no DOM; randomness comes in as `random`.
 */

/** Dark to light: teases, and offers the way back. */
const TO_LIGHT = [
  'Light mode. Your retinas just filed a bug report.',
  'Light mode? Who hurt you.',
  'Light mode on. Somewhere a senior dev felt a disturbance.',
];

/** Light to dark: approves. */
const TO_DARK = [
  'Dark mode. Now you look like you know what a segfault is.',
  "Welcome back to the dark side. We don't have cookies, we have caffeine.",
  'Dark mode restored. Your eyes forgive you. Your code is still on probation.',
];

/** The site theme left to the device. */
const SYSTEM = ['Letting the OS decide. Very senior of you.'];

/**
 * One list per code theme id (data/themes.js CODE_THEMES), and `site` for Match site.
 * The pink theme's lines honour the women who built the field (owner's request).
 */
const CODE = {
  'shuvat-light-pink': [
    'Pink editor. Grace Hopper found the first computer bug. An actual moth. Go find yours.',
    "Shuvat Light Pink. Margaret Hamilton's code landed Apollo on the moon. Yours just has to pass 15 tests.",
    'Pink. Ada Lovelace wrote algorithms before computers existed. You have a computer. No excuses.',
  ],
  terminal: ['Green on black. Hacking like a Berger mode activated: you now type 30% faster. Source: every hacker movie.'],
  'high-contrast': ['High Contrast. Every missing semicolon now visible from orbit.'],
  midnight: ['Midnight Berger. 2 a.m. energy, any hour you like.'],
  'mint-light': ['Berger Mint. Fresh code. Still needs tests.'],
  'berger-light': ['Berger Light. Like a diet burger: technically the same, spiritually lacking.', 'Berger Light. A light editor. HR has been notified.'],
  'dark-berger': [
    'Dark Berger. Well done, the only way to serve it.',
    "Dark Berger. The house special. Chef's kiss.",
    'Dark Berger. Medium rare is for steaks. Your theme is well done.',
    'Dark Berger. How a real Berger cooks: well done. Codes like a senior, ships like one too.',
  ],
  site: ['Match site. Consistency. Your future code reviewer approves.'],
};

/** Every line, by where it is used: for tests and docs. */
export const THEME_QUIPS = Object.freeze({ toLight: TO_LIGHT, toDark: TO_DARK, system: SYSTEM, code: CODE });

/**
 * The same lines in Hebrew, each approved by the owner (2026-11-26). Mode and theme names stay in
 * English inside them (owner's request), as the switches show them.
 */
export const THEME_QUIPS_HE = Object.freeze({
  toLight: ['Light mode. העיניים שלך דיווחו על באג.', 'Light mode? מי פגע בך?', 'Light mode הופעל. איפשהו בעולם מתכנת senior הרגיש שיש באג במציאות.'],
  toDark: ['Dark mode. עכשיו אתה נראה כמו מישהו שיודע מה זה segfault.', 'ברוכים השבים לצד האפל. אין לנו cookies, יש קפה.', 'Dark mode חזר. העיניים יצטרכו תיקון, ובטח גם הקוד שלך.'],
  system: ['נותנים למערכת להחליט. זה מהלך של מתכנת senior.'],
  code: {
    'shuvat-light-pink': [
      'עורך ורוד. גרייס הופר מצאה את הבאג הראשון במחשב. באג אמיתי. עכשיו תורך.',
      'Shuvat Light Pink. הקוד של מרגרט המילטון הנחית את אפולו על הירח. שלך צריך לעבור רק 15 בדיקות.',
      'ורוד. עדה לאבלייס כתבה אלגוריתמים לפני שהיו מחשבים. לך יש מחשב. אין תירוצים.',
    ],
    terminal: ['ירוק על שחור. מצב האקר ברגר הופעל: מעכשיו מקלידים 30% יותר מהר. מקור: כל סרט סייבר.'],
    'high-contrast': ['High Contrast. כל נקודה-פסיק חסרה נראית עכשיו מהחלל.'],
    midnight: ['Midnight Berger. אנרגיה של 2 בלילה, בכל שעה.'],
    'mint-light': ['Berger Mint. קוד רענן. עדיין צריך בדיקות.'],
    'berger-light': ['Berger Light. כמו המבורגר דיאט: טכנית אותו דבר, רוחנית חסר.', 'Berger Light. עורך בהיר. משאבי אנוש עודכנו.'],
    'dark-berger': [
      'Dark Berger. עשוי היטב, הדרך היחידה להגיש אותו.',
      'Dark Berger. מנת הבית. נשיקת שף.',
      'Dark Berger. מדיום רייר זה לסטייקים. הערכה שלך עשויה היטב.',
      'Dark Berger. ככה ברגר אמיתי מכין: עשוי היטב. כותב כמו senior, משחרר כמו senior.',
    ],
    site: ['Match site. עקביות. ה-code reviewer העתידי שלך מאשר.'],
  },
});

/**
 * Picks a line from a list at random, never `last` again when there is another.
 * @param {string[]} lines
 * @param {() => number} random in [0, 1)
 * @param {string} [last] the line shown last time
 * @returns {string}
 */
export function pickLine(lines, random, last) {
  const pool = lines.length > 1 ? lines.filter((l) => l !== last) : lines;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/**
 * The quip for a theme switch, or null when there is nothing to say (nothing changed on screen).
 * Site: `from` is the theme on screen before ('dark' | 'light'), `to` the choice made
 * ('dark' | 'light' | 'system'). Code: `from` and `to` are code theme choices (`site` = Match site).
 * @param {{ kind: 'site'|'code', from: string, to: string }} change
 * @param {() => number} random in [0, 1)
 * @param {string} [last] the line shown last time, so it does not come twice in a row
 * @param {'en'|'he'} [lang] the site language: the Hebrew lines on the Hebrew site
 * @returns {{ text: string, undo?: { label: string, value: string } } | null}
 */
export function themeQuip({ kind, from, to }, random, last, lang = 'en') {
  const Q = lang === 'he' ? THEME_QUIPS_HE : THEME_QUIPS;
  if (kind === 'code') {
    const lines = from === to ? null : Q.code[to];
    return lines ? { text: pickLine(lines, random, last) } : null;
  }
  if (to === 'system') return { text: pickLine(Q.system, random, last) };
  if (from === to) return null;
  if (to === 'light') return { text: pickLine(Q.toLight, random, last), undo: { label: lang === 'he' ? 'חזרה ל-Dark mode' : 'Back to dark', value: 'dark' } };
  if (to === 'dark') return { text: pickLine(Q.toDark, random, last) };
  return null;
}
