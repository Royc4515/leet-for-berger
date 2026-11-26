/**
 * Site theme, set before the first paint. A classic (non-module) script in the <head> of every
 * page (index.html, privacy.html), so the page never flashes the wrong theme. The one place that
 * turns the saved preference into `data-theme` on <html> (src/css/app.css, "Colour themes");
 * ui/theme.js reads and changes it through `window.lfbTheme`. It also makes the sun/moon button
 * (owner's request): one click switches light and dark. It puts one in every page's header, and
 * `lfbTheme.button()` makes another for the account sheet (ui/account-menu.js).
 *
 * Fires `theme:change` on window (detail: 'dark' | 'light') when the applied theme changes: the
 * user picked another, the system switched while on "System", or another tab saved a new choice.
 * Fires `theme:chosen` (detail: { kind: 'site', from, to }) only when the user makes a choice here.
 */
(() => {
  const KEY = 'lfb:theme';
  // Dark first: Atlas is a graphite map, and the default for anyone who never chose.
  const OPTIONS = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'system', label: 'System' },
  ];
  const systemLight = matchMedia('(prefers-color-scheme: light)');
  const root = document.documentElement;

  // With storage blocked a choice still holds for this page.
  let unsaved = null;

  const get = () => {
    let saved = unsaved;
    try {
      saved = localStorage.getItem(KEY) ?? unsaved;
    } catch {
      /* storage blocked */
    }
    return OPTIONS.some((o) => o.value === saved) ? saved : OPTIONS[0].value;
  };

  // The browser's bar takes the page ground (--bg). Read from the CSS, so it is empty until the
  // stylesheet has loaded: the first sync waits for `load`.
  const syncThemeColor = () => {
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (bg && meta) meta.content = bg;
  };

  // `announce`: a new choice is news even when it lands on the same theme (System on a dark device
  // to Dark), so the controls that show the choice follow it.
  const apply = (announce = false) => {
    const pref = get();
    const theme = pref === 'system' ? (systemLight.matches ? 'light' : 'dark') : pref;
    const changed = root.dataset.theme !== theme;
    if (changed) {
      root.dataset.theme = theme;
      syncThemeColor();
      syncToggle();
    }
    if (changed || announce) dispatchEvent(new CustomEvent('theme:change', { detail: theme }));
  };

  const set = (pref) => {
    // What was on screen before, for `theme:chosen` (ui/theme-quips.js answers a switch with a line).
    const from = root.dataset.theme;
    unsaved = pref;
    try {
      localStorage.setItem(KEY, pref);
    } catch {
      /* storage blocked */
    }
    apply(true);
    dispatchEvent(new CustomEvent('theme:chosen', { detail: { kind: 'site', from, to: pref } }));
  };

  // One click is the opposite of what is on screen, saved as that choice (so it also leaves System).
  const toggle = () => set(root.dataset.theme === 'light' ? 'dark' : 'light');

  // The sun/moon button, made in one place for every spot that shows it: the header (where it has
  // room) and the account sheet (on a narrow phone, app.css). It says what a click does ("Switch to
  // light theme"): as its name and tooltip when it is an icon, as its text in the sheet; the icon
  // follows data-theme in CSS. Not aria-pressed: a pressed ghost button is drawn filled, so it would
  // look different in each theme.
  const ICONS =
    '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>' +
    '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
  const syncButton = (button) => {
    // Read at call time: lang-boot.js runs first, but this file cannot import (a classic script).
    const he = window.lfbLang?.current?.() === 'he';
    const label = root.dataset.theme === 'light' ? (he ? 'מעבר ל-Dark mode' : 'Switch to dark theme') : he ? 'מעבר ל-Light mode' : 'Switch to light theme';
    const text = button.querySelector('.theme-toggle-text');
    if (text) {
      text.textContent = label;
    } else {
      button.setAttribute('aria-label', label);
      button.title = label;
    }
  };
  const syncToggle = () => document.querySelectorAll('.theme-toggle').forEach(syncButton);
  /**
   * @param {{ text?: boolean }} [opts] text: a labelled button (the account sheet), else an icon
   * @returns {HTMLButtonElement}
   */
  const button = ({ text = false } = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = text ? 'btn btn-ghost btn-sm theme-toggle' : 'btn btn-ghost btn-icon btn-sm theme-toggle';
    b.innerHTML = ICONS + (text ? '<span class="theme-toggle-text"></span>' : ''); // constants written here, never user text
    b.addEventListener('click', toggle);
    syncButton(b);
    return b;
  };
  const mountToggle = () => {
    const header = document.querySelector('.header-right');
    if (!header || document.getElementById('theme-toggle')) return;
    const b = button();
    b.id = 'theme-toggle';
    // First in a right-aligned row: it grows to the left, nothing already there moves.
    header.prepend(b);
  };

  window.lfbTheme = { options: OPTIONS, get, set, toggle, button, current: () => root.dataset.theme };
  systemLight.addEventListener('change', () => apply());
  addEventListener('storage', (e) => {
    if (e.key === KEY) apply(true);
  });
  addEventListener('load', syncThemeColor, { once: true });
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mountToggle, { once: true });
  else mountToggle();
  apply();
})();
