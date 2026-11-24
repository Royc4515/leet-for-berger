/**
 * Motion helpers: one place for durations, easing and the reduced-motion rule, so every screen
 * moves the same way (docs/DESIGN.md, Motion). Animations use the Web Animations API on
 * transform and opacity only, which the compositor runs off the main thread.
 *
 * With prefers-reduced-motion every helper jumps to the end state: nothing moves, nothing is
 * skipped (a ticker still shows its final number, a stagger still reveals everything).
 */

/** Durations in ms, mirrored by the --t-* tokens in app.css. */
export const DUR = { instant: 90, fast: 140, base: 220, slow: 360, stage: 600 };
/** Easing curves, mirrored by the --ease-* tokens in app.css. */
export const EASE = {
  out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
};

const reduceQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/** @returns {boolean} true when the user asked the system for less motion */
export function reducedMotion() {
  return Boolean(reduceQuery?.matches);
}

/**
 * Animates an element if motion is allowed. Resolves when done (or at once when reduced).
 * @param {Element} el
 * @param {Keyframe[]} keyframes
 * @param {KeyframeAnimationOptions} [opts]
 * @returns {Promise<void>}
 */
export function animate(el, keyframes, opts = {}) {
  if (reducedMotion() || typeof el.animate !== 'function') return Promise.resolve();
  const a = el.animate(keyframes, { duration: DUR.base, easing: EASE.out, fill: 'backwards', ...opts });
  return a.finished.then(
    () => {},
    () => {},
  );
}

/**
 * Reveals elements one after another (fade and rise), `gap` ms apart.
 * @param {Iterable<Element>} els
 * @param {{ gap?: number, duration?: number, distance?: number }} [opts]
 * @returns {Promise<void>}
 */
export function stagger(els, { gap = 40, duration = DUR.base, distance = 6 } = {}) {
  const list = [...els];
  return Promise.all(
    list.map((el, i) =>
      animate(el, [{ opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'none' }], { duration, delay: i * gap }),
    ),
  ).then(() => {});
}

/**
 * Counts a number up from `from` to `to` in the element's text. The final text is set first
 * for screen readers (the element should carry the real value in its accessible name).
 * @param {HTMLElement} el
 * @param {number} to
 * @param {{ from?: number, duration?: number, format?: (n: number) => string }} [opts]
 * @returns {() => void} cancels the ticker and leaves the final value
 */
export function countUp(el, to, { from = 0, duration = DUR.slow * 2, format = (n) => String(n) } = {}) {
  el.textContent = format(to);
  if (reducedMotion() || to === from || typeof requestAnimationFrame !== 'function') return () => {};
  let raf = 0;
  const start = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - start) / duration);
    const eased = 1 - (1 - p) ** 3;
    el.textContent = format(Math.round(from + (to - from) * eased));
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    el.textContent = format(to);
  };
}

/** Numbers each View Transition, so only the latest one clears the page's `data-transition` mark. */
let transitionSeq = 0;

/**
 * Runs a DOM update inside a View Transition when the browser has them and motion is allowed;
 * otherwise runs it directly. Errors in `update` propagate either way.
 * @param {() => void | Promise<void>} update
 * @returns {Promise<void>}
 */
export async function viewTransition(update) {
  if (reducedMotion() || typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
    await update();
    return;
  }
  const root = document.documentElement;
  const t = document.startViewTransition(update);
  // While the transition plays, the page is a picture of itself: marked, so code (and tests) that
  // hit-test by coordinates can wait for the live page. Only the latest transition clears it: a
  // newer one skips the older, whose `finished` then settles while the newer is still running.
  const id = String(++transitionSeq);
  root.dataset.transition = id;
  // The animation itself is decoration: a skipped or aborted transition is not an error, and an
  // unhandled rejection from either promise would show up as a console error.
  t.ready.catch(() => {});
  t.finished.catch(() => {}).finally(() => {
    if (root.dataset.transition === id) delete root.dataset.transition;
  });
  await t.updateCallbackDone;
}

/* ---------- Glider: one highlight that slides to the active item ---------- */

/**
 * Puts a single highlight behind the active item of a group (segmented controls, the header nav)
 * and slides it there when the active item changes, instead of the highlight jumping. The group
 * keeps working without it: the active item's own style only steps back once the glider is placed.
 * @param {HTMLElement} group
 * @param {string} activeSelector the active item, e.g. '[aria-pressed="true"]'
 * @returns {void}
 */
