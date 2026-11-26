/**
 * Notifications on this device (stage F7 step 3, part C, ADR 0011): in the Reminders section of
 * #/me, the switch that subscribes this browser, the hours the reminders come at, and, on an iPhone
 * in Safari, the three-step Home Screen guide.
 *
 * Built once per visit and updated in place: the profile page redraws on every sync, and a rebuilt
 * switch or hour button would drop keyboard focus and a half-finished choice.
 */
import { h, toast, tp, pageLang } from './dom.js';
import { createPushClient } from '../auth/push-client.js';
import { describeHours, suggestHour, MAX_PUSH_HOURS, WEEKDAYS_HE } from '../data/push-device.js';
import { createClockDial } from './clock-dial.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Line icons on a 24 grid, drawn in currentColor. */
const ICONS = {
  bell: ['M12 3.5a5 5 0 0 0-5 5v3.2l-1.8 3.3h13.6L17 11.7V8.5a5 5 0 0 0-5-5Z', 'M10 18.5a2 2 0 0 0 4 0'],
  // Safari's Share: a box with an arrow up out of it.
  share: ['M12 3.5v11', 'M8.5 7 12 3.5 15.5 7', 'M8 10.5H6.5a1.5 1.5 0 0 0-1.5 1.5v7a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16'],
  // Add to Home Screen: a plus in a rounded square.
  add: ['M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4Z', 'M12 8.5v7', 'M8.5 12h7'],
};
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * @param {keyof typeof ICONS} name
 * @param {string} [cls]
 * @returns {SVGSVGElement} decorative: the text beside it says what it is
 */
