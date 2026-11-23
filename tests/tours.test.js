// Guided tours: content rules (data/tours.js), seen state (state/tours.js) and card placement
// (data/tour-layout.js). The overlay itself (ui/tour.js) is covered by the e2e smoke test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOURS, MODE_TOURS, TOUR_LIMITS, validateTour } from '../src/js/data/tours.js';
import { TOURS_KEY, parseSeen, hasSeen, markSeen, loadSeen, saveSeen } from '../src/js/state/tours.js';
import { placeCard, spotRect, SHEET_WIDTH, TOUR_MARGIN } from '../src/js/data/tour-layout.js';
import { mulberry32 } from '../src/js/engine/rng.js';

test('there is a site tour and one tour per mode on the Modes hub', () => {
  assert.ok(TOURS.site, 'site tour');
  assert.deepEqual(MODE_TOURS, ['interview', 'battle', 'mentor']);
  for (const id of ['site', ...MODE_TOURS]) assert.equal(TOURS[id]?.id, id, `${id} tour has its own id`);
});

test('every tour passes its own validation: step count, short copy, house voice', () => {
  for (const tour of Object.values(TOURS)) assert.deepEqual(validateTour(tour), [], tour.id);
});

test('validation catches what the house voice forbids', () => {
  const ok = { id: 'x', label: 'X tour', steps: [{ title: 'One', body: 'Fine.' }, { title: 'Two', body: 'Fine.' }] };
  assert.deepEqual(validateTour(ok), []);
  const bad = {
    id: 'x',
    label: 'X tour',
    steps: [
      { title: 'Wow!', body: 'An em dash \u2014 here.' },
      { title: 'T'.repeat(TOUR_LIMITS.title + 1), body: 'B'.repeat(TOUR_LIMITS.body + 1), target: 'not-an-array' },
    ],
  };
  const problems = validateTour(bad).join('\n');
  assert.match(problems, /exclamation/);
  assert.match(problems, /em dash/);
  assert.match(problems, /title longer/);
  assert.match(problems, /body longer/);
  assert.match(problems, /target must be a list/);
  assert.match(validateTour({ id: 'x', label: 'X', steps: [ok.steps[0]] }).join(), /steps/);
});

