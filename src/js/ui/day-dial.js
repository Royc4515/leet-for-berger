/**
 * The day dial (owner's request: a picker that is beautiful and quick, not a grid): the 24 hours on
 * a ring, noon at the top and midnight at the bottom, the daylight hours lit amber like the sun's
 * path. Each reminder is a lit hex, the site's unit, that is dragged round the day like a clock
 * hand; a tap on the ring adds one there; a dot shows the time now. The centre says how many a day
 * and when the next can come.
 *
 * Keyboard and screen readers: each hex is a slider (arrows move it to the next free hour, Delete
 * removes it), and the panel's "Add a reminder" button adds one. The ring itself is decoration.
 * Pure maths in data/push-device.js; this file is the drawing and the gestures.
 */
import { h } from './dom.js';
import { formatHour, hourAngle, hourAt, nearestTurn, daylight, moveHour, stepHour, toggleHour, nextReminder, describeNext, MAX_PUSH_HOURS } from '../data/push-device.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** The face is drawn on a 320 grid; the CSS sizes it, and the hexes ride at the ring's radius in cqw. */
const SIZE = 320;
const C = SIZE / 2;
const RING_IN = 100;
const RING_OUT = 134;
const LABEL_R = 151;
/** A press that moves less than this is a tap (select), not a drag. */
const DRAG_PX = 5;

const rad = (deg) => (deg * Math.PI) / 180;
/** A point on the face at radius `r` and `deg` clockwise from the top. */
const pt = (r, deg) => [C + r * Math.sin(rad(deg)), C - r * Math.cos(rad(deg))].map((v) => Number(v.toFixed(2)));
const at = (r, deg) => pt(r, deg).join(' ');

