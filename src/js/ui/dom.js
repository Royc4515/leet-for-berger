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

/**
 * Accessible confirm dialog using <dialog>. Native confirm() is avoided because it
 * blocks the event loop (and the test-runner watchdog timers with it).
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, body, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const dlg = h(
      'dialog.modal',
      {},
      h('h3', {}, title),
      h('p', {}, body),
      h(
        'div.modal-actions',
        {},
        h('button.btn.btn-ghost', { value: 'cancel', onClick: () => close(false) }, 'Cancel'),
        h(`button.btn.${danger ? 'btn-danger' : 'btn-primary'}`, { onClick: () => close(true) }, confirmLabel),
      ),
    );
    const close = (v) => {
      dlg.close();
      dlg.remove();
      resolve(v);
    };
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      close(false);
    });
    document.body.append(dlg);
    dlg.showModal();
  });
}

export function difficultyBadge(d) {
  return h(`span.badge.diff-${d.toLowerCase()}`, {}, d);
}
