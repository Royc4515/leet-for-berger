/**
 * App bootstrap + hash router.
 *
 * Hash routing (not History API) so the app works on GitHub Pages with zero server
 * config: a refresh on any route still serves index.html.
 */
import { createStore, stats, dayKey, restDayOf } from './state/progress.js';
import { createAccount, restoreReturnRoute } from './auth/account.js';
import { mountAccountMenu } from './ui/account-menu.js';
import { createGitHubSync, installationFromUrl } from './auth/github-sync.js';
import { services } from './auth/services.js';
import { catalogEntry, loadProblem } from './problems/index.js';
import { h, mount, toast, stateBlock, loadingState } from './ui/dom.js';
import { loadSeen, hasSeen } from './state/tours.js';
import { tourForRoute } from './data/tour-routes.js';
import { viewTransition, glide, installSpotlight, animate, DUR, EASE } from './ui/motion.js';

const store = createStore();
const view = document.getElementById('view');
const streakChip = document.getElementById('streak-chip');
const headerTitle = document.getElementById('header-title');

/**
 * Route table: [pattern, load, navKey, title]. Order matters, first match wins. Each view module
 * loads on demand (ADR 0008): `load` imports it and returns a mounter, or throws when the import
 * fails. Literal import() paths, so the dev server and the browser both see plain static specifiers.
 */