test('tour targets are plain selectors the page can resolve, and every optional step has one', () => {
  for (const tour of Object.values(TOURS)) {
    for (const s of tour.steps) {
      if (s.optional) assert.ok(s.target?.length, `${tour.id}: optional step "${s.title}" needs a target`);
      for (const sel of s.target ?? []) assert.match(sel, /^[\w.#[\]="\-: >()]+$/, `${tour.id}: ${sel}`);
    }
  }
});

test('seen state: parse is forgiving, mark is idempotent and dated by the given now', () => {
  assert.deepEqual(parseSeen(null), {});
  assert.deepEqual(parseSeen('not json'), {});
  assert.deepEqual(parseSeen('[1,2]'), {});
  assert.deepEqual(parseSeen('{"site":"2026-11-23","bad":3}'), { site: '2026-11-23' });
  const now = new Date(2026, 10, 23, 12).getTime();
  const a = markSeen({}, 'site', now);
  assert.deepEqual(a, { site: '2026-11-23' });
  assert.ok(hasSeen(a, 'site') && !hasSeen(a, 'battle'));
  const later = new Date(2026, 11, 2).getTime();
  assert.equal(markSeen(a, 'site', later), a, 'the first day stays');
  assert.deepEqual(markSeen(a, 'battle', later), { site: '2026-11-23', battle: '2026-12-02' });
});

test('seen state round-trips through a storage, and a throwing storage is harmless', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
  saveSeen({ mentor: '2026-11-23' }, storage);
  assert.equal(mem.get(TOURS_KEY), '{"mentor":"2026-11-23"}');
  assert.deepEqual(loadSeen(storage), { mentor: '2026-11-23' });
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.deepEqual(loadSeen(broken), {});
  assert.doesNotThrow(() => saveSeen({ site: 'x' }, broken));
  assert.deepEqual(loadSeen(null), {});
});

const VW = 1440;
const VH = 900;
const card = { width: 360, height: 220 };
const inside = (p, c, vw, vh) => p.left >= TOUR_MARGIN - 0.5 && p.top >= TOUR_MARGIN - 0.5 && p.left + c.width <= vw - TOUR_MARGIN + 0.5 && p.top + c.height <= vh - TOUR_MARGIN + 0.5;

test('placement: no target centres the card', () => {
  const p = placeCard({ target: null, card, viewport: { width: VW, height: VH } });
  assert.equal(p.mode, 'center');
  assert.equal(p.left, (VW - card.width) / 2);
  assert.equal(p.top, (VH - card.height) / 2);
});

test('placement: below a header link, above a target near the bottom, beside a tall panel', () => {
  const vp = { width: VW, height: VH };
  const navLink = { top: 10, left: 400, width: 60, height: 36 };
  const below = placeCard({ target: navLink, card, viewport: vp });
  assert.equal(below.side, 'below');
  assert.ok(below.top >= navLink.top + navLink.height);
  assert.ok(inside(below, card, VW, VH));

  const low = { top: 760, left: 600, width: 200, height: 60 };
  const above = placeCard({ target: low, card, viewport: vp });
  assert.equal(above.side, 'above');
  assert.ok(above.top + card.height <= low.top);

  const panel = { top: 200, left: 1050, width: 360, height: 690 };
  const beside = placeCard({ target: panel, card, viewport: vp });
  assert.equal(beside.side, 'left');
  assert.ok(beside.left + card.width <= panel.left);

  const tallLeft = { top: 120, left: 20, width: 300, height: 760 };
  assert.equal(placeCard({ target: tallLeft, card, viewport: vp }).side, 'right');
});

test('placement: under the sheet width the card docks to the edge away from the target', () => {
  const vp = { width: 390, height: 844 };
  const sheetCard = { width: 390 - 2 * TOUR_MARGIN, height: 240 };
  assert.ok(390 < SHEET_WIDTH);
  const headerBtn = { top: 8, left: 300, width: 44, height: 44 };
  const top = placeCard({ target: headerBtn, card: sheetCard, viewport: vp });
  assert.equal(top.mode, 'sheet');
  assert.equal(top.edge, 'bottom');
  assert.equal(top.top, 844 - 240 - TOUR_MARGIN);
  const tabBarLink = { top: 790, left: 80, width: 78, height: 54 };
  const bottom = placeCard({ target: tabBarLink, card: sheetCard, viewport: vp });
  assert.equal(bottom.edge, 'top');
  assert.equal(bottom.top, TOUR_MARGIN);
  assert.equal(bottom.left, TOUR_MARGIN);
});

test('placement: the card always stays on screen, whatever the target', () => {
  const rnd = mulberry32(7);
  for (let i = 0; i < 400; i++) {
    const vw = 700 + Math.floor(rnd() * 1300);
    const vh = 500 + Math.floor(rnd() * 600);
    const t = { top: rnd() * vh, left: rnd() * vw, width: 10 + rnd() * vw * 0.8, height: 10 + rnd() * vh * 0.8 };
    const p = placeCard({ target: t, card, viewport: { width: vw, height: vh } });
    assert.ok(inside(p, card, vw, vh), `target ${JSON.stringify(t)} in ${vw}x${vh}: ${JSON.stringify(p)}`);
  }
});

test('spotlight pads the target and stays inside the viewport', () => {
  assert.deepEqual(spotRect({ top: 100, left: 100, width: 50, height: 20 }, { width: VW, height: VH }, 6), { top: 94, left: 94, width: 62, height: 32 });
  const edge = spotRect({ top: 0, left: 0, width: 50, height: 20 }, { width: VW, height: VH }, 6);
  assert.deepEqual(edge, { top: 0, left: 0, width: 56, height: 26 });
  const huge = spotRect({ top: -100, left: -10, width: 3000, height: 2000 }, { width: VW, height: VH }, 6);
  assert.deepEqual(huge, { top: 0, left: 0, width: VW, height: VH });
});
