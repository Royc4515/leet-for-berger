/**
 * Guided tours: every part of the site explains itself the first time it opens (the owner asked
 * for a guide on every page, short and simple). The very first tour a device sees opens with the
 * one-step welcome. The mentor's tour opens with its panel. Content only: the overlay is
 * ui/tour.js, the placement maths data/tour-layout.js, the seen state state/tours.js.
 *
 * A step's `target` lists selectors and the first one on screen wins (the desktop nav and the
 * phone tab bar hold the same links, a phone shows the Results tab instead of the console). No
 * target centres the card. An `optional` step is dropped when none of its targets is on screen,
 * so the step count a tour shows is always the real one.
 */

/**
 * @typedef {{ title: string, body: string, target?: string[], optional?: boolean }} TourStep
 * @typedef {{ id: string, label: string, steps: TourStep[], prefix?: boolean }} Tour
 *   prefix: shown only in front of another tour (the welcome)
 */

/** Bounds every tour keeps: a few glances, one short line each. */
export const TOUR_LIMITS = { minSteps: 2, maxSteps: 4, title: 24, body: 80 };

/** The welcome step's id; devices that saw the first site tour (id `site`) count as welcomed. */
export const WELCOME = 'welcome';
export const WELCOME_ALIASES = ['site'];

/** @type {Record<string, Tour>} */
export const TOURS = {
  welcome: {
    id: 'welcome',
    label: 'Welcome',
    prefix: true,
    steps: [{ title: 'Every problem is a hex', body: 'Solve one and it lights up amber. Each page explains itself the first time.' }],
  },
  problems: {
    id: 'problems',
    label: 'Problems',
    steps: [
      { target: ['.today-daily'], title: "Today's problem", body: 'One problem a day, the same for everyone.' },
      { target: ['.dashboard-filters'], title: 'Every problem', body: 'Search, or filter by difficulty and topic.' },
      { target: ['nav.view-switch'], title: 'List or map', body: 'The same problems, drawn as a map.' },
      { target: ['#palette-trigger'], title: 'Find anything', body: 'Use search, or press Ctrl K, and type a few letters.' },
    ],
  },
  map: {
    id: 'map',
    label: 'Map',
    steps: [
      { target: ['.map-canvas'], title: 'Every topic', body: 'Each block is a topic. Each hex inside is a problem.' },
      { target: ['.map-canvas .district.has-next', '.map-canvas .district'], title: 'Zoom in', body: 'Click a topic for its subtopics, then a subtopic for its problems.' },
      { target: ['.map-lens'], title: 'Colour by', body: 'Your progress, difficulty, or what one company asks.' },
      { target: ['.map-brief'], title: 'Where to go next', body: 'The panel always points at your next problem.' },
    ],
  },
  path: {
    id: 'path',
    label: 'Path',
    steps: [
      { target: ['.path-summary'], title: 'Your next problem', body: 'It stays at the top. One click to start.' },
      { target: ['.path-here'], optional: true, title: 'You are here', body: 'The topic you are working on now.' },
      { target: ['.checkpoint'], optional: true, title: 'Checkpoints', body: 'What you can do once a tier is done.' },
    ],
  },
  daily: {
    id: 'daily',
    label: 'Daily',
    steps: [
      { target: ['.today-daily'], title: "Today's problem", body: 'New at midnight. Solve it to keep your streak.' },
      { target: ['.cal-scroll'], title: 'Your last 16 weeks', body: 'A lit hex is a day you solved something.' },
    ],
  },
  companies: {
    id: 'companies',
    label: 'Companies',
    steps: [
      { target: ['.company-filters .segmented', '.page .segmented'], title: 'Israel first', body: 'Hiring in Israel, the top companies, or all of them.' },
      { target: ['.company-card'], title: 'Pick a company', body: 'See what it asks. Its hex fills as you solve.' },
    ],
  },
  company: {
    id: 'company',
    label: 'Company',
    steps: [
      { target: ['.company-facts'], title: 'At a glance', body: 'What you can practice here, and how much you solved.' },
      { target: ['.company-asks'], optional: true, title: 'What it asks', body: 'Its most asked topics, linked to the map.' },
      { target: ['.company-table'], title: 'Its problems', body: 'Most asked first. Practice opens one.' },
    ],
  },
  modes: {
    id: 'modes',
    label: 'Modes',
    steps: [
      { target: ['.mode-card'], title: 'Mock OA', body: 'A timed exam, like the real thing.' },
      { target: ['.mode-card:nth-of-type(2)'], title: 'Battle', body: 'Race a bot on the same problem.' },
      { target: ['.mentor-note'], optional: true, title: 'AI Mentor', body: 'Hints inside every problem, never the answer.' },
    ],
  },
  workspace: {
    id: 'workspace',
    label: 'Problem',
    steps: [
      { target: ['#ws-description'], title: 'The problem', body: 'Read it here, with examples and limits.' },
      { target: ['button[data-action="run"]'], title: 'Run, then submit', body: 'Run tries your code. Submit counts it.' },
      { target: ['#ws-results', '#ws-tab-results'], title: '15 tests', body: '5 you can open, 10 hidden. Green means passed.' },
      { target: ['button[data-action="mentor"]'], optional: true, title: 'Stuck?', body: 'Ask the mentor for a hint.' },
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

/** Route patterns and the tour each page shows on its first visit, first match wins. */
const ROUTE_TOURS = [
  [/^#?\/?$/, 'problems'],
  [/^#\/problem\/[\w-]+$/, 'workspace'],
  [/^#\/map(\/|$)/, 'map'],
  [/^#\/daily$/, 'daily'],
  [/^#\/path$/, 'path'],
  [/^#\/companies$/, 'companies'],
  [/^#\/companies\/[\w-]+$/, 'company'],
  [/^#\/modes$/, 'modes'],
  [/^#\/interview$/, 'interview'],
  [/^#\/battle$/, 'battle'],
];

/**
 * The tour a route shows on its first visit (and replays from "Guide for this page").
 * @param {string} hash location.hash, '' for the home page
 * @returns {string|null} a TOURS id
 */
export function tourForRoute(hash) {
  const route = hash || '#/';
  return ROUTE_TOURS.find(([re]) => re.test(route))?.[1] ?? null;
}

/**
 * Checks a tour against TOUR_LIMITS and the house voice (docs/DESIGN.md: no em dashes, no
 * exclamation marks outside a genuine success). A prefix tour may be a single step.
 * @param {Tour} tour
 * @returns {string[]} problems, empty when the tour is fine
 */
export function validateTour(tour) {
  const problems = [];
  const n = tour?.steps?.length ?? 0;
  const min = tour?.prefix ? 1 : TOUR_LIMITS.minSteps;
  if (!tour?.id || !tour?.label) problems.push('a tour needs an id and a label');
  if (n < min || n > TOUR_LIMITS.maxSteps) problems.push(`${tour?.id}: ${n} steps, keep ${min} to ${TOUR_LIMITS.maxSteps}`);
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