const routes = [
  [/^#?\/?$/, async () => { const m = await import('./ui/views/dashboard.js'); return (root) => m.renderDashboard(root, { store }); }, 'problems', 'Problems'],
  [/^#\/problem\/([\w-]+)$/, loadProblemRoute, 'problems', ([, id]) => catalogEntry(id)?.title ?? 'Problem'],
  // Map levels (#/map/<topic>/<subtopic>/<problem>) zoom inside one mounted view: see `update` in route().
  [/^#\/map(?:\/([\w-]+)(?:\/([\w-]+)(?:\/([\w-]+))?)?)?$/, async (_, [, ...parts]) => { const m = await import('./ui/views/map.js'); return (root) => m.renderMap(root, { store, parts }); }, 'map', 'Map'],
  [/^#\/daily$/, async () => { const m = await import('./ui/views/daily.js'); return (root) => m.renderDaily(root, { store }); }, 'problems', 'Daily challenge'],
  [/^#\/path$/, async () => { const m = await import('./ui/views/path.js'); return (root) => m.renderPath(root, { store }); }, 'path', 'Learning Path'],
  [/^#\/companies$/, async () => { const m = await import('./ui/views/companies.js'); return (root) => m.renderCompanies(root, { store }); }, 'companies', 'Companies'],
  [/^#\/companies\/([\w-]+)$/, async (_, [, slug]) => { const m = await import('./ui/views/companies.js'); return (root) => m.renderCompany(root, { store, slug }); }, 'companies', 'Companies'],
  [/^#\/modes$/, async () => { const m = await import('./ui/views/modes.js'); return (root) => m.renderModesHub(root); }, 'modes', 'Modes'],
  [/^#\/interview$/, async () => { const m = await import('./ui/views/modes.js'); return (root) => m.renderInterview(root, { store }); }, 'modes', 'Interview'],
  [/^#\/quiz$/, async () => { const m = await import('./ui/views/quiz.js'); return (root) => m.renderQuizHub(root); }, 'modes', 'Quiz'],
  [/^#\/quiz\/board$/, async () => { const m = await import('./ui/views/quiz.js'); return (root) => m.renderQuizBoard(root); }, 'modes', 'Leaderboard'],
  [/^#\/quiz\/daily$/, async () => { const m = await import('./ui/views/quiz.js'); return (root) => m.renderDailyQuiz(root); }, 'modes', 'Daily quiz'],
  [/^#\/battle$/, async () => { const m = await import('./ui/views/modes.js'); return (root) => m.renderBattle(root, { store }); }, 'modes', '1v1 Battle'],
  [/^#\/me$/, async () => { const m = await import('./ui/views/profile.js'); return (root) => m.renderProfile(root, { store }); }, null, 'Profile'],
];

/** The workspace view and the problem module load in parallel (ADR 0008). */
async function loadProblemRoute(_, [, id]) {
  if (!catalogEntry(id)) return (root) => renderNotFound(root, `Problem "${id}" does not exist or is not published yet.`);
  const [m, problem] = await Promise.all([import('./ui/views/workspace.js'), loadProblem(id).catch(() => null)]);
  if (!problem) return (root) => renderNotFound(root, `Problem "${id}" could not be loaded. Check your connection and reload.`, 'Could not load', 'error');
  return (root) => m.renderWorkspace(root, { problem, store });
}

function renderNotFound(root, message = 'This page is not on the map. The link may be old, or the address has a typo.', title = 'Not found', kind = 'empty') {
  const retry = kind === 'error' ? { label: 'Try again', onClick: () => location.reload() } : { label: 'Open the map', href: '#/map' };
  const page = h('div.page.page-narrow', {}, stateBlock({ title, body: message, kind, headingTag: 'h1', action: retry, secondary: { label: 'Back to problems', href: '#/' } }));
  mount(root, page);
  // The footer is not a startup module (tests/startup-graph.test.js): it follows a moment later,
  // and only onto this page if it is still the one shown.
  import('./ui/footer.js')
    .then(({ siteFooter }) => page.isConnected && page.append(siteFooter()))
    .catch(() => {});
  return () => {};
}

let cleanup = () => {};
// The route pattern of the mounted view. A view whose cleanup carries `update(groups)` (the map's
// zoom levels) is told about a new hash of the same route instead of being torn down and rebuilt,
// so it can animate between levels and keep its state; Back and Forward still work, being hashes.
let mountedRe = null;
// Bumped on every navigation: a view that finishes loading after the hash moved on must not render.
let navToken = 0;

/* ---------- Guided tours (data/tours.js) ---------- */
// Every page explains itself on its first visit (the mentor's tour opens with its panel). The
// overlay module loads only when a tour is due or asked for.
let closeTour = () => {};
const loadTour = () => import('./ui/tour.js');

function maybePageTour(hash, token) {
  const id = tourForRoute(hash);
  if (!id || hasSeen(loadSeen(), id)) return;
  loadTour()
    .then((m) => {
      if (token === navToken) closeTour = m.startTourIfDue(id);
    })
    .catch(() => {}); // offline: no tour this time, it stays due
}

// Replays (the footer, the palette, "How it works") ask with a 'tour:open' event: a tour id, or
// 'page' for the page you are on.
addEventListener('tour:open', (e) => {
  const id = e.detail === 'page' ? tourForRoute(location.hash) : e.detail;
  if (!id) return;
  loadTour()
    .then((m) => {
      closeTour();
      closeTour = m.startTour(id);
    })
    .catch(() => toast('The guide could not load. Check your connection and try again.', 'error'));
});

function setHeaderTitle(text) {
  if (headerTitle) headerTitle.textContent = text;
}

async function route() {
  const token = ++navToken;
  const hash = location.hash || '#/';
  const match = routes.find(([re]) => re.test(hash));
  closeTour();
  closeTour = () => {};
  if (match && match[0] === mountedRe && typeof cleanup.update === 'function') {
    const groups = hash.match(match[0]);
    setHeaderTitle(typeof match[3] === 'function' ? match[3](groups) : match[3]);
    cleanup.update(groups);
    return;
  }
  // Every view returns a cleanup; skipping it leaks Monaco instances, intervals and listeners.
  // It always runs for the previous view, and is a no-op until a view is mounted (set below).
  try {
    cleanup();
  } catch (err) {
    console.error('View cleanup failed', err);
  }
  cleanup = () => {};
  mountedRe = null;
  if (!match) {
    view.className = 'view';
    cleanup = renderNotFound(view);
    setActiveNav(null);
    setHeaderTitle('Not found');
    return;
  }
  const [re, load, nav, title] = match;
  const groups = hash.match(re);
  setActiveNav(nav);
  setHeaderTitle(typeof title === 'function' ? title(groups) : title);
  // A skeleton only when the view module is slow to arrive; a quick load cross-fades from the old
  // page straight to the new one, with no flash of grey in between.
  const skeleton = setTimeout(() => {
    if (token !== navToken) return;
    view.className = 'view';
    mount(view, h('div.page', {}, loadingState({ label: 'Loading page...' })));
  }, 160);
  let mounter;
  try {
    mounter = await load(hash, groups);
  } catch {
    clearTimeout(skeleton);
    // Offline or a stale deploy; no console.error here, the browser already logged the failed fetch.
    if (token === navToken) {
      view.className = 'view';
      cleanup = renderNotFound(view, 'Could not load this page. Check your connection and reload.', 'Could not load', 'error');
    }
    return;
  }
  clearTimeout(skeleton);
  if (token !== navToken) return;
  const swap = () => {
    // A newer navigation won while this one waited for its transition: let that one mount.
    if (token !== navToken) return;
    view.className = 'view';
    cleanup = mounter(view) ?? (() => {});
    mountedRe = re;
  };
  // Page to page is a cross-fade (View Transitions, where the browser has them and motion is on);
  // the first page of a visit just appears.
  if (hasMounted) await viewTransition(swap);
  else swap();
  hasMounted = true;
  if (token !== navToken) return;
  view.focus({ preventScroll: true });
  maybePageTour(hash, token);
}
let hasMounted = false;

function setActiveNav(key) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === key) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  // One highlight slides between nav items instead of jumping (ui/motion.js glide).
  glide(document.querySelector('.nav'), '[aria-current="page"]');
  glide(document.querySelector('.tab-bar'), '[aria-current="page"]');
}

function renderStreak() {
  const state = store.get();
  const { streak } = stats(state);
  // Lit only once today has an accepted submission; a streak kept alive by yesterday stays dim.
  const today = state.activeDays.includes(dayKey());
  // On the rest day nothing ends at midnight, so the chip does not ask for a solve.
  const resting = new Date().getDay() === restDayOf(state);
  const label = streak ? `${streak}-day streak${today ? '' : resting ? ', today is your rest day' : ', solve one today to keep it'}` : 'No streak yet';
  streakChip.title = label;
  streakChip.href = '#/daily';
  const wasLit = streakChip.classList.contains('is-active');
  const lit = streak > 0 && today;
  streakChip.classList.toggle('is-active', lit);
  mount(
    streakChip,
    h('span.streak-icon', { 'aria-hidden': 'true' }),
    h('span.streak-count', { 'aria-hidden': 'true' }, String(streak)),
    h('span.sr-only', {}, label),
  );
  // The first solve of the day lights the streak: it ignites once, then stays still.
  if (lit && !wasLit && streakRendered) animate(streakChip.querySelector('.streak-icon'), [{ transform: 'scale(0.4) rotate(-30deg)', opacity: 0.4 }, { transform: 'scale(1.45) rotate(8deg)', opacity: 1, offset: 0.55 }, { transform: 'scale(1) rotate(0deg)', opacity: 1 }], { duration: DUR.stage, easing: EASE.spring });
  streakRendered = true;
}
let streakRendered = false;

/* ---------- Command palette (Ctrl/Cmd+K), loaded on first use ---------- */
const openPalette = () =>
  import('./ui/palette.js')
    .then((m) => m.openPalette())
    .catch(() => toast('Search could not load. Check your connection and try again.', 'error'));
document.getElementById('palette-trigger')?.addEventListener('click', openPalette);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
    // Sessions hide navigation on purpose; the palette would be a way out of the exam room.
    if (document.body.classList.contains('lockdown')) return;
    e.preventDefault();
    // Not over a tour or a confirm: finish or close that first (an open palette ignores it too).
    if (document.querySelector('dialog[open]')) return;
    openPalette();
  }
});

store.subscribe(renderStreak);
renderStreak();
installSpotlight();
window.addEventListener('hashchange', route);
// After a Google or GitHub sign-in, back to the page it started from (auth/account.js).
restoreReturnRoute();
const firstRoute = route();

// Reminders (stage F7): the bell loads after the first page has rendered, so it never competes
// with it and the startup graph keeps its size. Offline, the header simply has no bell this visit.
firstRoute.finally(() =>
  import('./ui/notify-bell.js')
    .then((m) => m.mountNotifyBell(document.getElementById('notify'), { store }))
    .catch(() => {}),
);
// Sign-in and reminders offers after a solve or a quiz (owner's request); after the first page too.
firstRoute.finally(() =>
  import('./ui/nudges.js')
    .then((m) => m.installNudges({ account: services.account }))
    .catch(() => {}),
);
// Theme switches get a line (owner's request); loaded after the first page, not a startup module.
firstRoute.finally(() =>
  import('./ui/theme-quips.js')
    .then((m) => m.installThemeQuips())
    .catch(() => {}),
);

// Accounts are optional and inert without a Supabase project in config.js (ADR 0006).
const account = createAccount({ store });
const github = createGitHubSync({ account });
services.account = account;
services.github = github.available ? github : null;
mountAccountMenu(document.getElementById('account'), account, services.github);
// Web Push (ADR 0011): signing out deletes this device's subscription first, so a shared phone never
// gets the previous user's reminders. The client loads only then, not at startup.
account.beforeSignOut(() => import('./auth/push-client.js').then((m) => m.forgetThisDevice({ account })));
// supabase-js (9 CDN requests) loads now only for returning or mid-redirect users; everyone else
// gets it when they click Sign in.
account.startIfNeeded();

// GitHub sync (ADR 0007): load the link on sign-in, and finish connecting when GitHub sends the
// user back from installing the app (?installation_id=...&setup_action=install).
let pendingInstall = installationFromUrl(location.search);
// Sign-out clears the user's data (auth/account.js); re-mount the current view so it shows the guest state.
let wasSignedIn = false;
account.subscribe((s) => {
  if (wasSignedIn && s.status === 'signed-out') route();
  wasSignedIn = s.status === 'signed-in';
});
account.subscribe(async (s) => {
  if (!services.github) return;
  if (s.status !== 'signed-in') return github.clear();
  try {
    if (pendingInstall) {
      const id = pendingInstall;
      pendingInstall = null;
      history.replaceState(null, '', location.pathname + location.hash);
      const link = await github.connect(id);
      toast(`Connected. Accepted solutions go to ${link.repo}.`, 'success');
    } else if (!github.get()) await github.refresh();
  } catch (err) {
    toast(`GitHub sync: ${err.message}`, 'error', 6000);
  }
});
