/**
 * The share button used across the site (owner's request): the phone's share sheet where there is
 * one, else the text and the link are copied and a toast says so. What each page sends is built
 * by src/js/data/share.js.
 */
import { h, toast } from './dom.js';
import { shareUrl } from '../data/share.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The share mark: an arrow leaving a tray. Decorative: the button's name says what it does. */
function shareIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 16 16', width: '16', height: '16', 'aria-hidden': 'true', class: 'share-icon' })) svg.setAttribute(k, v);
  const path = document.createElementNS(SVG_NS, 'path');
  for (const [k, v] of Object.entries({ d: 'M8 10V2.5M5 5.5l3-3 3 3M3 8.5v4.5h10V8.5', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) path.setAttribute(k, v);
  svg.append(path);
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

/**
 * A share button. `get` is called on click, so the payload reflects the page as it is then.
 * @param {{ get: () => import('../data/share.js').SharePayload, label?: string, name: string, compact?: boolean }} opts
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
        const p = get();
        shareOrCopy({ title: p.title, text: p.text, url: shareUrl(p.hash, location) });
      },
    },
    shareIcon(),
    compact ? null : h('span', {}, label),
  );
}
