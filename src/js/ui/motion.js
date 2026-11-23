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
  const t = document.startViewTransition(update);
  await t.updateCallbackDone;
  // The animation itself is decoration: a skipped or aborted transition is not an error.
  t.finished.catch(() => {});
}
