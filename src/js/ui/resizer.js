/**
 * Draggable split resizer (pointer + keyboard).
 *
 * Sizes are stored as a CSS custom property on the container so the layout stays in CSS
 * grid and survives window resizes without JS. Ratios persist per resizer id.
 *
 * @param {object} opts
 * @param {HTMLElement} opts.handle
 * @param {HTMLElement} opts.container
 * @param {'x'|'y'} opts.axis        x = vertical bar dragged left/right, y = horizontal bar dragged up/down
 * @param {string} opts.cssVar       e.g. '--left-size'
 * @param {string} opts.storageKey
 * @param {number} [opts.min]        min fraction for the first pane
 * @param {number} [opts.max]        max fraction for the first pane
 * @param {number} [opts.initial]
 * @param {() => void} [opts.onResize]
 * @returns {() => void} cleanup
 */
export function attachResizer({ handle, container, axis, cssVar, storageKey, min = 0.2, max = 0.8, initial = 0.5, onResize }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const apply = (ratio) => {
    container.style.setProperty(cssVar, `${(ratio * 100).toFixed(2)}%`);
    handle.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    onResize?.();
  };

  let ratio = initial;
  try {
    const saved = Number(localStorage.getItem(storageKey));
    if (saved > 0) ratio = clamp(saved);
  } catch {
    /* storage unavailable: use default */
  }
  apply(ratio);

  handle.setAttribute('role', 'separator');
  handle.setAttribute('tabindex', '0');
  handle.setAttribute('aria-orientation', axis === 'x' ? 'vertical' : 'horizontal');
  handle.setAttribute('aria-valuemin', String(min * 100));
  handle.setAttribute('aria-valuemax', String(max * 100));

  const persist = () => {
    try {
      localStorage.setItem(storageKey, String(ratio));
    } catch {
      /* ignore */
    }
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    // Pointer capture keeps the drag alive when the cursor crosses the Monaco iframe-like
    // surface; without it the editor swallows pointermove and the bar "sticks".
    handle.setPointerCapture(e.pointerId);
    document.body.classList.add(axis === 'x' ? 'resizing-x' : 'resizing-y');
    handle.classList.add('active');
  };
  const onPointerMove = (e) => {
    if (!handle.hasPointerCapture(e.pointerId)) return;
    const rect = container.getBoundingClientRect();
    const pos = axis === 'x' ? (e.clientX - rect.left) / rect.width : (e.clientY - rect.top) / rect.height;
    ratio = clamp(pos);
    apply(ratio);
  };
  const onPointerUp = (e) => {
    if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    document.body.classList.remove('resizing-x', 'resizing-y');
    handle.classList.remove('active');
    persist();
  };
  const onKey = (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const dec = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
    const inc = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
    if (e.key !== dec && e.key !== inc) return;
    e.preventDefault();
    ratio = clamp(ratio + (e.key === inc ? step : -step));
    apply(ratio);
    persist();
  };
  const onDouble = () => {
    ratio = initial;
    apply(ratio);
    persist();
  };

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onPointerUp);
  handle.addEventListener('keydown', onKey);
  handle.addEventListener('dblclick', onDouble);

  return () => {
    handle.removeEventListener('pointerdown', onPointerDown);
    handle.removeEventListener('pointermove', onPointerMove);
    handle.removeEventListener('pointerup', onPointerUp);
    handle.removeEventListener('pointercancel', onPointerUp);
    handle.removeEventListener('keydown', onKey);
    handle.removeEventListener('dblclick', onDouble);
  };
}
