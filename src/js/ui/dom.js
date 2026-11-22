/**
 * Minimal DOM helpers. No framework on purpose: zero build step keeps the repo
 * deployable to GitHub Pages as-is and keeps Claude Code edits easy to review.
 */

/**
 * Hyperscript-style element factory. Children that are strings become text nodes,
 * which is the XSS guard: user-controlled strings must never go through innerHTML.
 * @param {string} tag  e.g. 'div.card#id'
 * @param {Record<string, any>} [attrs]
 * @param {...any} children
 */
export function h(tag, attrs = {}, ...children) {
  const [, name = 'div', rest = ''] = tag.match(/^([a-z0-9-]+)?(.*)$/i) ?? [];
  const el = document.createElement(name);
  for (const part of rest.match(/[.#][^.#]+/g) ?? []) {
    if (part[0] === '.') el.classList.add(part.slice(1));
    else el.id = part.slice(1);
  }
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className += ` ${v}`;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** Replace all children of `el`. */
export function mount(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

/** Trusted, author-written HTML only (problem statements). */
export function trustedHtml(tag, html) {
  const el = h(tag);
  el.innerHTML = html;
  return el;
}

let toastHost;
/**
 * @param {string} message
 * @param {'info'|'success'|'warn'|'error'} [kind]
 */
export function toast(message, kind = 'info', ms = 3200) {
  toastHost ??= document.body.appendChild(h('div.toast-host', { role: 'status', 'aria-live': 'polite' }));
  const t = h(`div.toast.toast-${kind}`, {}, message);
  toastHost.append(t);
  setTimeout(() => t.classList.add('leaving'), ms);
  setTimeout(() => t.remove(), ms + 300);
}

let dialogSeq = 0;

/**
 * Accessible confirm dialog using <dialog>. Native confirm() is avoided because it
 * blocks the event loop (and the test-runner watchdog timers with it).
 * @param {{ title: string, body: string, confirmLabel?: string, danger?: boolean }} opts
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, body, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const seq = ++dialogSeq;
    const titleId = `modal-title-${seq}`;
    const bodyId = `modal-body-${seq}`;
    let closed = false;
    const close = (v) => {
      if (closed) return;
      closed = true;
      dlg.close();
      dlg.remove();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      resolve(v);
    };
    const dlg = h(
      'dialog.modal',
      { 'aria-labelledby': titleId, 'aria-describedby': bodyId },
      h(
        'div.modal-card',
        {},
        h('h3', { id: titleId }, title),
        h('p', { id: bodyId }, body),
        h(
          'div.modal-actions',
          {},
          h('button.btn.btn-ghost', { type: 'button', value: 'cancel', onClick: () => close(false) }, 'Cancel'),
          h(`button.btn.${danger ? 'btn-danger' : 'btn-primary'}`, { type: 'button', onClick: () => close(true) }, confirmLabel),
        ),
      ),
    );
    dlg.addEventListener('click', (e) => {
      // Padding lives on .modal-card, so clicks outside the card hit the dialog element itself.
      if (e.target === dlg) close(false);
    });
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close(false);
    });
    document.body.append(dlg);
    dlg.showModal();
  });
}

/**
 * Render a difficulty badge element.
 * @param {string} d
 * @returns {HTMLElement}
 */
export function difficultyBadge(d) {
  return h(`span.badge.diff-${d.toLowerCase()}`, {}, d);
}

/**
 * Shared empty, error, or informational state block with one optional recovery action.
 * @param {{ title?: string, body?: string, kind?: 'empty'|'error', headingTag?: 'h1'|'h2', action?: { label: string, href?: string, onClick?: () => void, variant?: string }|null }} opts
 * @returns {HTMLElement}
 */
export function stateBlock({ title, body, kind = 'empty', headingTag = 'h2', action = null } = {}) {
  const actionEl = !action
    ? null
    : action.href
      ? h(`a.btn.${action.variant ?? 'btn-primary'}`, { href: action.href }, action.label)
      : h(`button.btn.${action.variant ?? 'btn-primary'}`, { type: 'button', onClick: action.onClick }, action.label);
  return h(
    `div.state.state-${kind}`,
    kind === 'error' ? { role: 'alert' } : { role: 'status' },
    title ? h(`${headingTag}.state-title`, {}, title) : null,
    body ? h('p.state-body', {}, body) : null,
    actionEl ? h('div.state-action', {}, actionEl) : null,
  );
}

/**
 * Shared loading state with skeleton rows sized to match real list rows.
 * @param {{ label?: string, rows?: number }} [opts]
 * @returns {HTMLElement}
 */
export function loadingState({ label = 'Loading...', rows = 6 } = {}) {
  const skeletonRows = Array.from({ length: rows }, () =>
    h('div.skeleton-row', { 'aria-hidden': 'true' }, h('span.skeleton-bar.skeleton-title'), h('span.skeleton-bar.skeleton-meta')),
  );
  return h(
    'div.state.state-loading',
    { role: 'status', 'aria-busy': 'true' },
    h('p.sr-only', {}, label),
    h('div.skeleton-list', {}, skeletonRows),
  );
}

/**
 * Shared footer for browse pages with a link to the privacy policy.
 * @returns {HTMLElement}
 */
export function siteFooter() {
  return h(
    'footer.site-links',
    {},
    h('span.site-links-copy', {}, 'Leet-For-Berger'),
    h('span.site-links-sep', { 'aria-hidden': 'true' }, '·'),
    h('a', { href: 'privacy.html' }, 'Privacy Policy'),
  );
}
