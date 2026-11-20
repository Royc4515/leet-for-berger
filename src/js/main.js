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
import { loadProblem } from './problems/index.js';
import { h, mount, toast } from './ui/dom.js';
import { renderDashboard } from './ui/views/dashboard.js';

const store = createStore();
const view = document.getElementById('view');
const streakChip = document.getElementById('streak-chip');

// Only the dashboard ships with the first page load. Every other view, and the engine behind the
// workspace, loads when its route is opened (ADR 0008).
const views = {
  workspace: () => import('./ui/views/workspace.js'),
  path: () => import('./ui/views/path.js'),
  companies: () => import('./ui/views/companies.js'),
  modes: () => import('./ui/views/modes.js'),
};

/**
 * Renders a view whose code loads on demand. The cleanup it returns is valid before the load
 * finishes: leaving the route mid-load cancels the render, so a late module never mounts over
 * the next view and never leaks a Monaco instance.
 * @param {HTMLElement} root
 * @param {() => Promise<(() => void) | void>} load resolves after rendering, to the view's cleanup
 */
function deferred(root, load) {
  let disposed = false;
  let inner = () => {};
  mount(root, h('div.page', {}, h('p.page-sub', { role: 'status' }, 'Loading...')));
  load(() => disposed)
    .then((cleanupFn) => {
      if (disposed) cleanupFn?.();
      else inner = cleanupFn ?? (() => {});
    })
    .catch(() => {
      if (!disposed) inner = renderLoadFailed(root);
    });
  return () => {
    disposed = true;
    inner();
  };
}

/** Route view: loads the view module, then renders unless the route was left meanwhile. */
const lazyView = (load, render) => (root, match) =>
  deferred(root, async (isDisposed) => {
    const mod = await load();
    return isDisposed() ? undefined : render(mod, root, match);
  });

/** Route table: [pattern, render, navKey]. Order matters, first match wins. */
const routes = [
  [/^#?\/?$/, (root) => renderDashboard(root, { store }), 'problems'],
  [/^#\/problem\/([\w-]+)$/, (root, [, id]) => renderProblem(root, id), 'problems'],
  [/^#\/path$/, lazyView(views.path, (m, root) => m.renderPath(root, { store })), 'path'],
  [/^#\/companies$/, lazyView(views.companies, (m, root) => m.renderCompanies(root, { store })), 'companies'],
  [/^#\/companies\/([\w-]+)$/, lazyView(views.companies, (m, root, [, slug]) => m.renderCompany(root, { store, slug })), 'companies'],
  [/^#\/modes$/, lazyView(views.modes, (m, root) => m.renderModesHub(root)), 'modes'],
  [/^#\/interview$/, lazyView(views.modes, (m, root) => m.renderInterview(root, { store })), 'modes'],
  [/^#\/battle$/, lazyView(views.modes, (m, root) => m.renderBattle(root, { store })), 'modes'],
];

function renderProblem(root, id) {
  return deferred(root, async (isDisposed) => {
    const [problem, { renderWorkspace }] = await Promise.all([loadProblem(id), views.workspace()]);
    if (isDisposed()) return undefined;
    if (!problem) return renderNotFound(root, `Problem "${id}" does not exist or is not published yet.`);
    return renderWorkspace(root, { problem, store });
  });
}

function renderLoadFailed(root) {
  mount(root, h('div.page.page-narrow', {}, h('h1', {}, 'Could not load this page'), h('p.page-sub', {}, 'Check your connection and reload.'), h('a.btn.btn-primary', { href: '#/' }, 'Back to problems')));
  return () => {};
}

function renderNotFound(root, message = 'Page not found.') {
  mount(root, h('div.page.page-narrow', {}, h('h1', {}, 'Not found'), h('p.page-sub', {}, message), h('a.btn.btn-primary', { href: '#/' }, 'Back to problems')));
  return () => {};
}

let cleanup = () => {};

function route() {
  // Every view returns a cleanup; skipping it leaks Monaco instances, intervals and listeners.
  try {
    cleanup();
  } catch (err) {
    console.error('View cleanup failed', err);
  }
  const hash = location.hash || '#/';
  const match = routes.find(([re]) => re.test(hash));
  view.className = 'view';
  if (!match) {
    cleanup = renderNotFound(view);
    setActiveNav(null);
    return;
  }
  const [re, render, nav] = match;
  cleanup = render(view, hash.match(re)) ?? (() => {});
  setActiveNav(nav);
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
  streakChip.textContent = `🔥 ${streak}`;
  streakChip.title = `${streak}-day streak`;
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
account.start();

// GitHub sync (ADR 0007): load the link on sign-in, and finish connecting when GitHub sends the
// user back from installing the app (?installation_id=...&setup_action=install).
let pendingInstall = installationFromUrl(location.search);
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
