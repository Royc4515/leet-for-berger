/**
 * Header control for accounts: "Sign in" (Google or GitHub) when signed out, the user and
 * "Sign out" when signed in, nothing when accounts are not configured.
 */
import { h, mount, confirmDialog, toast } from './dom.js';
import { newRepoUrl } from '../auth/github-sync.js';
import { userInitials } from '../auth/account.js';

const MENU_ID = 'account-panel';
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
  let pendingFocus = null;
  let ghLink;
  let ghEl = null;

  // A disclosure panel, not an ARIA menu: it holds hints, a wizard and radios, which role="menu"
  // does not allow. Arrow keys still move between its controls as a convenience; links inside
  // hint text (Privacy Policy, the synced repository) stay reachable with Tab only.
  const menuItems = () =>
    [...host.querySelectorAll('.account-menu :is(a[href], button, input:not([type="radio"]))')].filter((el) => !el.disabled && !el.closest('.hint-text') && el.getClientRects().length > 0);

  const captureFocus = () => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !host.contains(active)) return null;
    if (active.matches('.account-toggle')) return { kind: 'toggle' };
    const list = menuItems();
    const index = list.indexOf(active);
    return index >= 0 ? { kind: 'item', index } : null;
  };

  const restoreFocus = (target) => {
    if (!target) return;
    const toggle = host.querySelector('.account-toggle');
    if (target.kind === 'item' && open) {
      const list = menuItems();
      (list[Math.min(target.index, list.length - 1)] ?? toggle)?.focus({ preventScroll: true });
    } else {
      toggle?.focus({ preventScroll: true });
    }
  };

  const setOpen = (next, { focusItem = null, returnFocus = false } = {}) => {
    const wasOpen = open;
    open = next;
    const menu = host.querySelector('.account-menu');
    const backdrop = host.querySelector('.account-backdrop');
    const toggle = host.querySelector('.account-toggle');
    if (menu) menu.hidden = !open;
    if (backdrop) backdrop.hidden = !open;
    toggle?.setAttribute('aria-expanded', String(open));
    if (open && focusItem) {
      const list = menuItems();
      (focusItem === 'last' ? list[list.length - 1] : list[0])?.focus({ preventScroll: true });
    } else if (!open && wasOpen && returnFocus) {
      toggle?.focus({ preventScroll: true });
    }
  };

  // A menu left open would cover the toolbar on the next page: close it on navigation, on a click
  // anywhere else, and on Escape.
  const close = ({ returnFocus = false } = {}) => setOpen(false, { returnFocus });

  const ghSection = () => {
    const link = github?.get();
    if (ghEl === null || link !== ghLink) {
      ghLink = link;
      ghEl = githubSection(github, { closeMenu: () => close({ returnFocus: true }) });
    }
    return ghEl;
  };

  const confirmSignOut = async () => {
    close({ returnFocus: true });
    const ok = await confirmDialog({
      title: 'Sign out?',
      body: 'Your progress stays in your account and is removed from this device.',
      confirmLabel: 'Sign out',
      danger: true,
    });
    if (!ok || (await account.signOut())) return;
    if (!account.get().user) return;
    const anyway = await confirmDialog({
      title: 'Sign out without saving?',
      body: 'Your latest progress could not be saved to your account. Signing out now removes it from this device.',
      confirmLabel: 'Sign out anyway',
      danger: true,
    });
    if (anyway) await account.signOut({ force: true });
  };

  const bindToggle = (toggle, onOpen) => {
    toggle.addEventListener('click', () => {
      const next = !open;
      setOpen(next);
      if (next) onOpen?.();
    });
    toggle.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      // don't touch / stop propagation so the document keydown listener does not advance a second item.
      e.stopPropagation();
      const target = e.key === 'ArrowDown' ? 'first' : 'last';
      if (!open) {
        setOpen(true, { focusItem: target });
        onOpen?.();
      } else {
        const list = menuItems();
        (target === 'last' ? list[list.length - 1] : list[0])?.focus({ preventScroll: true });
      }
    });
  };

  const makeBackdrop = () =>
    h('div.account-backdrop', {
      hidden: !open,
      'aria-hidden': 'true',
      onClick: (e) => {
        e.stopPropagation();
        close({ returnFocus: true });
      },
    });

  const render = (s) => {
    const currentFocus = captureFocus();
    if (s.status === 'off') {
      pendingFocus = null;
      return mount(host);
    }
    if (s.status === 'loading') {
      if (currentFocus) pendingFocus = currentFocus;
      return mount(host, h('span.account-note', {}, ''));
    }
    const focusToRestore = currentFocus ?? pendingFocus;
    pendingFocus = null;
    if (s.status === 'signed-out') {
      const menu = h('div.account-menu', { hidden: !open, id: MENU_ID },
        h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => account.signIn('google') }, 'Continue with Google'),
        h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => account.signIn('github') }, 'Continue with GitHub'),
        h('p.hint-text', {}, 'Signing in syncs your progress across devices. ', h('a', { href: 'privacy.html' }, 'Privacy Policy')),
        s.error ? h('p.hint-text', { role: 'alert' }, s.error) : null,
        h('a.btn.btn-ghost.btn-sm.account-profile-link', { href: '#/me' }, 'Profile and settings'),
      );
      const toggle = h('button.btn.btn-ghost.btn-sm.account-toggle', { type: 'button', 'aria-controls': MENU_ID, 'aria-expanded': String(open) }, 'Sign in');
      // Opening the menu is the intent to sign in: start loading supabase-js now (a no-op once loaded).
      bindToggle(toggle, () => account.start());
      mount(host, h('div.account', {}, toggle, makeBackdrop(), menu));
      restoreFocus(focusToRestore);
      return;
    }
    const who = s.user.name ?? s.user.email ?? 'Signed in';
    const syncLabel = SYNC_LABEL[s.sync];
    // On a phone the header shows only the initials and a status dot (app.css), so the panel
    // says who is signed in and how the sync went.
    const me = h(
      'div.account-section.account-me',
      {},
      h('span.account-section-title', {}, 'Signed in as'),
      h('strong.account-me-name', { dir: 'auto' }, who),
      s.user.name && s.user.email ? h('span.hint-text', {}, s.user.email) : null,
      syncLabel ? h(`span.account-me-sync${s.sync === 'error' ? '.bad' : ''}`, {}, syncLabel) : null,
    );
    const panel = h(
      'div.account-menu',
      { hidden: !open, id: MENU_ID },
      me,
      ghSection(),
      s.error ? h('p.hint-text', { role: 'alert' }, s.error) : null,
      h('a.btn.btn-ghost.btn-sm.account-profile-link', { href: '#/me' }, 'Profile and settings'),
      h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: confirmSignOut }, 'Sign out'),
    );
    // The name stays in the button for its accessible name; on a phone it is visually hidden
    // behind the initials badge, which is decoration.
    const toggle = h(
      'button.btn.btn-ghost.btn-sm.account-toggle.account-name',
      { type: 'button', title: s.user.email ?? '', 'aria-controls': MENU_ID, 'aria-expanded': String(open) },
      h('span.account-avatar', { 'aria-hidden': 'true' }, userInitials(s.user)),
      h('span.account-name-text', {}, who),
    );
    bindToggle(toggle);
    mount(
      host,
      h(
        'div.account',
        { 'data-sync': s.sync },
        syncLabel ? h(`span.account-note${s.sync === 'error' ? '.bad' : ''}`, { title: s.error ?? '' }, syncLabel) : null,
        toggle,
        makeBackdrop(),
        panel,
      ),
    );
    restoreFocus(focusToRestore);
  };

  // don't touch / composedPath, not host.contains(e.target): a wizard step replaces the button that
  // was clicked, so by the time the click reaches document its target is detached and looks "outside".
  const onDocClick = (e) => {
    if (!open || e.composedPath().includes(host)) return;
    const clickedControl = e.target instanceof Element && Boolean(e.target.closest('a, button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'));
    close({ returnFocus: !clickedControl });
  };
  const onKey = (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close({ returnFocus: true });
      return;
    }
    // Preserve native arrow-key selection inside radio groups (e.g. GitHub repo visibility).
    if (e.target instanceof Element && e.target.matches('input[type="radio"]')) return;
    if (!host.contains(document.activeElement)) return;
    const list = menuItems();
    if (!list.length) return;
    const idx = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      list[(idx + 1) % list.length].focus({ preventScroll: true });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      list[idx <= 0 ? list.length - 1 : idx - 1].focus({ preventScroll: true });
    } else if (e.key === 'Home') {
      e.preventDefault();
      list[0].focus({ preventScroll: true });
    } else if (e.key === 'End') {
      e.preventDefault();
      list[list.length - 1].focus({ preventScroll: true });
    }
  };
  const onHash = () => close();
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', onHash);

  render(account.get());
  const unsubs = [account.subscribe(render), () => document.removeEventListener('click', onDocClick), () => document.removeEventListener('keydown', onKey), () => window.removeEventListener('hashchange', onHash)];
  if (github) unsubs.push(github.subscribe(() => render(account.get())));
  return () => unsubs.forEach((u) => u());
}

