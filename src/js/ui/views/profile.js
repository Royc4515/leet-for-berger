/**
 * Profile (#/me, owner's request): who you are signed in as, where you stand, and every account
 * setting in one place: the leaderboard nickname, the themes, the quiz language, the page guides,
 * the reminders, GitHub sync, signing out and your data. Works signed out too, for the progress kept in this browser.
 */
import { h, mount, segmented, confirmDialog, toast, tp, siteLang, pageLang } from '../dom.js';
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
const SYNC_TEXT_HE = { idle: '', syncing: 'מסנכרן את ההתקדמות…', synced: 'ההתקדמות סונכרנה לחשבון', error: 'הסנכרון נכשל. ההתקדמות שמורה במכשיר הזה ותסונכרן שוב בפתרון הבא.' };
const LANG_KEY = 'lfb:quiz-lang';
/** Rest day choices, Sunday first as the Israeli week; the value is getDay(), or 'none'. */
const REST_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const REST_DAYS_HE = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
/** What each reminder kind is called on its switch (data/notifications.js NOTIFICATION_KINDS). */
const REMINDER_LABELS = { streak: 'Coding streak', 'quiz-streak': 'Daily quiz streak', away: 'Welcome back after a few days away', unfinished: 'Problems you left unfinished', restart: 'Start a new streak after a break' };
const REMINDER_LABELS_HE = { streak: 'רצף הקוד', 'quiz-streak': 'רצף החידון היומי', away: 'חזרה אחרי כמה ימים של הפסקה', unfinished: 'בעיות שנשארו באמצע', restart: 'רצף חדש אחרי הפסקה' };

