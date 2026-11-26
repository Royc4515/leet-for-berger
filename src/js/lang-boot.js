/**
 * Site language, set before the first paint (owner's request: the site in full Hebrew, the problems
 * always in English). A classic (non-module) script in the <head> of every page, beside
 * theme-boot.js, so the page never flashes the wrong language or direction: it sets `lang` and
 * `dir` on <html>. Modules read it through `window.lfbLang` (ui/dom.js `lang()` and `tr()`), which
 * keeps it out of the startup graph.
 *
 * The default follows the device: Hebrew when the browser's first language is Hebrew, else
 * English. A choice (the header switch, Profile, the palette) is saved and reloads the page, so
 * every view, the static header included, is drawn once in the new language.
 *
 * What stays English and left to right whatever the choice: the problem screen and the timed
 * sessions (the exam environment, as in a real interview), code, and the problems themselves. Those
 * views set dir="ltr" lang="en" on their own root.
 */
(() => {
  const KEY = 'lfb:site-lang';
  const OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'he', label: 'עברית' },
  ];
  const root = document.documentElement;

  /** The device's language: Hebrew when the browser puts Hebrew first ('he', 'he-IL', the old 'iw'). */
  const device = () => (/^(he|iw)\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '') ? 'he' : 'en');

  const get = () => {
    let saved = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      /* storage blocked: the device decides */
    }
    return OPTIONS.some((o) => o.value === saved) ? saved : device();
  };

  const apply = (lang) => {
    root.lang = lang;
    root.dir = lang === 'he' ? 'rtl' : 'ltr';
  };

  /**
   * Saves a choice and redraws the page in it.
   * @param {'en'|'he'} lang
   */
  const set = (lang) => {
    if (!OPTIONS.some((o) => o.value === lang)) return;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      return; // storage blocked: a reload would forget the choice, so the device's language stays
    }
    if (lang === root.lang) return;
    apply(lang);
    location.reload();
  };

  /**
   * The language button: says what a click gives, in that language ("עברית" on the English site,
   * "English" on the Hebrew one), so someone who cannot read the current language still finds it.
   * In the header beside the sun/moon; on a narrow phone in the account sheet (app.css), like the theme.
   * @param {{ text?: boolean }} [opts] text: the full word (the sheet); else a short mark
   * @returns {HTMLButtonElement}
   */
  const button = ({ text = false } = {}) => {
    const next = root.lang === 'he' ? OPTIONS[0] : OPTIONS[1];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = text ? 'btn btn-ghost btn-sm lang-toggle' : 'btn btn-ghost btn-sm lang-toggle lang-toggle-short';
    b.lang = next.value;
    b.textContent = text ? next.label : next.value === 'he' ? 'עב' : 'EN';
    // The name says it in the language it switches to, and in this one, for a screen reader on either.
    b.setAttribute('aria-label', next.value === 'he' ? 'עברית (Hebrew)' : 'English (אנגלית)');
    b.title = b.getAttribute('aria-label');
    b.addEventListener('click', () => set(next.value));
    return b;
  };

  const mountToggle = () => {
    const header = document.querySelector('.header-right');
    if (!header || document.getElementById('lang-toggle')) return;
    const b = button();
    b.id = 'lang-toggle';
    header.prepend(b);
  };

  // A page written in one language only (privacy.html, a legal text in English) says so with
  // data-lang-fixed on <html>: it keeps its own lang and dir, and its header keeps no switch.
  const fixed = root.hasAttribute('data-lang-fixed');
  if (!fixed) apply(get());
  window.lfbLang = { options: OPTIONS, get, set, button, current: () => root.lang };
  // Both boot scripts prepend on DOMContentLoaded, this one first: the row reads theme, language, search.
  if (fixed) return;
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mountToggle, { once: true });
  else mountToggle();
})();