export function glide(group, activeSelector) {
  if (!group || typeof requestAnimationFrame !== 'function') return;
  let glider = group.querySelector(':scope > .glider');
  if (!glider) {
    glider = document.createElement('span');
    glider.className = 'glider';
    glider.setAttribute('aria-hidden', 'true');
    group.prepend(glider);
    group.__glide = () => place(group, activeSelector);
    // Fonts swap and widths change: follow the group's size, not just clicks.
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => group.__glide?.()).observe(group);
  }
  group.__glide = () => place(group, activeSelector);
  requestAnimationFrame(() => place(group, activeSelector));
}

function place(group, activeSelector) {
  const glider = group.querySelector(':scope > .glider');
  const active = group.querySelector(activeSelector);
  if (!glider || !group.isConnected) return;
  if (!active || !active.offsetWidth) {
    glider.style.visibility = 'hidden';
    return;
  }
  glider.style.visibility = 'visible';
  glider.style.width = `${active.offsetWidth}px`;
  glider.style.height = `${active.offsetHeight}px`;
  glider.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
  if (!group.classList.contains('has-glider')) {
    group.classList.add('has-glider');
    // First placement is instant; only later moves slide.
    requestAnimationFrame(() => group.classList.add('glider-ready'));
  }
}

/* ---------- Spotlight: a soft light follows the mouse over cards ---------- */

const SPOT = '.today-card, .mode-card, .company-card, .map-tile, .stat-cell, .daily-fact, .company-fact, .path-topic, .setup-card';
let spotInstalled = false;

/**
 * Lights the card under the mouse from the pointer's position (CSS reads --mx and --my). One
 * passive listener for the whole page, at most one style write per frame, mouse and pen only.
 * @returns {void}
 */
export function installSpotlight() {
  if (spotInstalled || typeof document === 'undefined') return;
  spotInstalled = true;
  let current = null;
  let frame = 0;
  let last = null;
  const update = () => {
    frame = 0;
    if (!last) return;
    const el = last.target instanceof Element ? last.target.closest(SPOT) : null;
    if (el !== current) {
      current?.classList.remove('is-spot');
      current = el;
      current?.classList.add('is-spot');
    }
    if (!current) return;
    const r = current.getBoundingClientRect();
    current.style.setProperty('--mx', `${Math.round(last.clientX - r.left)}px`);
    current.style.setProperty('--my', `${Math.round(last.clientY - r.top)}px`);
  };
  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch' || reducedMotion()) return;
      last = e;
      if (!frame) frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => {
    current?.classList.remove('is-spot');
    current = null;
  });
}

/* ---------- Celebration and feedback ---------- */

/**
 * A burst of small hexes from the centre of an element (an Accepted verdict). Decoration only:
 * the hexes are aria-hidden, removed when done, and nothing happens under reduced motion.
 * @param {Element} el
 * @param {{ count?: number, colors?: string[], spread?: number }} [opts] colors: CSS colour values or var(--token)
 * @returns {void}
 */
export function burst(el, { count = 14, colors = ['var(--ok)'], spread = 90 } = {}) {
  if (!el || reducedMotion() || typeof el.animate !== 'function') return;
  const r = el.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = 'burst';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.left = `${Math.round(r.left + r.width / 2)}px`;
  layer.style.top = `${Math.round(r.top + r.height / 2)}px`;
  document.body.append(layer);
  const done = [];
  for (let i = 0; i < count; i++) {
    const hex = document.createElement('span');
    hex.className = 'burst-hex';
    hex.style.background = colors[i % colors.length];
    const size = 6 + ((i * 7) % 7);
    hex.style.width = `${size}px`;
    hex.style.height = `${Math.round(size * 1.15)}px`;
    layer.append(hex);
    // Even angles with a little jitter, so the burst looks full without looking like a clock.
    const angle = (i / count) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.35;
    const dist = spread * (0.55 + ((i * 37) % 45) / 100);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist * 0.75;
    const spin = (i % 2 ? 1 : -1) * (90 + ((i * 53) % 180));
    done.push(
      hex.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0.2) rotate(0deg)', opacity: 0 },
          { transform: `translate(calc(-50% + ${x * 0.6}px), calc(-50% + ${y * 0.6}px)) scale(1) rotate(${spin * 0.6}deg)`, opacity: 1, offset: 0.35 },
          { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + 24}px)) scale(0.6) rotate(${spin}deg)`, opacity: 0 },
        ],
        { duration: DUR.stage + 260 + (i % 5) * 40, easing: EASE.out, fill: 'forwards' },
      ).finished,
    );
  }
  Promise.allSettled(done).then(() => layer.remove());
}

/**
 * A short horizontal shake (a failed verdict): says "not yet" without a colour flash.
 * @param {Element} el
 * @returns {void}
 */
export function shake(el) {
  animate(el, [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }], {
    duration: DUR.slow,
    easing: EASE.inOut,
    fill: 'none',
  });
}

