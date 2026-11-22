/**
 * App bootstrap + hash router.
 *
 * Hash routing (not History API) so the app works on GitHub Pages with zero server
 * config: a refresh on any route still serves index.html.
 */
import { createStore, stats } from './state/progress.js';
import { createAccount } from './auth/account.js';
import { mountAccountMenu } from './ui/account-menu.js';
import { createGitHubSync, installationFromUrl } from './auth/github-sync.js';
import { services } from './auth/services.js';
import { catalogEntry, loadProblem } from './problems/index.js';
import { h, mount, toast, stateBlock, loadingState, siteFooter } from './ui/dom.js';

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
  [/^#\/path$/, async () => { const m = await import('./ui/views/path.js'); return (root) => m.renderPath(root, { store }); }, 'path', 'Learning Path'],
  [/^#\/companies$/, async () => { const m = await import('./ui/views/companies.js'); return (root) => m.renderCompanies(root, { store }); }, 'companies', 'Companies'],
  [/^#\/companies\/([\w-]+)$/, async (_, [, slug]) => { const m = await import('./ui/views/companies.js'); return (root) => m.renderCompany(root, { store, slug }); }, 'companies', 'Companies'],
  [/^#\/modes$/, async () => { const m = await import('./ui/views/modes.js'); return (root) => m.renderModesHub(root); }, 'modes', 'Modes'],
  [/^#\/interview$/, async () => { const m = await import('./ui/views/modes.js'); return (root) => m.renderInterview(root, { store }); }, 'modes', 'Interview'],
  [/^#\/battle$/, async () => { const m = await import('./ui/views/modes.js'); return (root) => m.renderBattle(root, { store }); }, 'modes', '1v1 Battle'],
];

/** The workspace view and the problem module load in parallel (ADR 0008). */
async function loadProblemRoute(_, [, id]) {
  if (!catalogEntry(id)) return (root) => renderNotFound(root, `Problem "${id}" does not exist or is not published yet.`);
  const [m, problem] = await Promise.all([import('./ui/views/workspace.js'), loadProblem(id).catch(() => null)]);
  if (!problem) return (root) => renderNotFound(root, `Problem "${id}" could not be loaded. Check your connection and reload.`, 'Could not load', 'error');
  return (root) => m.renderWorkspace(root, { problem, store });
}

function renderNotFound(root, message = 'Page not found.', title = 'Not found', kind = 'empty') {
  mount(
    root,
    h(
      'div.page.page-narrow',
      {},
      stateBlock({ title, body: message, kind, headingTag: 'h1', action: { label: 'Back to problems', href: '#/' } }),
      siteFooter(),
    ),
  );
  return () => {};
}

let cleanup = () => {};
// Bumped on every navigation: a view that finishes loading after the hash moved on must not render.
let navToken = 0;

function setHeaderTitle(text) {
  if (headerTitle) headerTitle.textContent = text;
}

async function route() {
  const token = ++navToken;
  // Every view returns a cleanup; skipping it leaks Monaco instances, intervals and listeners.
  // It always runs for the previous view, and is a no-op until a view is mounted (set below).
  try {
    cleanup();
  } catch (err) {
    console.error('View cleanup failed', err);
  }
  cleanup = () => {};
  const hash = location.hash || '#/';
  const match = routes.find(([re]) => re.test(hash));
  view.className = 'view';
  if (!match) {
    cleanup = renderNotFound(view);
    setActiveNav(null);
    setHeaderTitle('Not found');
    return;
  }
  const [re, load, nav, title] = match;
  const groups = hash.match(re);
  setActiveNav(nav);
  setHeaderTitle(typeof title === 'function' ? title(groups) : title);
  mount(view, h('div.page', {}, loadingState({ label: 'Loading page...' })));
  let mounter;
  try {
    mounter = await load(hash, groups);
  } catch {
    // Offline or a stale deploy; no console.error here, the browser already logged the failed fetch.
    if (token === navToken) cleanup = renderNotFound(view, 'Could not load this page. Check your connection and reload.', 'Could not load', 'error');
    return;
  }
  if (token !== navToken) return;
  cleanup = mounter(view) ?? (() => {});
  view.focus({ preventScroll: true });
}

function setActiveNav(key) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === key) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function renderStreak() {
  const { streak } = stats(store.get());
  const label = `${streak}-day streak`;
  streakChip.setAttribute('aria-label', label);
  streakChip.title = label;
  mount(
    streakChip,
    h('span.streak-icon', { 'aria-hidden': 'true' }, '🔥'),
    h('span.streak-count', { 'aria-hidden': 'true' }, String(streak)),
    h('span.sr-only', {}, label),
  );
}

store.subscribe(renderStreak);
renderStreak();
window.addEventListener('hashchange', route);
route();

// Accounts are optional and inert without a Supabase project in config.js (ADR 0006).
const account = createAccount({ store });
const github = createGitHubSync({ account });
services.account = account;
services.github = github.available ? github : null;
mountAccountMenu(document.getElementById('account'), account, services.github);
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