function svg(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** One hour of the ring: an annulus slice, with a hairline gap to its neighbours. */
function segment(hour) {
  const a0 = hourAngle(hour) - 7.5 + 0.6;
  const a1 = hourAngle(hour) + 7.5 - 0.6;
  const d = `M ${at(RING_OUT, a0)} A ${RING_OUT} ${RING_OUT} 0 0 1 ${at(RING_OUT, a1)} L ${at(RING_IN, a1)} A ${RING_IN} ${RING_IN} 0 0 0 ${at(RING_IN, a0)} Z`;
  const light = daylight(hour);
  return svg('path', { d, class: light ? 'dial-seg' : 'dial-seg is-night', 'data-hour': hour, style: `--light: ${light}` });
}

/** The sun at the top of the ring's inside, the moon at the bottom: day and night at a glance. */
function sky() {
  const g = svg('g', { class: 'dial-sky' });
  const sun = svg('g', { class: 'dial-sun', transform: `translate(${C} 74)` });
  sun.append(svg('circle', { r: 5.5 }));
  for (let i = 0; i < 8; i++) {
    const a = rad(i * 45);
    sun.append(svg('line', { x1: (Math.sin(a) * 9).toFixed(2), y1: (-Math.cos(a) * 9).toFixed(2), x2: (Math.sin(a) * 12).toFixed(2), y2: (-Math.cos(a) * 12).toFixed(2) }));
  }
  const moon = svg('path', { class: 'dial-moon', d: `M ${C + 6} ${SIZE - 80} a 8 8 0 1 1 -7 -9.5 a 6.2 6.2 0 0 0 7 9.5 Z` });
  g.append(sun, moon);
  return g;
}

/**
 * @param {{
 *   hours: number[],
 *   now: () => Date,
 *   restDay: () => number|null,
 *   onChange: (hours: number[]) => void,
 *   onFull?: () => void,
 * }} opts `now` on the user's clock; `onChange` after each add, move (at the end of a drag) and removal
 * @returns {{ el: HTMLElement, set: (hours: number[]) => void, add: (hour: number|null) => number|null, tick: () => void, redraw: () => void }}
 */
export function createDayDial({ hours: initial, now, restDay, onChange, onFull = () => {} }) {
  let hours = [...initial].sort((a, b) => a - b);
  let selected = null;
  /** hour -> its hex button; a hex keeps its element as it moves, so focus and the glide survive. */
  const knobs = new Map();

  const face = svg('svg', { class: 'dial-face', viewBox: `0 0 ${SIZE} ${SIZE}`, 'aria-hidden': 'true', focusable: 'false' });
  const ring = svg('g', { class: 'dial-ring' });
  for (let hour = 0; hour < 24; hour++) ring.append(segment(hour));
  const labels = svg('g', { class: 'dial-labels' });
  for (const hour of [0, 6, 12, 18]) {
    const [x, y] = pt(LABEL_R, hourAngle(hour));
    const t = svg('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'data-hour': hour });
    t.textContent = String(hour).padStart(2, '0');
    labels.append(t);
  }
  const needle = svg('g', { class: 'dial-now' });
  needle.append(svg('line', { x1: C, y1: C - RING_IN + 2, x2: C, y2: C - RING_OUT - 2 }), svg('circle', { cx: C, cy: C - RING_IN + 8, r: 3 }));
  face.append(ring, labels, sky(), needle);

  const count = h('strong.dial-count');
  const countLabel = h('span.dial-count-label');
  const next = h('span.dial-next');
  const selTime = h('strong.dial-count');
  const remove = h('button.btn.btn-secondary.btn-sm.dial-remove', { type: 'button', onClick: () => removeHour(selected, true) }, 'Remove');
  const summary = h('div.dial-summary', {}, count, countLabel, next);
  const selection = h('div.dial-selection', { hidden: true }, selTime, remove);
  const center = h('div.dial-center', {}, summary, selection);
  const el = h('div.dial', {}, face, center);

  function knobFor(hour) {
    const hex = h('span.dial-knob-hex', { 'aria-hidden': 'true' });
    const b = h('button.dial-knob', { type: 'button', role: 'slider', 'aria-valuemin': '0', 'aria-valuemax': '23' }, hex);
    b.dataset.angle = String(hourAngle(hour));
    b.addEventListener('keydown', (e) => keyed(e, b));
    b.addEventListener('pointerdown', (e) => pressed(e, b));
    b.addEventListener('focus', () => b.classList.add('is-focus'));
    b.addEventListener('blur', () => b.classList.remove('is-focus'));
    el.append(b);
    // Rises into place: the class goes after the first frame so the entry animation runs once.
    b.classList.add('is-new');
    requestAnimationFrame(() => b.classList.remove('is-new'));
    return b;
  }

  const hourOf = (b) => [...knobs].find(([, k]) => k === b)?.[0];

  function place(b, hour) {
    const angle = nearestTurn(Number(b.dataset.angle), hourAngle(hour));
    b.dataset.angle = String(angle);
    b.dataset.hour = String(hour);
    b.style.setProperty('--a', `${angle}deg`);
    b.setAttribute('aria-valuenow', String(hour));
    b.setAttribute('aria-valuetext', formatHour(hour));
    b.setAttribute('aria-label', `Reminder at ${formatHour(hour)}`);
    b.querySelector('.dial-knob-hex').textContent = String(hour).padStart(2, '0');
  }

  /** Brings the hexes, the labels and the centre in line with `hours`. */
  function draw() {
    for (const [hour, b] of knobs) {
      if (!hours.includes(hour)) {
        knobs.delete(hour);
        b.remove();
      }
    }
    for (const hour of hours) if (!knobs.has(hour)) knobs.set(hour, knobFor(hour));
    for (const hour of hours) {
      const b = knobs.get(hour);
      place(b, hour);
      b.classList.toggle('is-selected', hour === selected);
    }
    // Tab follows the clock: the hexes in hour order. Moved in the page only when the order changed,
    // because moving an element drops its focus and a drag's pointer capture.
    const order = hours.map((hour) => knobs.get(hour));
    const current = [...el.querySelectorAll(':scope > .dial-knob')];
    if (order.some((b, i) => current[i] !== b)) {
      const focused = document.activeElement;
      for (const b of order) el.append(b);
      if (order.includes(focused) && document.activeElement !== focused) focused.focus({ preventScroll: true });
    }
    for (const t of labels.children) t.classList.toggle('is-covered', hours.includes(Number(t.dataset.hour)));
    for (const seg of ring.children) seg.classList.toggle('is-on', hours.includes(Number(seg.dataset.hour)));
    el.classList.toggle('is-full', hours.length >= MAX_PUSH_HOURS);
    count.textContent = String(hours.length);
    countLabel.textContent = hours.length === 1 ? 'reminder a day' : 'reminders a day';
    next.textContent = describeNext(nextReminder({ hours, now: now(), restDay: restDay() }));
    const isSel = selected !== null && hours.includes(selected);
    summary.hidden = isSel;
    selection.hidden = !isSel;
    if (isSel) selTime.textContent = formatHour(selected);
    tick();
  }

  /** The time-now dot, moved along the ring (minutes included). */
  function tick() {
    const t = now();
    needle.setAttribute('transform', `rotate(${hourAngle(t.getHours()) + (t.getMinutes() / 60) * 15} ${C} ${C})`);
  }

  function select(hour) {
    selected = hour;
    draw();
  }

  function addHour(hour) {
    if (hours.includes(hour)) return select(hour);
    if (hours.length >= MAX_PUSH_HOURS) return onFull();
    hours = toggleHour(hours, hour);
    selected = hour;
    draw();
    knobs.get(hour)?.focus({ preventScroll: true });
    onChange(hours);
  }

  function removeHour(hour, fromCentre = false) {
    if (hour === null || !hours.includes(hour)) return;
    const order = hours.indexOf(hour);
    hours = hours.filter((x) => x !== hour);
    selected = null;
    draw();
    // Focus stays on the dial: the next hex round the clock, else the dial's own add button.
    const after = hours[order] ?? hours[0];
    if (after !== undefined) knobs.get(after).focus({ preventScroll: true });
    else if (fromCentre) el.dispatchEvent(new CustomEvent('dial:empty', { bubbles: true }));
    onChange(hours);
  }

  function moveTo(b, to) {
    const from = hourOf(b);
    const moved = moveHour(hours, from, to);
    if (moved === hours) return false;
    hours = moved;
    knobs.delete(from);
    knobs.set(to, b);
    if (selected === from) selected = to;
    draw();
    return true;
  }

  function keyed(e, b) {
    const hour = hourOf(b);
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 3, PageDown: -3 }[e.key];
    if (step) {
      e.preventDefault();
      let to = hour;
      for (let i = 0; i < Math.abs(step); i++) to = stepHour(hours.filter((x) => x !== hour), to, Math.sign(step));
      if (moveTo(b, to)) onChange(hours);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeHour(hour);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(selected === hour ? null : hour);
    } else if (e.key === 'Escape' && selected !== null) {
      select(null);
    }
  }

  /** A hex follows the pointer round the ring, one hour at a time; a short press selects it instead. */
  function pressed(e, b) {
    if (e.button !== 0) return;
    e.preventDefault();
    b.focus({ preventScroll: true });
    b.setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY };
    const startHour = hourOf(b);
    let dragging = false;
    const move = (ev) => {
      if (!dragging && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_PX) return;
      if (!dragging) {
        dragging = true;
        b.classList.add('is-dragging');
        el.classList.add('is-dragging');
      }
      const box = el.getBoundingClientRect();
      moveTo(b, hourAt(ev.clientX - (box.left + box.width / 2), ev.clientY - (box.top + box.height / 2)));
    };
    const end = (ev) => {
      b.removeEventListener('pointermove', move);
      b.removeEventListener('pointerup', end);
      b.removeEventListener('pointercancel', end);
      b.classList.remove('is-dragging');
      el.classList.remove('is-dragging');
      if (!dragging && ev.type === 'pointerup') return select(selected === startHour ? null : startHour);
      if (hourOf(b) !== startHour) onChange(hours);
    };
    b.addEventListener('pointermove', move);
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
  }

  // A tap on the ring adds a reminder at that hour (or picks the one there).
  face.addEventListener('click', (e) => {
    const seg = e.target.closest?.('.dial-seg');
    if (seg) addHour(Number(seg.dataset.hour));
    else if (selected !== null) select(null);
  });
  center.addEventListener('click', (e) => {
    if (e.target === center && selected !== null) select(null);
  });

  draw();
  return {
    el,
    /** Replaces the hours (the server's answer, or a revert after a failed save). */
    set(next) {
      hours = [...next].sort((a, b) => a - b);
      if (!hours.includes(selected)) selected = null;
      draw();
    },
    /** Adds a reminder at `hour` (data/push-device.js suggestHour); null means the day is full. */
    add(hour) {
      if (hour === null || hour === undefined) {
        onFull();
        return null;
      }
      addHour(hour);
      return hour;
    },
    tick,
    redraw: draw,
  };
}
