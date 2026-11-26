/**
 * Who built the site, and where to reach them (owner's request: a recruiter who lands here should
 * be able to tell who built it). One source for the shared footer, the command palette and the
 * static privacy page (tests/credit.test.js keeps privacy.html in step). Pure: no DOM.
 */

/** The author's name as the credit shows it. */
export const AUTHOR_NAME = 'Roy Carmelli';

// Monochrome marks (24 x 24 path data, Simple Icons, CC0), drawn in currentColor beside the word,
// so they stay as quiet as the footer text and never carry the brand colours.
const LINKEDIN_ICON = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.948 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';
const GITHUB_ICON = 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';

/**
 * The author's links, in the order the credit shows them. The first is the name's own link.
 * Only these three, by the owner's decision: no email, no phone.
 * @type {ReadonlyArray<{ id: string, label: string, title: string, href: string, icon?: string }>}
 */
export const AUTHOR_LINKS = Object.freeze([
  Object.freeze({ id: 'portfolio', label: 'Portfolio', title: `${AUTHOR_NAME}'s portfolio`, href: 'https://roy-carmelli-portfolio.vercel.app/' }),
  Object.freeze({ id: 'linkedin', label: 'LinkedIn', title: `${AUTHOR_NAME} on LinkedIn`, href: 'https://www.linkedin.com/in/roy-carmelli', icon: LINKEDIN_ICON }),
  Object.freeze({ id: 'github', label: 'GitHub', title: `${AUTHOR_NAME} on GitHub`, href: 'https://github.com/Royc4515', icon: GITHUB_ICON }),
]);

/** Attributes every external credit link carries: a new tab that cannot reach back into the site. */
export const EXTERNAL_LINK = Object.freeze({ target: '_blank', rel: 'noopener noreferrer' });

// Hebrew titles for the accessible names and palette labels. The name, LinkedIn and GitHub stay
// in Latin script, so the Hebrew name still holds the words the link shows (WCAG 2.5.3).
const TITLE_HE = Object.freeze({
  portfolio: `תיק העבודות של ${AUTHOR_NAME}`,
  linkedin: `${AUTHOR_NAME} ב-LinkedIn`,
  github: `${AUTHOR_NAME} ב-GitHub`,
});

/** A link's title in the given language. */
const titleIn = (link, lang) => (lang === 'he' && link.id && TITLE_HE[link.id]) || link.title;

/**
 * The accessible name of one credit link: whose it is, where it goes, and that it leaves the tab.
 * It contains the words the link shows (the name, LinkedIn, GitHub), so voice control finds it by
 * what is on screen (WCAG 2.5.3, label in name).
 * @param {{ id?: string, title: string }} link
 * @param {'en'|'he'} [lang]
 * @returns {string}
 */
export function creditLinkName(link, lang = 'en') {
  return lang === 'he' ? `${titleIn(link, lang)} (נפתח בכרטיסייה חדשה)` : `${link.title} (opens in a new tab)`;
}

/**
 * Command palette entries that open the author's links ("About the author"; search: author,
 * built by, contact, portfolio, hire). `open` is injected so this stays pure.
 * @param {(href: string) => void} open
 * @param {'en'|'he'} [lang] Hebrew labels and hints, with Hebrew search words after the English
 * @returns {Array<{ kind: 'link', id: string, label: string, hint: string, keywords: string, run: () => void }>}
 */
export function authorPaletteItems(open, lang = 'en') {
  const he = lang === 'he';
  return AUTHOR_LINKS.map((link, i) => ({
    kind: 'link',
    id: `author-${link.id}`,
    // The portfolio is the name itself, so a search for the name ranks it first.
    label: i === 0 ? AUTHOR_NAME : titleIn(link, lang),
    hint: he ? (i === 0 ? 'תיק עבודות, בנה את האתר' : 'בנה את האתר') : i === 0 ? 'Portfolio, built this site' : 'Built this site',
    // The portfolio answers the general searches first: a match nearer the start of the keywords
    // scores higher, and equal scores would fall back to the label, which puts GitHub first.
    keywords:
      (i === 0 ? 'author built by made by about creator developer contact hire cv resume portfolio' : `${link.id} profile contact author built by made by about creator developer hire cv resume`) +
      (he ? (i === 0 ? ' יוצר מפתח בנה קשר גיוס קורות חיים תיק עבודות אודות' : ' פרופיל יוצר מפתח בנה קשר גיוס קורות חיים אודות') : ''),
    run: () => open(link.href),
  }));
}
