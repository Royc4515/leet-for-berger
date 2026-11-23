/**
 * Guided tours. The site tour shows on the first visit to a browse page; each mode on the Modes
 * hub (interview, battle, mentor) has its own, shown the first time that mode opens. Content only:
 * the overlay is ui/tour.js, the placement maths data/tour-layout.js, the seen state state/tours.js.
 *
 * A step's `target` lists selectors and the first one on screen wins (the desktop nav and the
 * phone tab bar hold the same links). No target centres the card. An `optional` step is dropped
 * when none of its targets is on screen, so the step count a tour shows is always the real one.
 */

/**
 * @typedef {{ title: string, body: string, target?: string[], optional?: boolean }} TourStep
 * @typedef {{ id: string, label: string, steps: TourStep[] }} Tour
 */

/** Bounds every tour keeps: a few glances, one short line each (the owner asked for short and simple). */
export const TOUR_LIMITS = { minSteps: 2, maxSteps: 4, title: 24, body: 80 };

const navLink = (key) => [`.nav [data-nav="${key}"]`, `.tab-bar [data-nav="${key}"]`];

/** @type {Record<string, Tour>} */
export const TOURS = {
  site: {
    id: 'site',
    label: 'Welcome',
    steps: [
      { title: 'Every problem is a hex', body: 'Solve one and it lights up amber.' },
      { target: navLink('map'), title: 'The map', body: 'Every topic in one place. Lit hexes are the ones you solved.' },
      { target: navLink('path'), title: 'Not sure what is next?', body: 'The path picks your next problem for you.' },
      { target: ['#palette-trigger'], title: 'Find anything', body: 'Press Ctrl K and type a few letters.' },
    ],
  },
  interview: {
    id: 'interview',
    label: 'Interview',
    steps: [
      { target: ['[data-tour="oa-format"]'], title: 'Pick a length', body: '45, 70 or 90 minutes.' },
      { target: ['[data-tour="oa-company"]'], title: 'Pick a company', body: 'Optional. You get the problems it asks.' },
      { target: ['[data-tour="oa-start"]'], title: 'Like a real exam', body: 'The problems show when the clock starts. Hints are off.' },
    ],
  },
  battle: {
    id: 'battle',
    label: 'Battle',
    steps: [
      { target: ['[data-tour="battle-opponent"]'], title: 'Pick a bot', body: 'A faster bot is harder to beat.' },
      { target: ['[data-tour="battle-problem"]'], title: 'Pick a problem', body: 'Or press Random.' },
      { target: ['[data-tour="battle-start"]'], title: 'Race', body: 'First to pass all 15 tests wins.' },
    ],
  },
  mentor: {
    id: 'mentor',
    label: 'Mentor',
    steps: [
      { target: ['.mentor-log'], title: 'Hints, not answers', body: 'The mentor helps you think. It never writes the code.' },
      { target: ['.mentor-compose'], title: 'Ask', body: 'Each message gets the next hint.' },
    ],
  },
};

/** The modes on the Modes hub, each with its own tour, in hub order. */
export const MODE_TOURS = ['interview', 'battle', 'mentor'];

/**
 * Checks a tour against TOUR_LIMITS and the house voice (docs/DESIGN.md: no em dashes, no
 * exclamation marks outside a genuine success).
 * @param {Tour} tour
 * @returns {string[]} problems, empty when the tour is fine
 */
export function validateTour(tour) {
  const problems = [];
  const n = tour?.steps?.length ?? 0;
  if (!tour?.id || !tour?.label) problems.push('a tour needs an id and a label');
  if (n < TOUR_LIMITS.minSteps || n > TOUR_LIMITS.maxSteps) problems.push(`${tour?.id}: ${n} steps, keep ${TOUR_LIMITS.minSteps} to ${TOUR_LIMITS.maxSteps}`);
  for (const [i, s] of (tour?.steps ?? []).entries()) {
    const at = `${tour.id} step ${i + 1}`;
    if (!s.title || !s.body) problems.push(`${at}: title and body are required`);
    if ((s.title ?? '').length > TOUR_LIMITS.title) problems.push(`${at}: title longer than ${TOUR_LIMITS.title}`);
    if ((s.body ?? '').length > TOUR_LIMITS.body) problems.push(`${at}: body longer than ${TOUR_LIMITS.body}`);
    const text = `${s.title ?? ''} ${s.body ?? ''}`;
    if (text.includes('!')) problems.push(`${at}: no exclamation marks in a tour`);
    if (text.includes('\u2014')) problems.push(`${at}: no em dash, use a regular hyphen or a full stop`);
    if (s.target !== undefined && (!Array.isArray(s.target) || !s.target.every((t) => typeof t === 'string' && t))) problems.push(`${at}: target must be a list of selectors`);
    if (s.optional && !s.target?.length) problems.push(`${at}: an optional step needs a target`);
  }
  return problems;
}
