/**
 * The header bell (stage F7 step 2): how many reminders are due, and a panel that lists them, each
 * with its link and a Dismiss button. What is due is decided by data/notifications.js; this only
 * shows it. main.js loads this module after the first page renders, so the startup graph keeps its
 * size (tests/startup-graph.test.js).
 *
 * Reminders are never toasts: DESIGN.md keeps toasts for confirming something that already happened.
 */
import { h, mount } from './dom.js';
import { dueNotifications, notificationCopy } from '../data/notifications.js';
import { loadNotificationState, saveNotificationState, dismiss, loadQuizDays, NOTIFICATIONS_CHANGED_EVENT } from '../state/notifications.js';
import { listDraftEdits } from '../state/drafts.js';
import { QUIZ_SAVED_EVENT } from '../state/user-data.js';
import { catalogEntry } from '../problems/index.js';
import { restDayOf } from '../state/progress.js';

const PANEL_ID = 'notify-panel';
const TITLE_ID = 'notify-title';
// A new day and the last hours before midnight arrive with the clock, not with an event.
const RECHECK_MS = 5 * 60 * 1000;
const SVG_NS = 'http://www.w3.org/2000/svg';

/** The bell mark. Decorative: the button's name says how many reminders are due. */
function bellIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: 'notify-icon' })) svg.setAttribute(k, v);
  for (const d of ['M12 3.5a5 5 0 0 0-5 5v3.2l-1.8 3.3h13.6L17 11.7V8.5a5 5 0 0 0-5-5Z', 'M10 18.5a2 2 0 0 0 4 0']) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/**
 * The due reminders with their copy, most pressing first. A reminder that would name a problem the
 * catalog does not have is left out rather than shown with an id.
 * @param {{ get: () => { activeDays: string[], problems: object } }} store
 * @param {Date} now
 */
export function dueItems(store, now) {
  const prefs = loadNotificationState();
  const state = store.get();
  const due = dueNotifications({ activeDays: state.activeDays, problems: state.problems, quizDays: loadQuizDays(), drafts: listDraftEdits() }, now, { ...prefs, restDay: restDayOf(state) });
  return due.map((n) => ({ n, copy: notificationCopy(n, { problemTitle: (id) => catalogEntry(id)?.title }) })).filter((x) => x.copy);
}

/**
 * Mounts the bell in the header.
 * @param {HTMLElement} host
 * @param {{ store: any, now?: () => Date }} opts
 * @returns {() => void} cleanup
 */
export function mountNotifyBell(host, { store, now = () => new Date() }) {
  let open = false;

  const count = h('span.notify-count', { 'aria-hidden': 'true' });
  const toggle = h('button.notify-toggle', { type: 'button', title: 'Reminders', 'aria-controls': PANEL_ID, 'aria-expanded': 'false' }, bellIcon(), count);
  const list = h('div.notify-list');
  const heading = h('h2.notify-title', { id: TITLE_ID, tabindex: '-1' }, 'Reminders');
  const panel = h(
    'div.notify-panel',
    { id: PANEL_ID, role: 'region', 'aria-labelledby': TITLE_ID, hidden: true },
    h('div.notify-head', {}, heading, h('a.btn-link.notify-settings', { href: '#/me' }, 'Settings')),
    list,
  );
  const backdrop = h('div.notify-backdrop', { hidden: true, 'aria-hidden': 'true', onClick: () => setOpen(false, true) });
  const root = h('div.notify', { 'data-count': '0' }, toggle, backdrop, panel);
  mount(host, root);

  function setOpen(next, returnFocus = false) {
    open = next;
    panel.hidden = !open;
    backdrop.hidden = !open;
    root.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) render();
    // On a phone the bell hides once nothing is due (app.css): focus then goes to the page, not <body>.
    if (!open && returnFocus) (toggle.getClientRects().length ? toggle : document.getElementById('view'))?.focus({ preventScroll: true });
  }

  function onDismiss(key, index) {
    saveNotificationState(dismiss(loadNotificationState(), key, now()));
    render();
    // Focus moves to the reminder that took its place, else to the panel heading, never to <body>.
    const buttons = list.querySelectorAll('.notify-dismiss');
    (buttons[Math.min(index, buttons.length - 1)] ?? heading).focus({ preventScroll: true });
  }

  function render() {
    const items = dueItems(store, now());
    const n = items.length;
    root.dataset.count = String(n);
    count.textContent = n ? String(n) : '';
    toggle.setAttribute('aria-label', n ? `Reminders, ${n} due` : 'Reminders, none due');
    if (!open) return;
    if (!n) {
      mount(list, h('p.hint-text.notify-empty', {}, 'Nothing due right now. Streaks, the daily quiz and work you left will show up here.'));
      return;
    }
    mount(
      list,
      h(
        'ul.notify-items',
        {},
        items.map(({ n: item, copy }, i) =>
          h(
            `li.notify-item${item.urgent ? '.is-urgent' : ''}`,
            { 'data-kind': item.kind },
            h('span.notify-mark', { 'aria-hidden': 'true' }),
            h(
              'div.notify-text',
              {},
              h('strong.notify-item-title', {}, copy.title),
              h('p.notify-body', {}, copy.body),
              h(
                'div.notify-actions',
                {},
                h('a.btn.btn-secondary.btn-sm.notify-go', { href: copy.href, 'aria-label': `${copy.action}: ${copy.title}` }, copy.action),
                h('button.btn.btn-ghost.btn-sm.notify-dismiss', { type: 'button', 'aria-label': `Dismiss: ${copy.title}`, onClick: () => onDismiss(item.key, i) }, 'Dismiss'),
              ),
            ),
          ),
        ),
      ),
    );
  }

  toggle.addEventListener('click', () => setOpen(!open));
  // A link to the page already open fires no hashchange; the panel closes on any link it holds.
  panel.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a[href]')) setOpen(false);
  });
  const onDocClick = (e) => {
    if (open && !e.composedPath().includes(root)) setOpen(false);
  };
  const onKey = (e) => {
    if (open && e.key === 'Escape') {
      e.preventDefault();
      setOpen(false, true);
    }
  };
  const onHash = () => setOpen(false);
  const onVisible = () => {
    if (document.visibilityState === 'visible') render();
  };
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('hashchange', onHash);
  window.addEventListener(QUIZ_SAVED_EVENT, render);
  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, render);
  const offStore = store.subscribe(render);
  const timer = setInterval(render, RECHECK_MS);
  render();

  return () => {
    clearInterval(timer);
    offStore();
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('hashchange', onHash);
    window.removeEventListener(QUIZ_SAVED_EVENT, render);
    window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, render);
  };
}
