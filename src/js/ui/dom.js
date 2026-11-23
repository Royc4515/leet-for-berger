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
    else if (k === 'style' && typeof v === 'object') for (const [prop, val] of Object.entries(v)) prop.startsWith('--') ? el.style.setProperty(prop, val) : (el.style[prop] = val);
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
 * Difficulty label: a dot plus the word in the semantic colour (docs/DESIGN.md), the same in
 * tables, pickers and headers. The word carries the meaning; the colour only reinforces it.
 * @param {string} d  'Easy' | 'Medium' | 'Hard'
 * @returns {HTMLElement}
 */
export function difficulty(d) {
  return h(`span.difficulty.diff-${d.toLowerCase()}`, {}, d);
}

/**
 * Compact "IL" mark beside an Israeli company's name. aria-label on a plain span is not exposed
 * by assistive tech (ARIA 1.2 forbids naming generic elements), so the meaning is real text.
 * @returns {HTMLElement}
 */
export function ilMark() {
  return h('span.il-mark', { title: 'Israeli company' }, h('span', { 'aria-hidden': 'true' }, 'IL'), h('span.sr-only', {}, ' (Israeli company)'));
}

/**
 * One filter chip: a real button whose selected state is `aria-pressed` (the CSS adds a check
 * mark, so selection is never colour alone).
 * @param {{ label: any, pressed?: boolean, onClick?: (e: MouseEvent) => void, attrs?: Record<string, any>, className?: string }} opts
 * @returns {HTMLButtonElement}
 */
export function chip({ label, pressed = false, onClick, attrs = {}, className = '' }) {
  return h(`button.chip${className}`, { ...attrs, type: 'button', 'aria-pressed': String(pressed), onClick }, label);
}

/**
 * A labelled group of chips where exactly one is selected. Keeps `aria-pressed` in sync and
 * calls `onChange` with the option's value. Options can carry extra attributes (data-*).
 * @param {{ label: string, options: Array<{ value: string, label: any, attrs?: Record<string, any> }>, value: string, onChange: (value: string) => void }} opts
 * @returns {HTMLElement}
 */
export function chipGroup({ label, options, value, onChange }) {
  const group = h('div.chip-group', { role: 'group', 'aria-label': label });
  const buttons = options.map((o) =>
    chip({
      label: o.label,
      pressed: o.value === value,
      attrs: o.attrs,
      onClick: () => {
        buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i].value === o.value)));
        onChange(o.value);
      },
    }),
  );
  group.append(...buttons);
  return group;
}

/**
 * Segmented control: one of several views of the same data (a scope, not a filter). Real
 * buttons with `aria-pressed` inside a labelled group.
 * @param {{ label: string, options: Array<{ value: string, label: string }>, value: string, onChange: (value: string) => void }} opts
 * @returns {HTMLElement}
 */
export function segmented({ label, options, value, onChange }) {
  const group = h('div.segmented', { role: 'group', 'aria-label': label });
  const buttons = options.map((o) =>
    h(
      'button.segmented-btn',
      {
        type: 'button',
        'data-value': o.value,
        'aria-pressed': String(o.value === value),
        onClick: () => {
          buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i].value === o.value)));
          onChange(o.value);
        },
      },
      o.label,
    ),
  );
  group.append(...buttons);
  return group;
}

/**
 * Shared empty, error, or informational state block with one optional recovery action.
 * @param {{ title?: string, body?: string, kind?: 'empty'|'error', headingTag?: 'h1'|'h2', action?: { label: string, href?: string, onClick?: () => void, variant?: string }|null, secondary?: { label: string, href?: string, onClick?: () => void, variant?: string }|null }} opts
 * @returns {HTMLElement}
 */
export function stateBlock({ title, body, kind = 'empty', headingTag = 'h2', action = null, secondary = null } = {}) {
  const button = (a, variant) =>
    !a
      ? null
      : a.href
        ? h(`a.btn.${a.variant ?? variant}`, { href: a.href }, a.label)
        : h(`button.btn.${a.variant ?? variant}`, { type: 'button', onClick: a.onClick }, a.label);
  const actionEl = button(action, 'btn-primary');
  const secondaryEl = button(secondary, 'btn-ghost');
  return h(
    `div.state.state-${kind}`,
    kind === 'error' ? { role: 'alert' } : { role: 'status' },
    title ? h(`${headingTag}.state-title`, {}, title) : null,
    body ? h('p.state-body', {}, body) : null,
    actionEl || secondaryEl ? h('div.state-action', {}, actionEl, secondaryEl) : null,
  );
}

/**
 * Shared loading state: a title and summary placeholder, then skeleton rows the height of real
 * list rows, so the page does not jump when content arrives.
 * @param {{ label?: string, rows?: number }} [opts]
 * @returns {HTMLElement}
 */
export function loadingState({ label = 'Loading...', rows = 6 } = {}) {
  const skeletonRows = Array.from({ length: rows }, () => h('div.skeleton-row', { 'aria-hidden': 'true' }, h('span.skeleton-hex'), h('span.skeleton-bar.skeleton-line')));
  return h(
    'div.state.state-loading',
    { role: 'status', 'aria-busy': 'true' },
    h('p.sr-only', {}, label),
    h('div.skeleton-title', { 'aria-hidden': 'true' }),
    h('div.skeleton-meta', { 'aria-hidden': 'true' }),
    h('div.skeleton-list', {}, skeletonRows),
  );
}

/**
 * Shared footer for browse pages: the main destinations and the privacy policy.
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
      { 'aria-label': 'Footer' },
      h('a', { href: '#/map' }, 'Map'),
      h('a', { href: '#/daily' }, 'Daily'),
      h('a', { href: '#/path' }, 'Path'),
      h('a', { href: 'privacy.html' }, 'Privacy Policy'),
    ),
    note ? h('p.site-links-note', {}, note) : null,
  );
}

/**
 * A problem's status as the shared hex mark (docs/DESIGN.md). Decorative: callers put the status
 * in words next to it or in the row's accessible name.
 * @param {'new'|'todo'|'attempted'|'solved'|'assisted'} status
 * @returns {HTMLElement}
 */
export function hexMark(status) {
  return h(`span.hexmark.${status === 'todo' ? 'new' : status}`, { 'aria-hidden': 'true' });
}

/**
 * Thin progress bar. Decorative: the text beside it says "x of y solved".
 * @param {number} done
 * @param {number} total
 * @returns {HTMLElement}
 */
export function progressBar(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return h('span.progress-bar', { 'aria-hidden': 'true' }, h('span.progress-fill', { style: { width: `${pct}%` } }));
}

/**
 * Company mark: a hex tile with the company's monogram (letters, not logos:
 * docs/research/DESIGN_DIRECTIONS.md). A dot marks a major Israeli engineering presence, a ring a
 * tier-1 company, and `fill` (0 to 1) rises from the bottom as the company's set is solved.
 * Decorative: the company name is always written next to it.
 * @param {{ letters: string, israel?: string|null, tier?: number|null, fill?: number, size?: 'sm'|'md'|'lg' }} opts
 * @returns {HTMLElement}
 */
export function companyMark({ letters, israel = null, tier = null, fill = 0, size = 'md' }) {
  const cls = `span.company-mark.is-mono${size !== 'md' ? `.${size}` : ''}${israel === 'major' ? '.is-il' : ''}${tier === 1 ? '.is-t1' : ''}`;
  return h(
    cls,
    { 'aria-hidden': 'true', style: { '--fill': `${Math.round(Math.min(1, Math.max(0, fill)) * 100)}%` } },
    h('span.company-mark-letters', {}, letters),
  );
}
