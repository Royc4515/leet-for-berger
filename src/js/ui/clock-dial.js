/**
 * The reminder clock (owner's request, part C): a clock of 12 hours with two faces. The day face
 * reads 06 to 17, the night face 18 to 05; like a clock's hand, the day passes the 6 at the bottom
 * twice, and a hex dragged past it turns the clock from day to night or back: the sun sets and the
 * moon rises, the face darkens, the numbers change. A Day / Night switch under it turns it too.
 *
 * Each reminder is a lit hex on its hour, the site's unit; a tap on an hour adds one; a tapped hex
 * offers Remove in the centre; the centre says how many a day and when the next can come.
 * Keyboard and screen readers: each hex is a slider (arrows move it an hour, across faces too,
 * Delete removes it). Pure maths in data/push-device.js.
 */
import { h } from './dom.js';
import { glide } from './motion.js';
import { formatHour, daylight, faceOf, clockAngle, clockPos, faceHour, nearestAt, nearestTurn, stepHour, moveHour, toggleHour, nextReminder, describeNext, MAX_PUSH_HOURS } from '../data/push-device.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SIZE = 320;
const C = SIZE / 2;
const RING_IN = 98;
const RING_OUT = 142;
const RING_MID = (RING_IN + RING_OUT) / 2;
/** A press that moves less than this is a tap (select), not a drag. */
const DRAG_PX = 5;
/**
 * A few stars on the night face, as [degrees from the top, distance from the centre, size]: fixed,
 * so the sky never changes between visits, and near the rim, clear of the moon and the text.
 */
const STARS = [[42, 78, 1.6], [68, 86, 1.1], [112, 80, 1.4], [146, 74, 1.2], [214, 76, 1.3], [246, 84, 1.6], [292, 78, 1.1], [318, 86, 1.4]];

const rad = (deg) => (deg * Math.PI) / 180;
const pt = (r, deg) => [C + r * Math.sin(rad(deg)), C - r * Math.cos(rad(deg))].map((v) => Number(v.toFixed(2)));
const at = (r, deg) => pt(r, deg).join(' ');