function icon(name, cls = 'push-icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: cls })) svg.setAttribute(k, v);
  for (const d of ICONS[name]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/** Hours are saved a moment after the last change, so moving a hex three hours is one request, not three. */
const SAVE_AFTER_MS = 700;

/**
 * @param {{
 *   account: any,
 *   restDay: () => number|null,
 *   offKinds: () => string[],
 *   onServerKinds: (off: string[]) => void,
 *   client?: ReturnType<typeof createPushClient>,
 * }} opts `restDay`: the user's streak rest day (no reminders on it); `offKinds`: the reminder kinds turned off on this page; `onServerKinds`: the account's
 *   kinds, adopted by the page's switches when reminders already reach a device
 * @returns {{ el: HTMLElement, kindsChanged: () => void, destroy: () => void }|null} null when this
 *   site has no accounts (reminders on a device follow an account)
 */
export function createPushPanel({ account, restDay, offKinds, onServerKinds, client = account?.config?.enabled ? createPushClient({ account }) : null }) {
  if (!client) return null;
  const support = client.support();
  let disposed = false;
  /** on: this device has a subscription the server knows; view: the account's settings (GET /settings). */
  let st = { checked: false, on: false, busy: false, view: null, guide: false, saved: '' };
  let savedHours = null;
  let saveTimer = 0;
  const signedIn = () => account.get()?.status === 'signed-in';

  /* ---------- The device card ---------- */
  const statusId = 'push-device-status';
  const status = h('p.push-device-status', { id: statusId });
  const input = h('input', { type: 'checkbox', role: 'switch', id: 'push-device-switch', 'aria-describedby': statusId });
  const guideId = 'push-guide';
  const howButton = h('button.btn.btn-secondary.btn-sm.push-how', { type: 'button', 'aria-expanded': 'false', 'aria-controls': guideId }, tp('Show me how', 'להראות איך'));
  const control = support === 'install' ? howButton : support === 'ready' ? h('label.switch.switch-lg.push-switch', { for: input.id }, input, h('span.sr-only', {}, tp('Notifications on this device', 'התראות במכשיר הזה'))) : null;
  // A test push the whole way (server, push service, this device), for "is it working?" later on.
  const testButton = h('button.btn.btn-ghost.btn-sm.push-test', { type: 'button', hidden: true }, tp('Send a test', 'לשלוח בדיקה'));
  const card = h(`div.push-device${support === 'install' ? '.has-button' : ''}`, {}, h('span.push-device-icon', { 'aria-hidden': 'true' }, icon('bell')), h('span.push-device-title', {}, tp('Notifications on this device', 'התראות במכשיר הזה')), status, control, testButton);

  /* ---------- The iPhone guide: three taps, one screen, where the button is ---------- */
  const step = (n, art, title, line) => h('li.push-step', {}, h('span.push-step-num', { 'aria-hidden': 'true' }, String(n)), h('span.push-step-art', { 'aria-hidden': 'true' }, art), h('span.push-step-copy', {}, h('strong', {}, title), h('span', {}, line)));
  const guide = h(
    'div.push-guide',
    { id: guideId, hidden: true, role: 'region', 'aria-labelledby': 'push-guide-title' },
    h('h3.push-guide-title#push-guide-title', {}, tp('Get reminders on your iPhone or iPad', 'תזכורות ב-iPhone או ב-iPad')),
    h(
      'ol.push-steps',
      {},
      // iOS 16.4 to 18 show Share in the toolbar, iOS 26 under the three dots, Chrome in the address bar.
      step(1, icon('share', 'push-step-icon'), tp('Tap Share', 'ללחוץ על "שיתוף" (Share)'), tp('The square with an arrow, in the toolbar or the address bar. Not there? Tap the three dots first.', 'הריבוע עם החץ, בסרגל הכלים או בשורת הכתובת. לא מופיע? קודם ללחוץ על שלוש הנקודות.')),
      step(2, icon('add', 'push-step-icon'), tp('Tap Add to Home Screen', 'ללחוץ על "הוספה למסך הבית" (Add to Home Screen)'), tp('Scroll the list down if you do not see it, then tap Add.', 'אם זה לא מופיע, לגלול את הרשימה למטה, ואז ללחוץ על "הוספה" (Add).')),
      step(3, h('img.push-step-app', { src: 'src/brand/apple-touch-icon.png', alt: '', width: 40, height: 40 }), tp('Open Leet Berger from your Home Screen', 'לפתוח את Leet Berger ממסך הבית'), tp('Sign in there and turn on notifications on this page.', 'להתחבר שם ולהפעיל התראות בעמוד הזה.')),
    ),
    h('div.push-guide-foot', {}, h('span.hint-text', {}, tp('You do this once. It takes under a minute.', 'עושים את זה פעם אחת. זה לוקח פחות מדקה.')), h('button.btn.btn-ghost.btn-sm', { type: 'button', onClick: () => setGuide(false) }, tp('Close', 'לסגור'))),
  );
  function setGuide(open) {
    st.guide = open;
    guide.hidden = !open;
    howButton.setAttribute('aria-expanded', String(open));
    howButton.textContent = open ? tp('Hide the steps', 'להסתיר את השלבים') : tp('Show me how', 'להראות איך');
    if (!open) howButton.focus({ preventScroll: true });
  }
  howButton.addEventListener('click', () => setGuide(!st.guide));

  /* ---------- The hours: the reminder clock ---------- */
  const summary = h('span.push-hours-summary');
  const saved = h('span.push-saved');
  const dialHost = h('div.push-dial-host');
  const addButton = h('button.btn.btn-secondary.btn-sm.push-add', { type: 'button', onClick: () => dial?.add(suggestHour(st.view.hours)) }, tp('Add a reminder', 'להוסיף תזכורת'));
  const howTo = h('p.hint-text.push-howto', {}, tp('Drag a hex round the clock to move it; past the 6 at the bottom, day turns to night. Tap an hour to add one; tap a hex, then Remove, to take it off.', 'גוררים משושה סביב השעון כדי להזיז אותו; אחרי ה-6 בתחתית, היום מתחלף בלילה. לחיצה על שעה מוסיפה תזכורת; לחיצה על משושה ואז על "להסיר" מורידה אותה.'));
  const hoursHint = h('p.hint-text.push-hours-hint');
  const hours = h(
    'div.push-hours',
    { hidden: true },
    h('div.push-hours-head', {}, h('h3.push-sub', {}, tp('When', 'מתי')), h('p.push-hours-line', { 'aria-live': 'polite' }, summary, saved)),
    h('div.push-hours-body', {}, dialHost, h('div.push-hours-side', {}, howTo, hoursHint, addButton)),
  );
  /** @type {ReturnType<typeof createClockDial>|null} made the first time the hours show */
  let dial = null;
  // Removing the last hex from the dial's centre leaves no hex to focus: the add button takes it.
  hours.addEventListener('dial:empty', () => addButton.focus({ preventScroll: true }));
  function showDial() {
    if (dial) return;
    dial = createClockDial({
      hours: st.view.hours,
      now: () => new Date(),
      restDay,
      onChange: (next) => {
        st.view = { ...st.view, hours: next };
        st.saved = '';
        update();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveHours, SAVE_AFTER_MS);
      },
      onFull: () => toast(tp(`${MAX_PUSH_HOURS} a day at most. Remove one first.`, `לכל היותר ${MAX_PUSH_HOURS} ביום. צריך להסיר אחת קודם.`), 'warn'),
    });
    dialHost.append(dial.el);
  }
  // The time-now dot and "Next at" follow the clock while the page is open.
  const clock = setInterval(() => dial?.redraw(), 60000);

  const el = h('div.push-panel', {}, card, guide, hours);

  function statusText() {
    const he = pageLang() === 'he';
    if (support === 'install') return he ? 'ב-iPhone וב-iPad ההתראות עובדות אחרי שהאתר נוסף למסך הבית. שלוש לחיצות.' : 'On iPhone and iPad, notifications work once this site is on your Home Screen. Three taps.';
    if (support === 'update') return he ? 'התראות ב-iPhone וב-iPad דורשות iOS 16.4 ומעלה. אחרי עדכון iOS אפשר להפעיל אותן כאן.' : 'Notifications on iPhone and iPad need iOS 16.4 or later. Update iOS, then turn this on.';
    if (support === 'unsupported') return he ? 'הדפדפן הזה לא יכול להציג התראות. Chrome, Edge, Firefox ו-Safari יכולים.' : 'This browser cannot show notifications. Chrome, Edge, Firefox and Safari can.';
    if (!signedIn()) return he ? 'כדי להפעיל, צריך להתחבר. התזכורות עוברות עם החשבון לכל מכשיר שבו הן פועלות.' : 'Sign in to turn this on. Reminders follow your account to each device you turn on.';
    if (st.busy) return st.on ? (he ? 'מכבה…' : 'Turning off...') : he ? 'מפעיל…' : 'Turning on...';
    if (!st.checked) return he ? 'בודק את המכשיר…' : 'Checking this device...';
    const others = (st.view?.devices ?? 0) - (st.on ? 1 : 0);
    const othersHe = others === 1 ? 'במכשיר אחד נוסף' : `ב-${others} מכשירים נוספים`;
    if (st.on) {
      if (he) return `מופעל. התזכורות מגיעות בשעות שמופיעות למטה, גם כשהאתר סגור.${others > 0 ? ` פועל גם ${othersHe}.` : ''}`;
      return `On. Reminders come at your hours below, even when the site is closed.${others > 0 ? ` Also on ${others === 1 ? '1 other device' : `${others} other devices`}.` : ''}`;
    }
    if (client.permission() === 'denied') return he ? 'חסום בדפדפן. צריך לאשר התראות לאתר הזה בהגדרות הדפדפן, ואז להפעיל כאן.' : 'Blocked by your browser. Allow notifications for this site in its settings, then turn this on.';
    if (he) return `מכובה. אפשר להפעיל כדי לקבל כאן תזכורות, גם כשהאתר סגור.${others > 0 ? ` פועל ${othersHe}.` : ''}`;
    return `Off. Turn it on to get reminders here, even when the site is closed.${others > 0 ? ` On for ${others === 1 ? '1 other device' : `${others} other devices`}.` : ''}`;
  }

  /** Brings every part of the panel in line with the state, without rebuilding anything. */
  function update() {
    if (disposed) return;
    card.classList.toggle('is-on', st.on);
    testButton.hidden = !st.on || st.busy;
    status.textContent = statusText();
    input.checked = st.on;
    input.disabled = st.busy || !signedIn() || !st.checked || (!st.on && client.permission() === 'denied');
    el.setAttribute('aria-busy', String(st.busy));
    const shown = signedIn() && Boolean(st.view) && (st.on || st.view.devices > 0);
    hours.hidden = !shown;
    if (!shown) return;
    const picked = st.view.hours;
    const full = picked.length >= MAX_PUSH_HOURS;
    showDial();
    summary.textContent = describeHours(picked, pageLang());
    saved.textContent = st.saved;
    addButton.disabled = full;
    const rest = restDay();
    const zone = st.view.timeZone && st.view.timeZone !== 'UTC' ? st.view.timeZone : client.timeZone();
    hoursHint.textContent = tp(
      `Your time, ${zone}. ${rest === null ? '' : `Nothing on your rest day, ${WEEKDAYS[rest]}. `}${full ? `${MAX_PUSH_HOURS} a day at most.` : `Up to ${MAX_PUSH_HOURS} a day.`}`,
      `לפי השעון שלך, ${zone}. ${rest === null ? '' : `ביום המנוחה (${rest === 6 ? 'שבת' : `יום ${WEEKDAYS_HE[rest]}`}) אין תזכורות. `}${full ? `לכל היותר ${MAX_PUSH_HOURS} ביום.` : `עד ${MAX_PUSH_HOURS} ביום.`}`,
    );
  }

  async function check() {
    const local = await client.isOn();
    const view = signedIn() ? await client.settings().catch(() => null) : null;
    if (disposed) return;
    // A subscription the server does not know gets nothing: shown as off, so turning it on fixes it.
    st = { ...st, checked: true, on: local && (!view || view.devices > 0), view };
    savedHours = view?.hours ?? null;
    if (view) dial?.set(view.hours);
    if (view && view.devices > 0) onServerKinds(view.off);
    update();
  }

  input.addEventListener('change', () => {
    if (input.checked) {
      st.busy = true;
      // don't touch / enable() asks for permission as its first statement: nothing may be awaited
      // between this click and that call, or Safari treats the prompt as unprompted and refuses it.
      const running = client.enable({ ...(st.view ? { hours: st.view.hours } : {}), off: offKinds() });
      update();
      running
        .then((res) => {
          if (res.ok) {
            st.on = true;
            st.view = res.view;
            savedHours = res.view.hours;
            dial?.set(res.view.hours);
            toast(tp('Notifications are on. A test is on its way.', 'ההתראות פועלות. התראת בדיקה בדרך.'), 'success');
            // The first push comes now, not at the next send hour: proof the whole way works.
            client.test().catch(() => {});
          } else if (res.reason === 'denied') toast(tp('Notifications are blocked for this site in your browser', 'הדפדפן חוסם התראות מהאתר הזה'), 'warn');
        })
        .catch((err) => toast(err?.message || tp('Reminders are unavailable right now', 'התזכורות לא זמינות כרגע'), 'error'))
        .finally(() => {
          st.busy = false;
          update();
          input.focus({ preventScroll: true });
        });
      return;
    }
    st.busy = true;
    update();
    client
      .disable()
      .then(() => client.settings().catch(() => st.view))
      .then((view) => {
        st.on = false;
        st.view = view;
        toast(tp('Notifications are off for this device', 'ההתראות כבויות במכשיר הזה'), 'success');
      })
      .finally(() => {
        st.busy = false;
        update();
        input.focus({ preventScroll: true });
      });
  });

  let testing = false;
  testButton.addEventListener('click', () => {
    if (testing) return;
    testing = true;
    client
      .test()
      .then((r) => {
        if (r.sent) toast(tp('Test sent. It should arrive in a few seconds.', 'הבדיקה נשלחה. היא אמורה להגיע בעוד כמה שניות.'), 'success');
        else {
          // The push service no longer knows this device: the server dropped it, so show it off.
          toast(tp('The test did not get through. Turn notifications off and on again.', 'הבדיקה לא הגיעה. כדאי לכבות את ההתראות ולהפעיל אותן שוב.'), 'warn');
          check();
        }
      })
      .catch((err) => toast(err?.message || tp('Could not send a test right now', 'לא הצלחנו לשלוח בדיקה כרגע'), 'error'))
      .finally(() => {
        testing = false;
      });
  });

  async function saveHours() {
    saveTimer = 0;
    const wanted = st.view.hours;
    try {
      const view = await client.save({ hours: wanted });
      savedHours = view.hours;
      if (disposed) return;
      // A newer pick waits for its own save; this one only confirms what it sent.
      if (st.view.hours === wanted) st = { ...st, view, saved: tp('Saved', 'נשמר') };
    } catch (err) {
      if (disposed) return;
      toast(err?.message || tp('Your hours were not saved. Try again.', 'השעות לא נשמרו. כדאי לנסות שוב.'), 'error');
      if (savedHours) {
        st = { ...st, view: { ...st.view, hours: savedHours }, saved: '' };
        dial?.set(savedHours);
      }
    }
    update();
  }

  // The account also changes with every sync; only a different user (a sign-in, a sign-out) is
  // worth asking the server again.
  let userId = account.get()?.user?.id ?? null;
  const offAccount = account.subscribe?.((s) => {
    const next = s?.user?.id ?? null;
    if (next === userId) return update();
    userId = next;
    if (support !== 'ready') return update();
    st = { ...st, checked: false, view: null };
    update();
    check();
  }) ?? (() => {});
  update();
  if (support === 'ready') check();
  else {
    st.checked = true;
    update();
  }

  return {
    el,
    /** The page's reminder kinds changed: they apply to the account's devices too. */
    kindsChanged() {
      if (!signedIn() || !st.view || !(st.on || st.view.devices > 0)) return;
      client.save({ off: offKinds() }).catch(() => toast(tp('Your reminder choices were not saved to your account. Try again.', 'הבחירות בתזכורות לא נשמרו בחשבון. כדאי לנסות שוב.'), 'error'));
    },
    destroy() {
      // Leaving the page right after a pick still saves it.
      if (saveTimer) {
        clearTimeout(saveTimer);
        client.save({ hours: st.view.hours }).catch(() => {});
      }
      disposed = true;
      clearInterval(clock);
      offAccount();
    },
  };
}
