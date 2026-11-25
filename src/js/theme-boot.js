/**
 * Site theme, set before the first paint. A classic (non-module) script in the <head> of every
 * page (index.html, privacy.html), so the page never flashes the wrong theme. The one place that
 * turns the saved preference into `data-theme` on <html> (src/css/app.css, "Colour themes");
 * ui/theme.js reads and changes it through `window.lfbTheme`.
 *
 * Fires `theme:change` on window (detail: 'dark' | 'light') when the applied theme changes: the
 * user picked another, the system switched while on "System", or another tab saved a new choice.
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
    }
    if (changed || announce) dispatchEvent(new CustomEvent('theme:change', { detail: theme }));
  };

  const set = (pref) => {
    unsaved = pref;
    try {
      localStorage.setItem(KEY, pref);
    } catch {
      /* storage blocked */
    }
    apply(true);
  };

  window.lfbTheme = { options: OPTIONS, get, set, current: () => root.dataset.theme };
  systemLight.addEventListener('change', () => apply());
  addEventListener('storage', (e) => {
    if (e.key === KEY) apply(true);
  });
  addEventListener('load', syncThemeColor, { once: true });
  apply();
})();
