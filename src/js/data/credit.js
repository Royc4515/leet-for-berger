/**
 * Who built the site, and where to reach them (owner's request: a recruiter who lands here should
 * be able to tell who built it). One source for the shared footer, the command palette and the
 * static privacy page (tests/credit.test.js keeps privacy.html in step). Pure: no DOM.
 */

/** The author's name as the credit shows it. */
export const AUTHOR_NAME = 'Roy Carmelli';

/**
 * The author's links, in the order the credit shows them. The first is the name's own link.
 * Only these three, by the owner's decision: no email, no phone.
 * @type {ReadonlyArray<{ id: string, label: string, title: string, href: string }>}
 */
export const AUTHOR_LINKS = Object.freeze([
  Object.freeze({ id: 'portfolio', label: 'Portfolio', title: `${AUTHOR_NAME}'s portfolio`, href: 'https://roy-carmelli-portfolio.vercel.app/' }),
  Object.freeze({ id: 'linkedin', label: 'LinkedIn', title: `${AUTHOR_NAME} on LinkedIn`, href: 'https://www.linkedin.com/in/roy-carmelli' }),
  Object.freeze({ id: 'github', label: 'GitHub', title: `${AUTHOR_NAME} on GitHub`, href: 'https://github.com/Royc4515' }),
]);

/** Attributes every external credit link carries: a new tab that cannot reach back into the site. */
export const EXTERNAL_LINK = Object.freeze({ target: '_blank', rel: 'noopener noreferrer' });

/**
 * The accessible name of one credit link: whose it is, where it goes, and that it leaves the tab.
 * It contains the words the link shows (the name, LinkedIn, GitHub), so voice control finds it by
 * what is on screen (WCAG 2.5.3, label in name).
 * @param {{ title: string }} link
 * @returns {string}
 */
export function creditLinkName(link) {
  return `${link.title} (opens in a new tab)`;
}

/**
 * Command palette entries that open the author's links ("About the author"; search: author,
 * built by, contact, portfolio, hire). `open` is injected so this stays pure.
 * @param {(href: string) => void} open
 * @returns {Array<{ kind: 'link', id: string, label: string, hint: string, keywords: string, run: () => void }>}
 */
export function authorPaletteItems(open) {
  return AUTHOR_LINKS.map((link) => ({
    kind: 'link',
    id: `author-${link.id}`,
    label: link.title,
    hint: 'Built this site',
    keywords: `about author built by made by creator developer contact hire cv resume ${link.id}`,
    run: () => open(link.href),
  }));
}
