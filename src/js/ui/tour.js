/**
 * Guided tour overlay: a spotlight on the element a step explains and a card beside it
 * (data/tours.js holds the content, data/tour-layout.js the placement maths).
 *
 * A native modal <dialog> sized to the viewport: the top layer puts it above the header, and the
 * browser keeps focus inside and turns Esc into `cancel`. The spotlight is a box inside it whose
 * huge shadow is the scrim, so the target shows through. Clicks on the scrim do nothing on
 * purpose: a stray click must not end an explanation half way. Skip, Esc and Done all close it,
 * and every way of closing marks the tour as seen (state/tours.js).
 */
import { h, tp, pageLang } from './dom.js';
import { TOURS, WELCOME, WELCOME_ALIASES, tourCopy } from '../data/tours.js';
import { placeCard, spotRect, sheetScroll } from '../data/tour-layout.js';
import { loadSeen, saveSeen, markSeen, hasSeen } from '../state/tours.js';

let active = null;

/** First element of a step's selectors that is on screen (rendered, with a size, not hidden). */
function findTarget(selectors = []) {
  for (const sel of selectors) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el;
    }
  }
  return null;
}

/** Fully readable without scrolling: clear of the sticky header and the phone tab bar. */
function inView(r) {
  const top = document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 0;
  return r.top >= top && r.bottom <= innerHeight - 8;
}

/**
 * Whether a tour should start on its own: not seen on this device, no session running, nothing
 * else modal on screen.
 * @param {string} id
 * @returns {boolean}
 */
export function tourDue(id) {
  if (!TOURS[id] || hasSeen(loadSeen(), id)) return false;
  if (document.body.classList.contains('lockdown')) return false;
  return !document.querySelector('dialog[open]');
}

/** The welcome step has not been shown on this device yet (the first tour carries it). */
const welcomeDue = () => {
  const seen = loadSeen();
  return ![WELCOME, ...WELCOME_ALIASES].some((id) => hasSeen(seen, id));
};

/** Every required target is on screen: views load data after they mount, a tour waits for it. */
const targetsReady = (tour) => tour.steps.every((s) => s.optional || !s.target || findTarget(s.target));

/**
 * Starts a tour once the view has painted and its targets are on screen, if it is due. The caller
 * keeps the returned function in its cleanup, so leaving the page cancels a pending start or
 * closes the tour. Gives up waiting after `wait` ms and starts anyway (missing targets centre).
 * @param {string} id
 * @param {{ delay?: number, wait?: number }} [opts]
 * @returns {() => void}
 */
export function startTourIfDue(id, { delay = 350, wait = 4000 } = {}) {
  let close = () => {};
  let timer = 0;
  const started = Date.now();
  const attempt = () => {
    if (!tourDue(id)) return;
    if (!targetsReady(TOURS[id]) && Date.now() - started < wait) {
      timer = setTimeout(attempt, 120);
      return;
    }
    close = startTour(id, { withWelcome: welcomeDue() });
  };
  timer = setTimeout(attempt, delay);
  return () => {
    clearTimeout(timer);
    close();
  };
}

/**
 * Opens a tour now, whether or not it was seen (replay buttons call this).
 * @param {string} id
 * @param {{ onClose?: (reason: 'done'|'skipped'|'closed') => void, withWelcome?: boolean }} [opts]
 *   withWelcome: open with the one-step welcome (the first tour a device sees)
 * @returns {() => void} closes the tour if it is still open
 */
