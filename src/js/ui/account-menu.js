/**
 * Header control for accounts: "Sign in" (Google or GitHub) when signed out, the user and
 * "Sign out" when signed in, nothing when accounts are not configured.
 */
import { h, mount } from './dom.js';

const SYNC_LABEL = { idle: '', syncing: 'Syncing...', synced: 'Progress synced', error: 'Sync failed' };

/**
 * @param {HTMLElement} host
 * @param {ReturnType<import('../auth/account.js').createAccount>} account
 * @param {ReturnType<import('../auth/github-sync.js').createGitHubSync>|null} [github]
 */
export function mountAccountMenu(host, account, github = null) {
  const render = (s) => {
    if (s.status === 'off') return mount(host);
    if (s.status === 'loading') return mount(host, h('span.account-note', {}, ''));
    if (s.status === 'signed-out') {
      const menu = h('div.account-menu', { hidden: true, role: 'menu' },
        h('button.btn.btn-secondary.btn-sm', { type: 'button', role: 'menuitem', onClick: () => account.signIn('google') }, 'Continue with Google'),
        h('button.btn.btn-secondary.btn-sm', { type: 'button', role: 'menuitem', onClick: () => account.signIn('github') }, 'Continue with GitHub'),
        h('p.hint-text', {}, 'Signing in syncs your progress across devices. ', h('a', { href: 'privacy.html' }, 'Privacy Policy')),
        s.error ? h('p.hint-text', { role: 'alert' }, s.error) : null,
      );
      const toggle = h('button.btn.btn-ghost.btn-sm', { type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, 'Sign in');
      toggle.addEventListener('click', () => {
        menu.hidden = !menu.hidden;
        toggle.setAttribute('aria-expanded', String(!menu.hidden));
      });
      return mount(host, h('div.account', {}, toggle, menu));
    }
    const who = s.user.name ?? s.user.email ?? 'Signed in';
    const panel = h('div.account-menu', { hidden: true, role: 'menu' }, githubSection(github), h('button.btn.btn-ghost.btn-sm', { type: 'button', role: 'menuitem', onClick: () => account.signOut() }, 'Sign out'));
    const toggle = h('button.btn.btn-ghost.btn-sm.account-name', { type: 'button', title: s.user.email ?? '', 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, who);
    toggle.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
    });
    return mount(
      host,
      h(
        'div.account',
        {},
        SYNC_LABEL[s.sync] ? h(`span.account-note${s.sync === 'error' ? '.bad' : ''}`, { title: s.error ?? '' }, SYNC_LABEL[s.sync]) : null,
        toggle,
        panel,
      ),
    );
  };
  // A menu left open would cover the toolbar on the next page: close it on navigation, on a click
  // anywhere else, and on Escape.
  const close = () => {
    const menu = host.querySelector('.account-menu');
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    host.querySelector('[aria-haspopup]')?.setAttribute('aria-expanded', 'false');
  };
  const onDocClick = (e) => !host.contains(e.target) && close();
  const onKey = (e) => e.key === 'Escape' && close();
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', close);

  render(account.get());
  const unsubs = [account.subscribe(render), () => document.removeEventListener('click', onDocClick), () => document.removeEventListener('keydown', onKey), () => window.removeEventListener('hashchange', close)];
  if (github) unsubs.push(github.subscribe(() => render(account.get())));
  return () => unsubs.forEach((u) => u());
}

/** GitHub sync controls in the signed-in menu (ADR 0007); nothing when sync is not set up. */
function githubSection(github) {
  if (!github?.available) return null;
  const link = github.get();
  const title = h('div.account-section-title', {}, 'GitHub sync');
  if (!link) return h('div.account-section', {}, title, h('p.hint-text', {}, 'Checking...'));
  if (!link.linked) {
    return h(
      'div.account-section',
      {},
      title,
      link.githubUser === false
        ? h('p.hint-text', {}, 'Sign in with GitHub to save your accepted solutions to a repository of yours.')
        : [h('p.hint-text', {}, 'Save each accepted solution to a GitHub repository you choose. Give the app access to that one repository only.'), h('a.btn.btn-secondary.btn-sm', { href: github.installUrl, role: 'menuitem' }, 'Connect a repository')],
    );
  }
  const auto = h('input', { type: 'checkbox', id: 'gh-auto', checked: link.autoSync });
  auto.addEventListener('change', () => github.setAutoSync(auto.checked).catch(() => (auto.checked = !auto.checked)));
  return h(
    'div.account-section',
    {},
    title,
    h('p.hint-text', {}, 'Syncing to ', h('a', { href: `https://github.com/${link.repo}`, target: '_blank', rel: 'noopener' }, link.repo)),
    h('label.switch', { for: 'gh-auto' }, auto, h('span', {}, 'After every Accepted')),
    h('p.hint-text', {}, 'Solved after revealing the solution? Push it by hand from Submissions; it is marked assisted.'),
    h('button.btn.btn-ghost.btn-sm', { type: 'button', role: 'menuitem', onClick: () => github.disconnect() }, 'Disconnect'),
  );
}
