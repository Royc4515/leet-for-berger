/**
 * The share button used across the site (owner's request): the phone's share sheet where there is
 * one, else the text and the link are copied and a toast says so. What each page sends is built
 * by src/js/data/share.js.
 */
import { h, toast } from './dom.js';
import { shareUrl, shareLanguage } from '../data/share.js';
import { SITE_URL } from '../config.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const svgEl = (tag, attrs) => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

/**
 * The share mark: three connected nodes, read as "share" on Android and the web (owner's pick
 * over a tray arrow, which also reads as "download"). Decorative: the button's name says what it does.
 */
function shareIcon() {
  const svg = svgEl('svg', { viewBox: '0 0 16 16', width: '16', height: '16', 'aria-hidden': 'true', class: 'share-icon' });
  const line = { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' };
  svg.append(
    svgEl('circle', { cx: '12', cy: '3.5', r: '2', ...line }),
    svgEl('circle', { cx: '4', cy: '8', r: '2', ...line }),
    svgEl('circle', { cx: '12', cy: '12.5', r: '2', ...line }),
    svgEl('path', { d: 'M5.8 7l4.4-2.5M5.8 9l4.4 2.5', ...line }),
  );
  return svg;
}

/**
 * Shares through the share sheet, or copies "text + link" where there is none.
 * @param {{ title: string, text: string, url: string }} data
 * @returns {Promise<'shared'|'copied'|'cancelled'|'failed'>}
 */
export async function shareOrCopy({ title, text, url }) {
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ title, text, url }))) {
      await navigator.share({ title, text, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    toast('Link copied. Paste it anywhere.', 'success');
    return 'copied';
  } catch (err) {
    // Closing the share sheet is not a failure.
    if (err?.name === 'AbortError') return 'cancelled';
    toast('Could not share. Copy the address from the address bar instead.', 'error');
    return 'failed';
  }
}

/** The reader's language for share texts: their quiz language if they chose one, else the browser's. */
function readerLanguage() {
  let stored = null;
  try {
    stored = localStorage.getItem('lfb:quiz-lang');
  } catch {
    // Storage can be off (private mode): the browser's language decides.
  }
  return shareLanguage({ stored, languages: navigator.languages ?? [navigator.language] });
}

/**
 * A share button. `get` is called on click with the reader's language, so the payload reflects
 * the page as it is then.
 * @param {{ get: (lang: 'en'|'he') => import('../data/share.js').SharePayload, label?: string, name: string, compact?: boolean }} opts
 *   label: visible text ("Share"); name: what is shared, for its accessible name ("Share this problem")
 * @returns {HTMLButtonElement}
 */
export function shareButton({ get, label = 'Share', name, compact = false }) {
  return h(
    `button.btn.btn-secondary.btn-sm.share-btn${compact ? '.btn-icon' : ''}`,
    {
      type: 'button',
      'aria-label': name,
      title: name,
      onClick: () => {
        const p = get(readerLanguage());
        shareOrCopy({ title: p.title, text: p.text, url: shareUrl(p.page, SITE_URL) });
      },
    },
    shareIcon(),
    compact ? null : h('span', {}, label),
  );
}
