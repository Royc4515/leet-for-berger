/**
 * Profile (#/me, owner's request): who you are signed in as, where you stand, and every account
 * setting in one place: the leaderboard nickname, the themes, the quiz language, the page guides,
 * the reminders, GitHub sync, signing out and your data. Works signed out too, for the progress kept in this browser.
 */
import { h, mount, segmented, confirmDialog, toast } from '../dom.js';
import { siteFooter } from '../footer.js';
import { services } from '../../auth/services.js';
import { userInitials } from '../../auth/account.js';
import { createQuizBoard } from '../../auth/quiz-board.js';
import { githubSection } from '../account-menu.js';
import { profileNumbers, normalizeNickname, NICKNAME_MIN, NICKNAME_MAX } from '../../data/profile.js';
import { loadQuizProgress } from '../../state/quiz-progress.js';
import { clearUserData, LAST_SESSIONS_KEY } from '../../state/user-data.js';
import { saveSeen } from '../../state/tours.js';
import { siteThemeControl, codeThemeSelect } from '../theme.js';
import { dayKey, restDayOf, setRestDay } from '../../state/progress.js';
import { NOTIFICATION_KINDS } from '../../data/notifications.js';
import { loadNotificationState, saveNotificationState, setKindEnabled, isKindEnabled, NOTIFICATIONS_CHANGED_EVENT } from '../../state/notifications.js';
import { createPushPanel } from '../push-panel.js';
import { parseLastResults, formatLastInterview, formatLastBattle } from '../../modes/last-results.js';

const SYNC_TEXT = { idle: '', syncing: 'Syncing your progress...', synced: 'Progress synced to your account', error: 'Sync failed. Your progress is safe on this device and syncs again on your next solve.' };
const LANG_KEY = 'lfb:quiz-lang';
/** Rest day choices, Sunday first as the Israeli week; the value is getDay(), or 'none'. */
const REST_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** What each reminder kind is called on its switch (data/notifications.js NOTIFICATION_KINDS). */
const REMINDER_LABELS = { streak: 'Coding streak', 'quiz-streak': 'Daily quiz streak', away: 'Welcome back after a few days away', unfinished: 'Problems you left unfinished', restart: 'Start a new streak after a break' };

const readLang = () => {
  try {
    return localStorage.getItem(LANG_KEY) === 'he' ? 'he' : 'en';
  } catch {
    return 'en';
  }
};

const readLast = () => {
  try {
    return parseLastResults(localStorage.getItem(LAST_SESSIONS_KEY));
  } catch {
    return { interview: null, battle: null };
  }
};

/**
 * @param {HTMLElement} root
 * @param {{ store: any }} opts
 * @returns {() => void} cleanup
 */