function svg(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** One hour of the clock: a slice of the ring, with a hairline gap to its neighbours. */
function cell(pos) {
  const a0 = pos * 30 - 15 + 0.9;
  const a1 = pos * 30 + 15 - 0.9;
  const d = `M ${at(RING_OUT, a0)} A ${RING_OUT} ${RING_OUT} 0 0 1 ${at(RING_OUT, a1)} L ${at(RING_IN, a1)} A ${RING_IN} ${RING_IN} 0 0 0 ${at(RING_IN, a0)} Z`;
  return svg('path', { d, class: 'clock-cell', 'data-pos': pos });
}

/** The numbers of one face, each in the middle of its hour. */
function numbers(face) {
  const g = svg('g', { class: `clock-numbers is-${face}` });
  for (let pos = 0; pos < 12; pos++) {
    const [x, y] = pt(RING_MID, pos * 30);
    const t = svg('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'data-pos': pos });
    t.textContent = String(faceHour(face, pos)).padStart(2, '0');
    g.append(t);
  }
  return g;
}

/** The sky inside the ring: a warm glow and the sun by day, the dark, the moon and stars by night. */
function sky() {
  const g = svg('g', { class: 'clock-sky' });
  g.append(svg('circle', { class: 'clock-disc is-day', cx: C, cy: C, r: RING_IN - 2 }), svg('circle', { class: 'clock-disc is-night', cx: C, cy: C, r: RING_IN - 2 }));
  const stars = svg('g', { class: 'clock-stars' });
  for (const [deg, dist, r] of STARS) {
    const [cx, cy] = pt(dist, deg);
    stars.append(svg('circle', { cx, cy, r }));
  }
  const sun = svg('g', { class: 'clock-sun' });
  sun.append(svg('circle', { cx: C, cy: C - 62, r: 6 }));
  for (let i = 0; i < 8; i++) {
    const [x1, y1] = [C + Math.sin(rad(i * 45)) * 10, C - 62 - Math.cos(rad(i * 45)) * 10];
    const [x2, y2] = [C + Math.sin(rad(i * 45)) * 13.5, C - 62 - Math.cos(rad(i * 45)) * 13.5];
    sun.append(svg('line', { x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2) }));
  }
  const moon = svg('path', { class: 'clock-moon', d: `M ${C + 5} ${C - 54} a 9 9 0 1 1 -6.5 -11.5 a 7 7 0 0 0 6.5 11.5 Z` });
  g.append(stars, sun, moon);
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
export function createClockDial({ hours: initial, now, restDay, onChange, onFull = () => {} }) {
  let hours = [...initial].sort((a, b) => a - b);
  let selected = null;
  // The clock opens on the face of the time now, as a clock would.
  let face = faceOf(now().getHours());
  /** hour -> its hex button; a hex keeps its element as it moves, so focus and the glide survive. */
  const knobs = new Map();

  const svgFace = svg('svg', { class: 'dial-face clock-face', viewBox: `0 0 ${SIZE} ${SIZE}`, 'aria-hidden': 'true', focusable: 'false' });
  const ring = svg('g', { class: 'clock-ring' });
  for (let pos = 0; pos < 12; pos++) ring.append(cell(pos));
  const needle = svg('g', { class: 'clock-now' });
  needle.append(svg('line', { x1: C, y1: C - RING_IN + 1, x2: C, y2: C - RING_IN + 12 }), svg('circle', { cx: C, cy: C - RING_IN + 16, r: 2.6 }));
  svgFace.append(sky(), ring, numbers('day'), numbers('night'), needle);

  const count = h('strong.dial-count');
  const countLabel = h('span.dial-count-label');
  const next = h('span.dial-next');
  const selTime = h('strong.dial-count');
  const remove = h('button.btn.btn-secondary.btn-sm.dial-remove', { type: 'button', onClick: () => removeHour(selected, true) }, 'Remove');
  const summary = h('div.dial-summary', {}, count, countLabel, next);
  const selection = h('div.dial-selection', { hidden: true }, selTime, remove);
  const center = h('div.dial-center', {}, summary, selection);
  const dial = h('div.dial.hour-clock', {}, svgFace, center);

  // Day / Night: which half of the day the clock shows, with how many reminders each holds.
  const faceIcon = (f) => {
    const icon = svg('svg', { class: 'clock-face-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    if (f === 'day') {
      icon.append(svg('circle', { cx: 12, cy: 12, r: 4 }));
      for (let i = 0; i < 8; i++) icon.append(svg('line', { x1: (12 + Math.sin(rad(i * 45)) * 7).toFixed(2), y1: (12 - Math.cos(rad(i * 45)) * 7).toFixed(2), x2: (12 + Math.sin(rad(i * 45)) * 9.5).toFixed(2), y2: (12 - Math.cos(rad(i * 45)) * 9.5).toFixed(2) }));
    } else icon.append(svg('path', { d: 'M19.5 14.2A7.5 7.5 0 1 1 9.8 4.5a6 6 0 0 0 9.7 9.7Z' }));
    return icon;
  };
  const faceButton = (f, label) => h('button.segmented-btn.clock-face-btn', { type: 'button', 'aria-pressed': 'false', dataset: { face: f }, onClick: () => turn(f) }, faceIcon(f), h('span', {}, label), h('span.clock-face-count'));
  const dayBtn = faceButton('day', 'Day');
  const nightBtn = faceButton('night', 'Night');
  const faces = h('div.segmented.clock-faces', { role: 'group', 'aria-label': 'Hours shown' }, dayBtn, nightBtn);
  const el = h('div.clock-wrap', {}, dial, faces);

  function knobFor(hour) {
    const hex = h('span.dial-knob-hex', { 'aria-hidden': 'true' });
    const b = h('button.dial-knob', { type: 'button', role: 'slider', 'aria-valuemin': '0', 'aria-valuemax': '23' }, hex);
    b.dataset.angle = String(clockAngle(hour));
    b.addEventListener('keydown', (e) => keyed(e, b));
    b.addEventListener('pointerdown', (e) => pressed(e, b));
    dial.append(b);
    b.classList.add('is-new');
    requestAnimationFrame(() => b.classList.remove('is-new'));
    return b;
  }

  const hourOf = (b) => [...knobs].find(([, k]) => k === b)?.[0];

  function place(b, hour) {
    const angle = nearestTurn(Number(b.dataset.angle), clockAngle(hour));
    b.dataset.angle = String(angle);
    b.style.setProperty('--a', `${angle}deg`);
    b.setAttribute('aria-valuenow', String(hour));
    b.setAttribute('aria-valuetext', formatHour(hour));
    b.setAttribute('aria-label', `Reminder at ${formatHour(hour)}`);
    b.querySelector('.dial-knob-hex').textContent = String(hour).padStart(2, '0');
    const away = faceOf(hour) !== face;
    b.classList.toggle('is-away', away);
    // A hex on the other face is out of reach until the clock turns: not in the Tab order either.
    b.tabIndex = away ? -1 : 0;
    b.setAttribute('aria-hidden', String(away));
  }

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
    // Tab follows the clock: the hexes in hour order, moved only when the order changed (moving an
    // element drops its focus and a drag's pointer capture).
    const order = hours.map((hour) => knobs.get(hour));
    const current = [...dial.querySelectorAll(':scope > .dial-knob')];
    if (order.some((b, i) => current[i] !== b)) {
      const focused = document.activeElement;
      for (const b of order) dial.append(b);
      if (order.includes(focused) && document.activeElement !== focused) focused.focus({ preventScroll: true });
    }
    dial.classList.toggle('is-day', face === 'day');
    for (const c of ring.children) c.style.setProperty('--light', face === 'day' ? String(daylight(faceHour('day', Number(c.dataset.pos)))) : '0');
    dial.classList.toggle('is-night', face === 'night');
    dial.classList.toggle('is-full', hours.length >= MAX_PUSH_HOURS);
    for (const b of [dayBtn, nightBtn]) {
      const f = b.dataset.face;
      b.setAttribute('aria-pressed', String(f === face));
      const n = hours.filter((x) => faceOf(x) === f).length;
      b.querySelector('.clock-face-count').textContent = n ? String(n) : '';
      b.setAttribute('aria-label', `${f === 'day' ? 'Day, 06:00 to 17:00' : 'Night, 18:00 to 05:00'}: ${n} ${n === 1 ? 'reminder' : 'reminders'}`);
    }
    glide(faces, '[aria-pressed="true"]');
    count.textContent = String(hours.length);
    countLabel.textContent = hours.length === 1 ? 'reminder a day' : 'reminders a day';
    next.textContent = describeNext(nextReminder({ hours, now: now(), restDay: restDay() }));
    const isSel = selected !== null && hours.includes(selected) && faceOf(selected) === face;
    summary.hidden = isSel;
    selection.hidden = !isSel;
    if (isSel) selTime.textContent = formatHour(selected);
    tick();
  }

  /** The time-now mark on the inside of the ring, shown on the face it belongs to. */
  function tick() {
    const t = now();
    needle.style.display = faceOf(t.getHours()) === face ? '' : 'none';
    needle.setAttribute('transform', `rotate(${clockAngle(t.getHours()) + (t.getMinutes() / 60) * 30} ${C} ${C})`);
  }

  function turn(f) {
    if (f === face) return;
    face = f;
    if (selected !== null && faceOf(selected) !== face) selected = null;
    draw();
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
    face = faceOf(hour);
    draw();
    knobs.get(hour)?.focus({ preventScroll: true });
    onChange(hours);
  }

  function removeHour(hour, fromCentre = false) {
    if (hour === null || !hours.includes(hour)) return;
    hours = hours.filter((x) => x !== hour);
    selected = null;
    draw();
    // Focus stays on the clock: the next hex on this face, else the add button outside.
    const after = hours.find((x) => x > hour && faceOf(x) === face) ?? hours.find((x) => faceOf(x) === face);
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
    // Past the 6 at the bottom the clock turns, and the hex goes on round the other face.
    face = faceOf(to);
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
        dial.classList.add('is-dragging');
      }
      const box = dial.getBoundingClientRect();
      const pos = clockPos(ev.clientX - (box.left + box.width / 2), ev.clientY - (box.top + box.height / 2));
      moveTo(b, nearestAt(hourOf(b), pos));
    };
    const end = (ev) => {
      b.removeEventListener('pointermove', move);
      b.removeEventListener('pointerup', end);
      b.removeEventListener('pointercancel', end);
      b.classList.remove('is-dragging');
      dial.classList.remove('is-dragging');
      if (!dragging && ev.type === 'pointerup') return select(selected === startHour ? null : startHour);
      if (hourOf(b) !== startHour) onChange(hours);
    };
    b.addEventListener('pointermove', move);
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
  }

  svgFace.addEventListener('click', (e) => {
    const c = e.target.closest?.('.clock-cell');
    if (c) addHour(faceHour(face, Number(c.dataset.pos)));
    else if (selected !== null) select(null);
  });
  center.addEventListener('click', (e) => {
    if (e.target === center && selected !== null) select(null);
  });

  draw();
  return {
    el,
    set(next) {
      hours = [...next].sort((a, b) => a - b);
      if (!hours.includes(selected)) selected = null;
      draw();
    },
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