const readLang = () => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    // Never chosen: the quiz shows its questions in the site language (ui/views/quiz.js).
    return saved === 'he' || saved === 'en' ? saved : siteLang();
  } catch {
    return siteLang();
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
      const who = s.user.name ?? s.user.email ?? tp('Signed in', 'חשבון מחובר');
      const sync = tp(SYNC_TEXT, SYNC_TEXT_HE)[s.sync] ?? '';
      return h(
        'section.profile-id',
        { 'aria-label': tp('Account', 'חשבון') },
        h('span.profile-avatar', { 'aria-hidden': 'true' }, userInitials(s.user)),
        h(
          'div.profile-id-copy',
          {},
          h('strong.profile-name', { dir: 'auto' }, who),
          s.user.name && s.user.email ? h('span.hint-text', {}, s.user.email) : null,
          sync ? h(`span.profile-sync${s.sync === 'error' ? '.bad' : s.sync === 'synced' ? '.ok' : ''}`, {}, sync) : null,
        ),
        h('div.profile-id-actions', {}, h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: signOut }, tp('Sign out', 'להתנתק'))),
      );
    }
    if (accounts) {
      return h(
        'section.profile-id',
        { 'aria-label': tp('Account', 'חשבון') },
        h('span.profile-avatar.is-guest', { 'aria-hidden': 'true' }),
        h(
          'div.profile-id-copy',
          {},
          h('strong.profile-name', {}, tp('Not signed in', 'אין חיבור לחשבון')),
          h('span.hint-text', {}, tp('Your progress is saved in this browser only. Sign in to keep it on every device and join the daily quiz leaderboard.', 'ההתקדמות נשמרת רק בדפדפן הזה. אחרי התחברות היא נשמרת בכל מכשיר, ואפשר להצטרף לטבלת המובילים של החידון היומי.')),
        ),
        h(
          'div.profile-id-actions',
          {},
          h('button.btn.btn-primary.btn-sm', { type: 'button', onClick: () => account.signIn('google') }, tp('Continue with Google', 'להמשיך עם Google')),
          h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => account.signIn('github') }, tp('Continue with GitHub', 'להמשיך עם GitHub')),
        ),
      );
    }
    return h(
      'section.profile-id',
      { 'aria-label': tp('Account', 'חשבון') },
      h('span.profile-avatar.is-guest', { 'aria-hidden': 'true' }),
      h(
        'div.profile-id-copy',
        {},
        h('strong.profile-name', {}, tp('Your progress', 'ההתקדמות שלך')),
        h('span.hint-text', {}, tp('Accounts are not set up on this copy of the site, so your progress is saved in this browser.', 'בעותק הזה של האתר אין חשבונות, ולכן ההתקדמות נשמרת בדפדפן הזה.')),
      ),
    );
  }

  /** The numbers, the last interview and race, and where to see more. */
  function progressSection(signedIn) {
    const n = profileNumbers({ progress: store.get(), quiz: loadQuizProgress(), now: new Date() });
    const last = readLast();
    const interview = formatLastInterview(last.interview, pageLang());
    const battle = formatLastBattle(last.battle, pageLang());
    const cell = (value, label) => h('div.stat-cell', {}, h('div.stat-value', {}, value), h('div.stat-label', {}, label));
    const days = (d) => tp(`${d} ${d === 1 ? 'day' : 'days'}`, d === 1 ? 'יום אחד' : `${d} ימים`);
    return section(
      'progress',
      tp('Your progress', 'ההתקדמות שלך'),
      h(
        'div.stats-row.profile-stats',
        {},
        cell(`${n.solved}`, tp('Solved', 'נפתרו')),
        cell(days(n.streak), tp('Coding streak', 'רצף קוד')),
        cell(n.accuracy == null ? '-' : `${n.accuracy}%`, tp('Accuracy', 'דיוק')),
        cell(days(n.quizStreak), tp('Quiz streak', 'רצף חידון')),
      ),
      h(
        'ul.profile-facts',
        {},
        h(
          'li',
          {},
          tp(
            `${n.submissions} ${n.submissions === 1 ? 'submission' : 'submissions'}, ${n.quizDays} daily ${n.quizDays === 1 ? 'quiz' : 'quizzes'}, ${n.quizAnswered} quiz ${n.quizAnswered === 1 ? 'question' : 'questions'} answered`,
            `${n.submissions === 1 ? 'הגשה אחת' : `${n.submissions} הגשות`}, ${n.quizDays === 1 ? 'חידון יומי אחד' : `${n.quizDays} חידונים יומיים`}, ${n.quizAnswered === 1 ? 'שאלת חידון אחת שנענתה' : `${n.quizAnswered} שאלות חידון שנענו`}`,
          ),
        ),
        interview ? h('li', {}, interview.text) : null,
        battle ? h('li', {}, battle.text) : null,
      ),
      signedIn ? h('p.hint-text', {}, tp('Problems, streaks and quiz progress sync to your account, so they are the same on every device.', 'הבעיות, הרצפים וההתקדמות בחידון מסונכרנים לחשבון, ולכן הם זהים בכל מכשיר.')) : null,
      h(
        'div.profile-links',
        {},
        h('a.btn.btn-ghost.btn-sm', { href: '#/daily' }, tp('Calendar', 'לוח שנה')),
        h('a.btn.btn-ghost.btn-sm', { href: '#/map' }, tp('Map', 'מפה')),
        h('a.btn.btn-ghost.btn-sm', { href: '#/quiz' }, tp('Quiz topics', 'נושאי החידון')),
      ),
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
    if (nickname.state === 'loading' || nickname.state === 'idle') body = h('p.hint-text', {}, tp('Loading your leaderboard name...', 'טוען את השם בטבלת המובילים…'));
    else if (nickname.state === 'error') body = h('p.hint-text', {}, tp('The leaderboard is unavailable right now, so the name cannot be changed. Try again later.', 'טבלת המובילים לא זמינה כרגע, ולכן אי אפשר לשנות את השם. כדאי לנסות שוב מאוחר יותר.'));
    else if (!editing) {
      body = h(
        'div.profile-row',
        {},
        h('span', {}, tp('Shown as ', 'מוצג בשם '), h('strong', { dir: 'auto' }, nickname.name), nickname.custom ? null : h('span.hint-text', {}, tp(' (your account name)', ' (השם בחשבון)'))),
        h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => { editing = true; draw(); queueMicrotask(() => root.querySelector('#profile-nickname-input')?.focus()); } }, tp('Change', 'לשנות')),
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
              toast(tp(`Use ${NICKNAME_MIN} to ${NICKNAME_MAX} characters.`, `צריך ${NICKNAME_MIN} עד ${NICKNAME_MAX} תווים.`), 'error');
              input.focus();
              return;
            }
            saveNickname(name);
          },
        },
        h('label.quiz-label', { for: 'profile-nickname-input' }, tp('Nickname', 'כינוי')),
        input,
        h(
          'p.hint-text#profile-nickname-hint',
          {},
          tp(
            `${NICKNAME_MIN} to ${NICKNAME_MAX} characters. Everyone on the leaderboard sees it. Leave it empty to use your account name.`,
            `${NICKNAME_MIN} עד ${NICKNAME_MAX} תווים. כל מי שבטבלת המובילים רואה אותו. אפשר להשאיר ריק כדי להשתמש בשם שבחשבון.`,
          ),
        ),
        h('div.profile-links', {}, h('button.btn.btn-primary.btn-sm', { type: 'submit' }, tp('Save', 'לשמור')), h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: () => { editing = false; draw(); } }, tp('Cancel', 'ביטול'))),
      );
    }
    return section('nickname', tp('Leaderboard name', 'השם בטבלת המובילים'), body);
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
      toast(tp('Name saved', 'השם נשמר'), 'success');
    } catch {
      toast(tp('Could not save the name. Try again.', 'לא ניתן לשמור את השם. כדאי לנסות שוב.'), 'error');
    }
    draw();
  }

  /** Device preferences: the site and code themes. Built once: a redraw keeps the same controls. */
  const themes = new AbortController();
  const codeSelect = codeThemeSelect(themes.signal);
  codeSelect.id = 'profile-code-theme';
  const appearance = section(
    'appearance',
    tp('Appearance', 'מראה'),
    h('div.profile-field', {}, h('span.quiz-label', {}, tp('Site theme', 'מראה האתר')), siteThemeControl(themes.signal), h('p.hint-text', {}, tp('System follows your device.', '"לפי המערכת" פועל לפי הגדרות המכשיר.'))),
    h('div.profile-field', {}, h('label.quiz-label', { for: codeSelect.id }, tp('Code theme', 'צבעי הקוד')), codeSelect, h('p.hint-text', {}, tp('The editor\'s colours. Match site follows the site theme.', 'הצבעים של עורך הקוד. "כמו האתר" פועל לפי מראה האתר.'))),
    // The site language (lang-boot.js): each option in its own language, so anyone can find theirs.
    globalThis.lfbLang
      ? h(
          'div.profile-field',
          {},
          h('span.quiz-label', {}, tp('Language / שפה', 'שפה')),
          segmented({ label: tp('Language', 'שפה'), options: globalThis.lfbLang.options, value: globalThis.lfbLang.current(), onChange: (v) => globalThis.lfbLang.set(v) }),
          h('p.hint-text', {}, tp('The problems and the problem screen stay in English, as in an interview.', 'הבעיות ומסך הבעיה נשארים באנגלית, כמו בראיון.')),
        )
      : null,
  );

  /**
   * The streak rest day (owner's decision): a day off on it never breaks either streak. Part of the
   * progress record, so it follows the account. Built once: choosing redraws the page through the
   * store, and a rebuilt select would drop keyboard focus.
   */
  const restSelect = h(
    'select.select#profile-rest-day',
    {},
    REST_DAYS.map((name, day) => h('option', { value: String(day) }, tp(day === 6 ? `${name} (default)` : name, day === 6 ? `${REST_DAYS_HE[day]} (ברירת מחדל)` : REST_DAYS_HE[day]))),
    h('option', { value: 'none' }, tp('No rest day', 'בלי יום מנוחה')),
  );
  restSelect.addEventListener('change', () => {
    const day = restSelect.value === 'none' ? null : Number(restSelect.value);
    store.update((s) => setRestDay(s, day, new Date()));
    toast(day === null ? tp('Every day now counts for your streaks', 'מעכשיו כל יום נספר ברצפים') : tp(`Your streaks rest on ${REST_DAYS[day]}`, `הרצפים נחים ב${REST_DAYS_HE[day]}`), 'success');
    restSelect.focus({ preventScroll: true });
  });
  const restField = h(
    'div.profile-field',
    {},
    h('label.quiz-label', { for: restSelect.id }, tp('Streak rest day', 'יום מנוחה מהרצף')),
    restSelect,
    h('p.hint-text', {}, tp('A day off on it never breaks your coding or quiz streak, and practice on it still counts.', 'הפסקה ביום הזה לא שוברת את רצף הקוד או את רצף החידון, ותרגול בו עדיין נספר.')),
  );

  /** Device preferences: the quiz language and the page guides; the streak rest day. */
  function preferencesSection() {
    const rest = restDayOf(store.get());
    restSelect.value = rest === null ? 'none' : String(rest);
    return section(
      'preferences',
      tp('Preferences', 'העדפות'),
      h(
        'div.profile-field',
        {},
        h('span.quiz-label', {}, tp('Quiz language', 'שפת החידון')),
        segmented({
          label: tp('Quiz language', 'שפת החידון'),
          options: [{ value: 'en', label: 'English' }, { value: 'he', label: 'עברית' }],
          value: readLang(),
          onChange: (v) => {
            try {
              localStorage.setItem(LANG_KEY, v);
            } catch {
              /* storage blocked: the quiz page asks again */
            }
            toast(v === 'he' ? tp('Quizzes will be in Hebrew', 'החידונים יהיו בעברית') : tp('Quizzes will be in English', 'החידונים יהיו באנגלית'), 'success');
          },
        }),
        h('p.hint-text', {}, tp('Shared links are written in this language too.', 'גם קישורים לשיתוף נכתבים בשפה הזו.')),
      ),
      h(
        'div.profile-field',
        {},
        h('span.quiz-label', {}, tp('Page guides', 'הדרכות בעמודים')),
        h(
          'div.profile-row',
          {},
          h('span.hint-text', {}, tp('Each page shows a short guide on your first visit.', 'בביקור הראשון בכל עמוד מוצגת הדרכה קצרה.')),
          h('button.btn.btn-secondary.btn-sm', { type: 'button', onClick: () => { saveSeen({}); toast(tp('Guides will show again on each page', 'ההדרכות יוצגו שוב בכל עמוד'), 'success'); } }, tp('Show them again', 'להציג אותן שוב')),
        ),
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
      return h('label.switch', { for: input.id }, input, h('span', {}, tp(REMINDER_LABELS[kind], REMINDER_LABELS_HE[kind])));
    });
    return section(
      'reminders',
      tp('Reminders', 'תזכורות'),
      h(
        'p.hint-text',
        {},
        pushPanel
          ? tp(
              'A streak that ends tonight, the daily quiz, a problem you left. The bell in the header shows them while the site is open; notifications reach your devices when it is closed.',
              'רצף שמסתיים הלילה, החידון היומי, בעיה שנשארה באמצע. הפעמון בכותרת מציג אותן כשהאתר פתוח; ההתראות מגיעות למכשירים גם כשהוא סגור.',
            )
          : tp(
              'The bell in the header lists what needs you: a streak that ends tonight, the daily quiz, a problem you left. Only while this site is open.',
              'הפעמון בכותרת מציג מה מחכה: רצף שמסתיים הלילה, החידון היומי, בעיה שנשארה באמצע. רק כשהאתר פתוח.',
            ),
      ),
      pushPanel?.el,
      h('div.profile-field.push-kinds', {}, h('h3.push-sub', {}, tp('What to remind you about', 'על מה להזכיר')), h('div.profile-switches', {}, switches)),
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
    return ghEl ? section('github', tp('GitHub sync', 'סנכרון GitHub'), ghEl) : null;
  }

  /** What is stored and how to delete it. */
  function dataSection(s) {
    if (s?.status === 'signed-in') {
      return section(
        'data',
        tp('Your data', 'הנתונים שלך'),
        h('p.hint-text', {}, tp('Signing out removes your progress from this device; it stays in your account, quiz included.', 'התנתקות מוחקת את ההתקדמות מהמכשיר הזה; היא נשארת בחשבון, כולל החידון.')),
        h(
          'p.hint-text',
          {},
          tp('To delete your account and everything in it, email ', 'כדי למחוק את החשבון וכל מה שבו, אפשר לשלוח מייל אל '),
          h('a', { href: 'mailto:LeetForBerger@gmail.com' }, 'LeetForBerger@gmail.com'),
          tp(' from the address you signed in with. ', ' מהכתובת שאיתה התחברת. '),
          h('a', { href: 'privacy.html' }, tp('Privacy Policy', 'מדיניות הפרטיות')),
        ),
      );
    }
    return section(
      'data',
      tp('Your data', 'הנתונים שלך'),
      h(
        'p.hint-text',
        {},
        tp('Your progress, drafts, quiz results and last sessions are kept in this browser only. ', 'ההתקדמות, הטיוטות, תוצאות החידון והאימונים האחרונים נשמרים רק בדפדפן הזה. '),
        h('a', { href: 'privacy.html' }, tp('Privacy Policy', 'מדיניות הפרטיות')),
      ),
      h('div.profile-links', {}, h('button.btn.btn-secondary.btn-sm.profile-delete', { type: 'button', onClick: deleteLocal }, tp('Delete progress on this device', 'למחוק את ההתקדמות במכשיר הזה'))),
    );
  }

  async function signOut() {
    const ok = await confirmDialog({
      title: tp('Sign out?', 'להתנתק?'),
      body: tp('Your progress stays in your account and is removed from this device.', 'ההתקדמות נשארת בחשבון ונמחקת מהמכשיר הזה.'),
      confirmLabel: tp('Sign out', 'להתנתק'),
      danger: true,
    });
    if (!ok || (await account.signOut())) return;
    if (!account.get().user) return;
    const anyway = await confirmDialog({
      title: tp('Sign out without saving?', 'להתנתק בלי לשמור?'),
      body: tp('Your latest progress could not be saved to your account. Signing out now removes it from this device.', 'לא ניתן היה לשמור בחשבון את ההתקדמות האחרונה. התנתקות עכשיו תמחק אותה מהמכשיר הזה.'),
      confirmLabel: tp('Sign out anyway', 'להתנתק בכל זאת'),
      danger: true,
    });
    if (anyway) await account.signOut({ force: true });
  }

  async function deleteLocal() {
    const ok = await confirmDialog({
      title: tp('Delete progress on this device?', 'למחוק את ההתקדמות במכשיר הזה?'),
      body: tp(
        'Solved problems, streaks, drafts, quiz results and last sessions are removed from this browser. This cannot be undone.',
        'בעיות שנפתרו, רצפים, טיוטות, תוצאות החידון והאימונים האחרונים יימחקו מהדפדפן הזה. אי אפשר לבטל את זה.',
      ),
      confirmLabel: tp('Delete', 'למחוק'),
      danger: true,
    });
    if (!ok) return;
    // The same order as signing out: the store is emptied first, so nothing writes it back.
    store.reset?.();
    clearUserData();
    toast(tp('Progress deleted from this device', 'ההתקדמות נמחקה מהמכשיר הזה'), 'success');
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
        h('header.page-head', {}, h('div', {}, h('span.eyebrow', {}, tp('Account and settings', 'חשבון והגדרות')), h('h1', {}, tp('Profile', 'פרופיל')))),
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
