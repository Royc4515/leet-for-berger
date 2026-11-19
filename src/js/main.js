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
import { getProblem } from './problems/index.js';
import { h, mount, toast } from './ui/dom.js';
import { renderDashboard } from './ui/views/dashboard.js';
import { renderWorkspace } from './ui/views/workspace.js';
import { renderPath } from './ui/views/path.js';
import { renderCompanies, renderCompany } from './ui/views/companies.js';
import { renderModesHub, renderInterview, renderBattle } from './ui/views/modes.js';

const store = createStore();
const view = document.getElementById('view');
const streakChip = document.getElementById('streak-chip');

/** Route table: [pattern, render, navKey]. Order matters, first match wins. */
const routes = [
  [/^#?\/?$/, (root) => renderDashboard(root, { store }), 'problems'],
  [/^#\/problem\/([\w-]+)$/, (root, [, id]) => renderProblem(root, id), 'problems'],
  [/^#\/path$/, (root) => renderPath(root, { store }), 'path'],
  [/^#\/companies$/, (root) => renderCompanies(root, { store }), 'companies'],
  [/^#\/companies\/([\w-]+)$/, (root, [, slug]) => renderCompany(root, { store, slug }), 'companies'],
  [/^#\/modes$/, (root) => renderModesHub(root), 'modes'],
  [/^#\/interview$/, (root) => renderInterview(root, { store }), 'modes'],
  [/^#\/battle$/, (root) => renderBattle(root, { store }), 'modes'],
];

function renderProblem(root, id) {
  const problem = getProblem(id);
  if (!problem) return renderNotFound(root, `Problem "${id}" does not exist or is not published yet.`);
  return renderWorkspace(root, { problem, store });
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
