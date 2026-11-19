/**
 * Header control for accounts: "Sign in" (Google or GitHub) when signed out, the user and
 * "Sign out" when signed in, nothing when accounts are not configured.
 */
import { h, mount } from './dom.js';
import { newRepoUrl } from '../auth/github-sync.js';

const SYNC_LABEL = { idle: '', syncing: 'Syncing...', synced: 'Progress synced', error: 'Sync failed' };

/**
 * @param {HTMLElement} host
 * @param {ReturnType<import('../auth/account.js').createAccount>} account
 * @param {ReturnType<import('../auth/github-sync.js').createGitHubSync>|null} [github]
 */
export function mountAccountMenu(host, account, github = null) {
  // Re-renders (sync status after every submit, the GitHub link arriving) must not close an open
  // menu or reset the connect wizard: the open state lives here, and the GitHub section is rebuilt
  // only when the link itself changes.
  let open = false;
  let ghLink;
  let ghEl = null;
  const ghSection = () => {
    const link = github?.get();
    if (ghEl === null || link !== ghLink) {
      ghLink = link;
      ghEl = githubSection(github);
    }
    return ghEl;
  };
  const render = (s) => {
    if (s.status === 'off') return mount(host);
    if (s.status === 'loading') return mount(host, h('span.account-note', {}, ''));
    if (s.status === 'signed-out') {
      const menu = h('div.account-menu', { hidden: !open, role: 'menu' },
        h('button.btn.btn-secondary.btn-sm', { type: 'button', role: 'menuitem', onClick: () => account.signIn('google') }, 'Continue with Google'),
        h('button.btn.btn-secondary.btn-sm', { type: 'button', role: 'menuitem', onClick: () => account.signIn('github') }, 'Continue with GitHub'),
        h('p.hint-text', {}, 'Signing in syncs your progress across devices. ', h('a', { href: 'privacy.html' }, 'Privacy Policy')),
        s.error ? h('p.hint-text', { role: 'alert' }, s.error) : null,
      );
      const toggle = h('button.btn.btn-ghost.btn-sm', { type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': String(open) }, 'Sign in');
      toggle.addEventListener('click', () => {
        open = menu.hidden;
        menu.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
      });
      return mount(host, h('div.account', {}, toggle, menu));
    }
    const who = s.user.name ?? s.user.email ?? 'Signed in';
    const panel = h('div.account-menu', { hidden: !open, role: 'menu' }, ghSection(), h('button.btn.btn-ghost.btn-sm', { type: 'button', role: 'menuitem', onClick: () => account.signOut() }, 'Sign out'));
    const toggle = h('button.btn.btn-ghost.btn-sm.account-name', { type: 'button', title: s.user.email ?? '', 'aria-haspopup': 'menu', 'aria-expanded': String(open) }, who);
    toggle.addEventListener('click', () => {
      open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
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
    open = false;
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    host.querySelector('[aria-haspopup]')?.setAttribute('aria-expanded', 'false');
  };
  // don't touch / composedPath, not host.contains(e.target): a wizard step replaces the button that
  // was clicked, so by the time the click reaches document its target is detached and looks "outside".
  const onDocClick = (e) => !e.composedPath().includes(host) && close();
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
        : connectWizard(github),
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

/**
 * Connecting a repository: "Do you have one?" Yes goes straight to the app's install page; no
 * first opens GitHub's new-repository page, prefilled, then the install page. One repository only.
 */
function connectWizard(github) {
  const body = h('div.gh-wizard');
  const installNote = h('p.hint-text', {}, 'On GitHub choose "Only select repositories" and pick that one repository.');
  const connect = (label) => h('a.btn.btn-secondary.btn-sm', { href: github.installUrl, role: 'menuitem' }, label);
  const ask = () =>
    mount(
      body,
      h('p.hint-text', {}, 'Save each accepted solution to a GitHub repository of yours. Do you have a repository for them?'),
      h(
        'div.gh-wizard-actions',
        {},
        h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: () => mount(body, installNote, connect('Connect it'), back()) }, 'Yes'),
        h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: create }, 'No, create one'),
      ),
    );
  const back = () => h('button.btn-link', { type: 'button', onClick: ask }, 'Back');
  function create() {
    const priv = h('input', { type: 'radio', name: 'gh-vis', id: 'gh-vis-private', value: 'private', checked: true });
    const pub = h('input', { type: 'radio', name: 'gh-vis', id: 'gh-vis-public', value: 'public' });
    const link = h('a.btn.btn-secondary.btn-sm', { href: newRepoUrl(), target: '_blank', rel: 'noopener', role: 'menuitem' }, '1. Create it on GitHub');
    const update = () => link.setAttribute('href', newRepoUrl({ visibility: pub.checked ? 'public' : 'private' }));
    priv.addEventListener('change', update);
    pub.addEventListener('change', update);
    mount(
      body,
      h(
        'fieldset.gh-vis',
        {},
        h('legend.hint-text', {}, 'Visibility'),
        h('label', { for: 'gh-vis-private' }, priv, ' Private'),
        h('label', { for: 'gh-vis-public' }, pub, ' Public (a portfolio others can see)'),
        h('p.hint-text', {}, 'You can make it public later in GitHub settings.'),
      ),
      link,
      h('p.hint-text', {}, 'It opens prefilled as leetcode-solutions; rename it if you like. Then:'),
      installNote,
      connect('2. Connect it'),
      back(),
    );
  }
  ask();
  return body;
}
