/**
 * Where a tour card and its spotlight go (ui/tour.js draws them). Pure geometry on plain
 * rectangles, so it is unit-tested without a browser; the same rules as docs/DESIGN.md "Tours".
 */

/** Space between the target and the card, px. */
export const TOUR_GAP = 12;
/** Closest the card comes to a viewport edge, px. */
export const TOUR_MARGIN = 16;
/** Under this viewport width the card is a sheet docked to the top or bottom edge, px. */
export const SHEET_WIDTH = 640;

/**
 * @typedef {{ top: number, left: number, width: number, height: number }} Rect
 * @typedef {{ mode: 'center'|'sheet'|'float', side?: 'below'|'above'|'right'|'left', edge?: 'top'|'bottom', top: number, left: number }} Placement
 */

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

/**
 * Places the card for one step. Desktop: below the target, else above, else beside it (the side
 * with more room), always clamped on screen. Phone: a sheet on the edge away from the target, so
 * the thing being explained is never covered. No target: centred.
 * @param {{ target: Rect|null, card: { width: number, height: number }, viewport: { width: number, height: number }, gap?: number, margin?: number }} opts
 * @returns {Placement}
 */
export function placeCard({ target, card, viewport, gap = TOUR_GAP, margin = TOUR_MARGIN }) {
  const { width: vw, height: vh } = viewport;
  const maxLeft = vw - card.width - margin;
  const maxTop = vh - card.height - margin;
  if (!target) {
    return { mode: 'center', top: Math.max(margin, (vh - card.height) / 2), left: Math.max(margin, (vw - card.width) / 2) };
  }
  if (vw < SHEET_WIDTH) {
    const edge = target.top + target.height / 2 > vh / 2 ? 'top' : 'bottom';
    return { mode: 'sheet', edge, top: edge === 'top' ? margin : Math.max(margin, maxTop), left: margin };
  }
  const centredLeft = clamp(target.left + target.width / 2 - card.width / 2, margin, maxLeft);
  const below = Math.max(margin, target.top + target.height + gap);
  if (below + card.height <= vh - margin) return { mode: 'float', side: 'below', top: below, left: centredLeft };
  // A target near the bottom edge: the card's bottom still keeps the margin.
  const above = Math.min(target.top - gap, vh - margin) - card.height;
  if (above >= margin) return { mode: 'float', side: 'above', top: above, left: centredLeft };
  // Tall targets (a side panel, a whole map): beside it, on the side with more room.
  const roomRight = vw - (target.left + target.width) - gap - margin;
  const roomLeft = target.left - gap - margin;
  const sideTop = clamp(target.top, margin, maxTop);
  if (roomRight >= card.width && roomRight >= roomLeft) return { mode: 'float', side: 'right', top: sideTop, left: target.left + target.width + gap };
  if (roomLeft >= card.width) return { mode: 'float', side: 'left', top: sideTop, left: target.left - gap - card.width };
  // Nothing fits: overlap the target's lower part rather than leave the screen.
  return { mode: 'float', side: 'below', top: clamp(below, margin, maxTop), left: centredLeft };
}

/**
 * The spotlight: the target padded a little, cut to the viewport.
 * @param {Rect} target
 * @param {{ width: number, height: number }} viewport
 * @param {number} [pad]
 * @returns {Rect}
 */
export function spotRect(target, viewport, pad = 6) {
  const top = Math.max(0, target.top - pad);
  const left = Math.max(0, target.left - pad);
  const bottom = Math.min(viewport.height, target.top + target.height + pad);
  const right = Math.min(viewport.width, target.left + target.width + pad);
  return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}