export function renderProfile(root, { store }) {
  const account = services.account;
  const github = services.github;
  const accounts = Boolean(account?.config?.enabled);
  let disposed = false;
  // The leaderboard name is fetched once per sign-in, not on every redraw.
  let nickname = { state: 'idle', name: '', custom: false };
  let nicknameFor = null;
  let editing = false;
  // The GitHub block holds a step-by-step wizard: rebuilt only when the link itself changes, so a
  // redraw (a sync finishing) never sends the user back to its first step.
  let ghLink;
  let ghEl = null;

  const section = (id, title, ...body) => h(`section.profile-section#profile-${id}`, { 'aria-labelledby': `profile-${id}-title` }, h('h2.profile-section-title', { id: `profile-${id}-title` }, title), ...body);

  /** Who is signed in, or how to sign in, or that this site has no accounts. */
  function identity(s) {
    if (s?.status === 'signed-in') {
      const who = s.user.name ?? s.user.email ?? 'Signed in';
      const sync = SYNC_TEXT[s.sync] ?? '';
      return h(
        'section.profile-id',
        { 'aria-label': 'Account' },
        h('span.profile-avatar', { 'aria-hidden': 'true' }, userInitials(s.user)),
        h(
          'div.profile-id-copy',
          {},
          h('strong.profile-name', { dir: 'auto' }, who),
          s.user.name && s.user.email ? h('span.hint-text', {}, s.user.email) : null,
          sync ? h(`span.profile-sync${s.sync === 'error' ? '.bad' : s.sync === 'synced' ? '.ok' : ''}`, {}, sync) : null,
        ),
        h('div.profile-id-actions', {}, h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: signOut }, 'Sign out')),
      );
    }
    if (accounts) {
      return h(
        'section.profile-id',
        { 'aria-label': 'Account' },
        h('span.profile-avatar.is-guest', { 'aria-hidden': 'true' }),
        h('div.profile-id-copy', {}, h('strong.profile-name', {}, 'Not signed in'), h('span.hint-text', {}, 'Your progress is saved in this browser only. Sign in to keep it on every device and join the daily quiz leaderboard.')),
        h(
          'div.profile-id-actions',
          {},
          h('button.btn.btn-primary.btn-sm', { type: 'button', onClick: () => account.signIn('google') }, 'Continue with Google'),
          h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => account.signIn('github') }, 'Continue with GitHub'),
        ),
      );
    }
    return h(
      'section.profile-id',
      { 'aria-label': 'Account' },
      h('span.profile-avatar.is-guest', { 'aria-hidden': 'true' }),
      h('div.profile-id-copy', {}, h('strong.profile-name', {}, 'Your progress'), h('span.hint-text', {}, 'Accounts are not set up on this copy of the site, so your progress is saved in this browser.')),
    );
  }

  /** The numbers, the last interview and race, and where to see more. */
  function progressSection(signedIn) {
    const n = profileNumbers({ progress: store.get(), quiz: loadQuizProgress(), now: new Date() });
    const last = readLast();
    const interview = formatLastInterview(last.interview);
    const battle = formatLastBattle(last.battle);
    const cell = (value, label) => h('div.stat-cell', {}, h('div.stat-value', {}, value), h('div.stat-label', {}, label));
    return section(
      'progress',
      'Your progress',
      h(
        'div.stats-row.profile-stats',
        {},
        cell(`${n.solved}`, 'Solved'),
        cell(`${n.streak} ${n.streak === 1 ? 'day' : 'days'}`, 'Coding streak'),
        cell(n.accuracy == null ? '-' : `${n.accuracy}%`, 'Accuracy'),
        cell(`${n.quizStreak} ${n.quizStreak === 1 ? 'day' : 'days'}`, 'Quiz streak'),
      ),
      h(
        'ul.profile-facts',
        {},
        h('li', {}, `${n.submissions} ${n.submissions === 1 ? 'submission' : 'submissions'}, ${n.quizDays} daily ${n.quizDays === 1 ? 'quiz' : 'quizzes'}, ${n.quizAnswered} quiz ${n.quizAnswered === 1 ? 'question' : 'questions'} answered`),
        interview ? h('li', {}, interview.text) : null,
        battle ? h('li', {}, battle.text) : null,
      ),
      signedIn ? h('p.hint-text', {}, 'Problems, streaks and quiz progress sync to your account, so they are the same on every device.') : null,
      h('div.profile-links', {}, h('a.btn.btn-ghost.btn-sm', { href: '#/daily' }, 'Calendar'), h('a.btn.btn-ghost.btn-sm', { href: '#/map' }, 'Map'), h('a.btn.btn-ghost.btn-sm', { href: '#/quiz' }, 'Quiz topics')),
    );
  }

  /** The name other players see on the daily quiz leaderboard. Signed in only. */
  function nicknameSection(s) {
    if (s?.status !== 'signed-in') return null;
    if (nicknameFor !== s.user.id) {
      nicknameFor = s.user.id;
      loadNickname();
    }
    let body;
    if (nickname.state === 'loading' || nickname.state === 'idle') body = h('p.hint-text', {}, 'Loading your leaderboard name...');
    else if (nickname.state === 'error') body = h('p.hint-text', {}, 'The leaderboard is unavailable right now, so the name cannot be changed. Try again later.');
    else if (!editing) {
      body = h(
        'div.profile-row',
        {},
        h('span', {}, 'Shown as ', h('strong', { dir: 'auto' }, nickname.name), nickname.custom ? null : h('span.hint-text', {}, ' (your account name)')),
        h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => { editing = true; draw(); queueMicrotask(() => root.querySelector('#profile-nickname-input')?.focus()); } }, 'Change'),
      );
    } else {
      const input = h('input.quiz-name-input#profile-nickname-input', { type: 'text', maxlength: String(NICKNAME_MAX), autocomplete: 'nickname', dir: 'auto', value: nickname.custom ? nickname.name : '', placeholder: nickname.name, 'aria-describedby': 'profile-nickname-hint' });
      body = h(
        'form.profile-form',
        {
          onSubmit: (e) => {
            e.preventDefault();
            const { name, ok } = normalizeNickname(input.value);
            if (!ok) {
              toast(`Use ${NICKNAME_MIN} to ${NICKNAME_MAX} characters.`, 'error');
              input.focus();
              return;
            }
            saveNickname(name);
          },
        },
        h('label.quiz-label', { for: 'profile-nickname-input' }, 'Nickname'),
        input,
        h('p.hint-text#profile-nickname-hint', {}, `${NICKNAME_MIN} to ${NICKNAME_MAX} characters. Everyone on the leaderboard sees it. Leave it empty to use your account name.`),
        h('div.profile-links', {}, h('button.btn.btn-primary.btn-sm', { type: 'submit' }, 'Save'), h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: () => { editing = false; draw(); } }, 'Cancel')),
      );
    }
    return section('nickname', 'Leaderboard name', body);
  }

  async function loadNickname() {
    nickname = { state: 'loading', name: '', custom: false };
    try {
      const board = await createQuizBoard({ account }).board(dayKey(new Date()));
      if (disposed) return;
      nickname = board.me ? { state: 'ready', name: board.me.name, custom: Boolean(board.me.custom) } : { state: 'error', name: '', custom: false };
    } catch {
      if (disposed) return;
      nickname = { state: 'error', name: '', custom: false };
    }
    draw();
  }

  async function saveNickname(name) {
    try {
      const saved = await createQuizBoard({ account }).setName(name);
      if (disposed) return;
      nickname = { state: 'ready', name: saved?.name ?? name, custom: saved?.custom ?? Boolean(name) };
      editing = false;
      toast('Name saved', 'success');
    } catch {
      toast('Could not save the name. Try again.', 'error');
    }
    draw();
  }

  /** Device preferences: the site and code themes. Built once: a redraw keeps the same controls. */
  const themes = new AbortController();
  const codeSelect = codeThemeSelect(themes.signal);
  codeSelect.id = 'profile-code-theme';
  const appearance = section(
    'appearance',
    'Appearance',
    h('div.profile-field', {}, h('span.quiz-label', {}, 'Site theme'), siteThemeControl(themes.signal), h('p.hint-text', {}, 'System follows your device.')),
    h('div.profile-field', {}, h('label.quiz-label', { for: codeSelect.id }, 'Code theme'), codeSelect, h('p.hint-text', {}, 'The editor\'s colours. Match site follows the site theme.')),
  );

  /**
   * The streak rest day (owner's decision): a day off on it never breaks either streak. Part of the
   * progress record, so it follows the account. Built once: choosing redraws the page through the
   * store, and a rebuilt select would drop keyboard focus.
   */
  const restSelect = h(
    'select.select#profile-rest-day',
    {},
    REST_DAYS.map((name, day) => h('option', { value: String(day) }, day === 6 ? `${name} (default)` : name)),
    h('option', { value: 'none' }, 'No rest day'),
  );
  restSelect.addEventListener('change', () => {
    const day = restSelect.value === 'none' ? null : Number(restSelect.value);
    store.update((s) => setRestDay(s, day, new Date()));
    toast(day === null ? 'Every day now counts for your streaks' : `Your streaks rest on ${REST_DAYS[day]}`, 'success');
    restSelect.focus({ preventScroll: true });
  });
  const restField = h(
    'div.profile-field',
    {},
    h('label.quiz-label', { for: restSelect.id }, 'Streak rest day'),
    restSelect,
    h('p.hint-text', {}, 'A day off on it never breaks your coding or quiz streak, and practice on it still counts.'),
  );

  /** Device preferences: the quiz language and the page guides; the streak rest day. */
  function preferencesSection() {
    const rest = restDayOf(store.get());
    restSelect.value = rest === null ? 'none' : String(rest);
    return section(
      'preferences',
      'Preferences',
      h(
        'div.profile-field',
        {},
        h('span.quiz-label', {}, 'Quiz language'),
        segmented({
          label: 'Quiz language',
          options: [{ value: 'en', label: 'English' }, { value: 'he', label: 'עברית' }],
          value: readLang(),
          onChange: (v) => {
            try {
              localStorage.setItem(LANG_KEY, v);
            } catch {
              /* storage blocked: the quiz page asks again */
            }
            toast(v === 'he' ? 'Quizzes will be in Hebrew' : 'Quizzes will be in English', 'success');
          },
        }),
        h('p.hint-text', {}, 'Shared links are written in this language too.'),
      ),
      h(
        'div.profile-field',
        {},
        h('span.quiz-label', {}, 'Page guides'),
        h('div.profile-row', {}, h('span.hint-text', {}, 'Each page shows a short guide on your first visit.'), h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => { saveSeen({}); toast('Guides will show again on each page', 'success'); } }, 'Show them again')),
      ),
      restField,
    );
  }

  /**
   * Notifications on this device and the hours they come at (ADR 0011). Built once, like the
   * selects above: it keeps its own state across redraws (ui/push-panel.js). Null without accounts.
   */
  const pushPanel = createPushPanel({
    account,
    restDay: () => restDayOf(store.get()),
    offKinds: () => {
      const state = loadNotificationState();
      return NOTIFICATION_KINDS.filter((kind) => !isKindEnabled(state, kind));
    },
    // Reminders already reach a device of this account: its kinds are the ones those devices get.
    onServerKinds: (off) => {
      const before = loadNotificationState();
      const after = NOTIFICATION_KINDS.reduce((s, kind) => setKindEnabled(s, kind, !off.includes(kind)), before);
      if (NOTIFICATION_KINDS.every((kind) => isKindEnabled(before, kind) === isKindEnabled(after, kind))) return;
      saveNotificationState(after);
      dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
      redraw();
    },
  });

  /**
   * Reminders (stage F7): this device's notifications, then which kinds come, for the header bell
   * and the notifications alike. Every kind starts on.
   */
  function remindersSection() {
    const state = loadNotificationState();
    const switches = NOTIFICATION_KINDS.map((kind) => {
      const input = h('input', { type: 'checkbox', id: `reminder-${kind}`, checked: isKindEnabled(state, kind) });
      input.addEventListener('change', () => {
        saveNotificationState(setKindEnabled(loadNotificationState(), kind, input.checked));
        dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
        pushPanel?.kindsChanged();
      });
      return h('label.switch', { for: input.id }, input, h('span', {}, REMINDER_LABELS[kind]));
    });
    return section(
      'reminders',
      'Reminders',
      h(
        'p.hint-text',
        {},
        pushPanel
          ? 'A streak that ends tonight, the daily quiz, a problem you left. The bell in the header shows them while the site is open; notifications reach your devices when it is closed.'
          : 'The bell in the header lists what needs you: a streak that ends tonight, the daily quiz, a problem you left. Only while this site is open.',
      ),
      pushPanel?.el,
      h('div.profile-field.push-kinds', {}, h('h3.push-sub', {}, 'What to remind you about'), h('div.profile-switches', {}, switches)),
    );
  }

  /** GitHub sync, when this site has it and the user is signed in. */
  function githubBlock(s) {
    if (s?.status !== 'signed-in' || !github) return null;
    if (ghEl === null || github.get() !== ghLink) {
      ghLink = github.get();
      ghEl = githubSection(github);
      // The shared block brings its own small title; the page has a heading instead.
      ghEl?.querySelector('.account-section-title')?.remove();
    }
    return ghEl ? section('github', 'GitHub sync', ghEl) : null;
  }

  /** What is stored and how to delete it. */
  function dataSection(s) {
    if (s?.status === 'signed-in') {
      return section(
        'data',
        'Your data',
        h('p.hint-text', {}, 'Signing out removes your progress from this device; it stays in your account, quiz included.'),
        h('p.hint-text', {}, 'To delete your account and everything in it, email ', h('a', { href: 'mailto:LeetForBerger@gmail.com' }, 'LeetForBerger@gmail.com'), ' from the address you signed in with. ', h('a', { href: 'privacy.html' }, 'Privacy Policy')),
      );
    }
    return section(
      'data',
      'Your data',
      h('p.hint-text', {}, 'Your progress, drafts, quiz results and last sessions are kept in this browser only. ', h('a', { href: 'privacy.html' }, 'Privacy Policy')),
      h('div.profile-links', {}, h('button.btn.btn-secondary.btn-sm.profile-delete', { type: 'button', onClick: deleteLocal }, 'Delete progress on this device')),
    );
  }

  async function signOut() {
    const ok = await confirmDialog({ title: 'Sign out?', body: 'Your progress stays in your account and is removed from this device.', confirmLabel: 'Sign out', danger: true });
    if (!ok || (await account.signOut())) return;
    if (!account.get().user) return;
    const anyway = await confirmDialog({ title: 'Sign out without saving?', body: 'Your latest progress could not be saved to your account. Signing out now removes it from this device.', confirmLabel: 'Sign out anyway', danger: true });
    if (anyway) await account.signOut({ force: true });
  }

  async function deleteLocal() {
    const ok = await confirmDialog({ title: 'Delete progress on this device?', body: 'Solved problems, streaks, drafts, quiz results and last sessions are removed from this browser. This cannot be undone.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    // The same order as signing out: the store is emptied first, so nothing writes it back.
    store.reset?.();
    clearUserData();
    toast('Progress deleted from this device', 'success');
    draw();
  }

  function draw() {
    if (disposed) return;
    const s = account?.get?.() ?? null;
    const signedIn = s?.status === 'signed-in';
    mount(
      root,
      h(
        'div.page.page-narrow.profile-page',
        {},
        h('header.page-head', {}, h('div', {}, h('span.eyebrow', {}, 'Account and settings'), h('h1', {}, 'Profile'))),
        identity(s),
        progressSection(signedIn),
        nicknameSection(s),
        appearance,
        preferencesSection(),
        remindersSection(),
        githubBlock(s),
        dataSection(s),
        siteFooter(),
      ),
    );
  }

  draw();
  // A redraw while the nickname is being typed would drop what was typed: those wait.
  const redraw = () => {
    if (!editing) draw();
  };
  const offAccount = account?.subscribe?.(() => {
    if (account.get().status !== 'signed-in') {
      nicknameFor = null;
      editing = false;
    }
    redraw();
  }) ?? (() => {});
  const offGithub = github?.subscribe?.(redraw) ?? (() => {});
  const offStore = store.subscribe(redraw);
  return () => {
    disposed = true;
    pushPanel?.destroy();
    themes.abort();
    offAccount();
    offGithub();
    offStore();
  };
}
