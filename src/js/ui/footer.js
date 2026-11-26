/**
 * The shared footer that closes every browse page (docs/DESIGN.md, screen rule 5), and the author
 * credit at its end. Its own module, not ui/dom.js: dom.js loads at startup, and the footer is only
 * needed once a view renders (tests/startup-graph.test.js, ADR 0008).
 */
import { h, tp, pageLang } from './dom.js';
import { tourForRoute } from '../data/tour-routes.js';
import { AUTHOR_NAME, AUTHOR_LINKS, EXTERNAL_LINK, creditLinkName } from '../data/credit.js';

/**
 * Shared footer for browse pages: the main destinations, a replay of this page's guide, and the
 * privacy policy.
 * @param {{ note?: string }} [opts] note: one extra line (company pages carry the trademark note)
 * @returns {HTMLElement}
 */
export function siteFooter({ note = '' } = {}) {
  return h(
    'footer.site-links',
    {},
    h('span.site-links-brand', {}, h('span.hexmark.solved', { 'aria-hidden': 'true' }), h('span.site-links-copy', {}, 'Leet-For-Berger')),
    h(
      'nav.site-links-nav',
      { 'aria-label': tp('Footer', 'קישורים בתחתית העמוד') },
      h('a', { href: '#/map' }, tp('Map', 'מפה')),
      h('a', { href: '#/daily' }, tp('Daily', 'האתגר היומי')),
      h('a', { href: '#/path' }, tp('Path', 'מסלול')),
      // main.js owns tours (they outlive a view); the footer only asks for one, and only on a page
      // that has one (the profile, the daily quiz and its leaderboard do not: the button did nothing).
      tourForRoute(globalThis.location?.hash ?? '')
        ? h('button.site-links-tour', { type: 'button', 'aria-haspopup': 'dialog', onClick: () => dispatchEvent(new CustomEvent('tour:open', { detail: 'page' })) }, tp('Guide for this page', 'הדרכה לעמוד הזה'))
        : null,
      h('a', { href: 'privacy.html' }, tp('Privacy Policy', 'מדיניות הפרטיות')),
    ),
    siteCredit(),
    note ? h('p.site-links-note', {}, note) : null,
  );
}

/** A credit link's mark: decorative (the word beside it names the link), in the link's colour. */
function creditIcon(d) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'site-links-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'currentColor');
  svg.append(path);
  return svg;
}

/**
 * The author credit at the end of the shared footer (owner's request): "Built by" and the name,
 * which links to the portfolio, then LinkedIn and GitHub. Quiet like the rest of the footer, so it
 * never competes with practice; the footer is absent from the workspace and sessions, and so is
 * this. Each link opens a new tab without an opener (`EXTERNAL_LINK`). privacy.html carries the
 * same markup by hand (tests/credit.test.js).
 * @returns {HTMLElement}
 */
export function siteCredit() {
  const [portfolio, ...rest] = AUTHOR_LINKS;
  const lang = pageLang();
  const link = (l, text) => h('a', { href: l.href, ...EXTERNAL_LINK, 'aria-label': creditLinkName(l, lang), dataset: { credit: l.id } }, l.icon ? creditIcon(l.icon) : null, text);
  return h(
    'div.site-links-credit',
    {},
    h('span', {}, tp('Built by ', 'נבנה על ידי '), link(portfolio, AUTHOR_NAME)),
    // A space between links: the flex gap spaces them on screen, but copied text and reader mode
    // read the text nodes, which would run "Roy CarmelliLinkedInGitHub" together.
    rest.map((l) => [' ', link(l, l.label)]),
  );
}
