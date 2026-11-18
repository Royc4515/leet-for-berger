/**
 * Header control for accounts: "Sign in" (Google or GitHub) when signed out, the user and
 * "Sign out" when signed in, nothing when accounts are not configured.
 */
import { h, mount } from './dom.js';

const SYNC_LABEL = { idle: '', syncing: 'Syncing...', synced: 'Progress synced', error: 'Sync failed' };

/**
 * @param {HTMLElement} host
 * @param {ReturnType<import('../auth/account.js').createAccount>} account
 */
export function mountAccountMenu(host, account) {
  const render = (s) => {
    if (s.status === 'off') return mount(host);
    if (s.status === 'loading') return mount(host, h('span.account-note', {}, ''));
    if (s.status === 'signed-out') {
      const menu = h('div.account-menu', { hidden: true, role: 'menu' },
        h('button.btn.btn-secondary.btn-sm', { type: 'button', role: 'menuitem', onClick: () => account.signIn('google') }, 'Continue with Google'),
        h('button.btn.btn-secondary.btn-sm', { type: 'button', role: 'menuitem', onClick: () => account.signIn('github') }, 'Continue with GitHub'),
        h('p.hint-text', {}, 'Signing in syncs your progress across devices.'),
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
    return mount(
      host,
      h(
        'div.account',
        {},
        h('span.account-name', { title: s.user.email ?? '' }, who),
        SYNC_LABEL[s.sync] ? h(`span.account-note${s.sync === 'error' ? '.bad' : ''}`, { title: s.error ?? '' }, SYNC_LABEL[s.sync]) : null,
        h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: () => account.signOut() }, 'Sign out'),
      ),
    );
  };
  render(account.get());
  return account.subscribe(render);
}