export function startTour(id, { onClose, withWelcome = false } = {}) {
  const tour = tourCopy(id, pageLang());
  if (!tour) return () => {};
  active?.close('closed');

  const isHe = tour.lang === 'he';
  const dir = isHe ? 'rtl' : 'ltr';
  const welcome = withWelcome ? tourCopy(WELCOME, tour.lang) : null;
  const steps = [...(welcome ? welcome.steps : []), ...tour.steps].filter((s) => !s.optional || findTarget(s.target));
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let index = 0;
  let target = null;
  let frame = 0;
  let settle = 0;

  const spot = h('div.tour-spot', { 'aria-hidden': 'true' });
  const eyebrow = h('p.tour-eyebrow');
  const title = h('h2.tour-title', { id: `tour-title-${id}` });
  const body = h('p.tour-body', { id: `tour-body-${id}` });
  const pips = h('span.tour-pips', { 'aria-hidden': 'true' }, ...steps.map(() => h('span.tour-pip')));
  const skip = h('button.btn.btn-ghost.btn-sm.tour-skip', { type: 'button' }, isHe ? tp('Skip', 'לדלג') : 'Skip');
  const back = h('button.btn.btn-secondary.btn-sm', { type: 'button' }, isHe ? tp('Back', 'חזרה') : 'Back');
  const next = h('button.btn.btn-primary.btn-sm.tour-next', { type: 'button' }, isHe ? tp('Next', 'הבא') : 'Next');
  const live = h('p.sr-only', { role: 'status' });
  const card = h(
    'section.tour-card',
    { dir, lang: tour.lang },
    eyebrow,
    title,
    body,
    h('div.tour-foot', {}, pips, h('div.tour-actions', {}, skip, back, next)),
    live,
  );
  const dialog = h('dialog.tour', { 'aria-labelledby': title.id, 'aria-describedby': body.id, 'data-tour-id': id }, spot, card);

  function layout() {
    frame = 0;
    if (!dialog.isConnected) return;
    const viewport = { width: document.documentElement.clientWidth, height: innerHeight };
    const rect = target?.isConnected ? target.getBoundingClientRect() : null;
    const visible = rect && rect.bottom > 0 && rect.top < viewport.height && rect.width > 0;
    const place = placeCard({ target: visible ? rect : null, card: { width: card.offsetWidth, height: card.offsetHeight }, viewport, dir });
    dialog.classList.toggle('is-center', place.mode === 'center');
    card.dataset.mode = place.mode;
    card.style.setProperty('--tour-x', `${Math.round(place.left)}px`);
    card.style.setProperty('--tour-y', `${Math.round(place.top)}px`);
    if (visible) {
      const s = spotRect(rect, viewport);
      spot.style.width = `${s.width}px`;
      spot.style.height = `${s.height}px`;
      spot.style.setProperty('--spot-x', `${s.left}px`);
      spot.style.setProperty('--spot-y', `${s.top}px`);
    }
  }
  const queue = () => {
    if (!frame) frame = requestAnimationFrame(layout);
  };

  function show(i) {
    index = i;
    const step = steps[i];
    const last = i === steps.length - 1;
    target = findTarget(step.target);
    if (target && !inView(target.getBoundingClientRect())) target.scrollIntoView({ block: 'center', inline: 'nearest' });
    eyebrow.textContent = isHe ? tp(`${tour.label} · ${i + 1} of ${steps.length}`, `${tour.label} · ${i + 1} מתוך ${steps.length}`) : `${tour.label} · ${i + 1} of ${steps.length}`;
    title.textContent = step.title;
    body.textContent = step.body;
    pips.querySelectorAll('.tour-pip').forEach((p, j) => p.classList.toggle('is-on', j <= i));
    back.hidden = i === 0;
    skip.hidden = last;
    next.textContent = last ? (isHe ? tp('Done', 'סיום') : 'Done') : isHe ? tp('Next', 'הבא') : 'Next';
    live.textContent = isHe ? tp(`Step ${i + 1} of ${steps.length}. ${step.title}. ${step.body}`, `שלב ${i + 1} מתוך ${steps.length}. ${step.title}. ${step.body}`) : `Step ${i + 1} of ${steps.length}. ${step.title}. ${step.body}`;
    card.classList.remove('is-entering');
    void card.offsetWidth; // restart the entrance animation for the new step
    card.classList.add('is-entering');
    layout();
    // A phone's sheet must not cover the target when there is room for both: scroll to make it.
    if (target) {
      const dy = sheetScroll({ target: target.getBoundingClientRect(), card: { width: card.offsetWidth, height: card.offsetHeight }, viewport: { width: document.documentElement.clientWidth, height: innerHeight } });
      if (dy) scrollBy({ top: dy, behavior: 'instant' });
    }
    // Views animate in and fonts swap: place again once things have settled.
    clearTimeout(settle);
    settle = setTimeout(queue, 260);
    next.focus({ preventScroll: true });
  }

  function close(reason = 'closed') {
    if (active?.dialog !== dialog) return;
    active = null;
    const seen = markSeen(loadSeen(), id);
    saveSeen(withWelcome ? markSeen(seen, WELCOME) : seen);
    clearTimeout(settle);
    if (frame) cancelAnimationFrame(frame);
    removeEventListener('resize', queue);
    removeEventListener('scroll', queue, true);
    if (dialog.open) dialog.close();
    dialog.remove();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    onClose?.(reason);
  }

  next.addEventListener('click', () => (index === steps.length - 1 ? close('done') : show(index + 1)));
  back.addEventListener('click', () => index > 0 && show(index - 1));
  skip.addEventListener('click', () => close('skipped'));
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close('skipped');
  });
  const nextKey = isHe ? 'ArrowLeft' : 'ArrowRight';
  const prevKey = isHe ? 'ArrowRight' : 'ArrowLeft';
  dialog.addEventListener('keydown', (e) => {
    if (e.key === nextKey && index < steps.length - 1) show(index + 1);
    else if (e.key === prevKey && index > 0) show(index - 1);
  });
  addEventListener('resize', queue);
  addEventListener('scroll', queue, true);

  active = { dialog, close };
  document.body.append(dialog);
  dialog.showModal();
  show(0);
  return () => close('closed');
}