/** GitHub sync controls in the signed-in menu (ADR 0007); nothing when sync is not set up. */
/**
 * GitHub sync controls: the connect wizard, or the linked repository with auto-sync and Disconnect.
 * Shared by the account panel and the profile page.
 * @param {any} github createGitHubSync() result, or null
 * @param {{ closeMenu?: () => void }} [opts]
 * @returns {HTMLElement|null} null when GitHub sync is not set up on this site
 */
export function githubSection(github, { closeMenu = () => {} } = {}) {
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
    h(
      'button.btn.btn-ghost.btn-sm',
      {
        type: 'button',
        onClick: async () => {
          closeMenu();
          const ok = await confirmDialog({
            title: 'Disconnect GitHub?',
            body: `New solutions will stop being saved to ${link.repo}. Nothing in the repository is deleted.`,
            confirmLabel: 'Disconnect',
            danger: true,
          });
          if (ok) github.disconnect().catch((err) => toast(`GitHub sync: ${err.message}`, 'error', 6000));
        },
      },
      'Disconnect',
    ),
  );
}

/**
 * Connecting a repository: "Do you have one?" Yes goes straight to the app's install page; no
 * first opens GitHub's new-repository page, prefilled, then the install page. One repository only.
 */
function connectWizard(github) {
  const body = h('div.gh-wizard');
  const installNote = h('p.hint-text', {}, 'On GitHub choose "Only select repositories" and pick that one repository.');
  const connect = (label) => h('a.btn.btn-secondary.btn-sm', { href: github.installUrl }, label);
  // Each step replaces the button that was just pressed, which drops keyboard focus to <body>.
  // Move it to the new step's first control instead (only on a user action, never on first render).
  const show = (...children) => {
    mount(body, ...children);
    body.querySelector('a[href], button, input')?.focus({ preventScroll: true });
  };
  const askStep = () => [
    h('p.hint-text', {}, 'Save each accepted solution to a GitHub repository of yours. Do you have a repository for them?'),
    h(
      'div.gh-wizard-actions',
      {},
      h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: () => show(installNote, connect('Connect it'), back()) }, 'Yes'),
      h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: create }, 'No, create one'),
    ),
  ];
  const back = () => h('button.btn-link', { type: 'button', onClick: () => show(askStep()) }, 'Back');
  function create() {
    const priv = h('input', { type: 'radio', name: 'gh-vis', id: 'gh-vis-private', value: 'private', checked: true });
    const pub = h('input', { type: 'radio', name: 'gh-vis', id: 'gh-vis-public', value: 'public' });
    const link = h('a.btn.btn-secondary.btn-sm', { href: newRepoUrl(), target: '_blank', rel: 'noopener' }, '1. Create it on GitHub');
    const update = () => link.setAttribute('href', newRepoUrl({ visibility: pub.checked ? 'public' : 'private' }));
    priv.addEventListener('change', update);
    pub.addEventListener('change', update);
    show(
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
  mount(body, askStep());
  return body;
}
