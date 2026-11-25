/**
 * Site and code themes in the page (docs/DESIGN.md "Themes"). The site theme belongs to
 * theme-boot.js, which applies it before the first paint; this module reads and changes it
 * through `window.lfbTheme`, keeps the code theme choice, and builds the controls that change
 * either one (Profile, the workspace toolbar, the command palette). Both are device preferences,
 * not account data (state/user-data.js).
 */
import { h, segmented } from './dom.js';
import { glide } from './motion.js';
import { CODE_THEME_OPTIONS, MATCH_SITE, codeThemeFor, parseCodeThemePref } from '../data/themes.js';

const CODE_KEY = 'lfb:code-theme';
const CHANGE = 'theme:change';

// theme-boot.js runs in the <head> of every page; the stand-in keeps the page working if it was blocked.
const site = globalThis.lfbTheme ?? { options: [], get: () => 'dark', set: () => {}, current: () => 'dark' };

// With storage blocked a choice still holds for this page.
let unsavedCode = null;

/** @returns {string} the saved code theme choice (a CODE_THEME_OPTIONS value) */
export function getCodeThemePref() {
  let saved = unsavedCode;
  try {
    saved = localStorage.getItem(CODE_KEY) ?? unsavedCode;
  } catch {
    /* storage blocked */
  }
  return parseCodeThemePref(saved);
}

/**
 * Saves the code theme choice and tells the page (the editor redraws).
 * @param {string} pref a CODE_THEME_OPTIONS value
 */
export function setCodeThemePref(pref) {
  unsavedCode = parseCodeThemePref(pref);
  try {
    localStorage.setItem(CODE_KEY, unsavedCode);
  } catch {
    /* storage blocked */
  }
  dispatchEvent(new CustomEvent(CHANGE));
}

/**
 * Saves the site theme choice ('dark', 'light' or 'system') and applies it.
 * @param {string} pref
 */
export function setSiteThemePref(pref) {
  site.set(pref);
}

/** @returns {import('../data/themes.js').CodeTheme} the code theme to show now */
export function currentCodeTheme() {
  return codeThemeFor(getCodeThemePref(), site.current() === 'light' ? 'light' : 'dark');
}

/**
 * Calls `cb` whenever the site or code theme changes.
 * @param {() => void} cb
 * @param {AbortSignal} [signal] stops listening when aborted (a view's cleanup)
 */
export function onThemeChange(cb, signal) {
  addEventListener(CHANGE, () => cb(), { signal });
}

/**
 * The site theme as a segmented control (Profile). Follows changes made elsewhere (the palette).
 * @param {AbortSignal} signal
 * @returns {HTMLElement}
 */
export function siteThemeControl(signal) {
  const group = segmented({ label: 'Site theme', options: site.options, value: site.get(), onChange: setSiteThemePref });
  onThemeChange(() => {
    for (const b of group.querySelectorAll('[data-value]')) b.setAttribute('aria-pressed', String(b.dataset.value === site.get()));
    glide(group, '[aria-pressed="true"]');
  }, signal);
  return group;
}

/**
 * The code theme as a select (Profile and the workspace toolbar). Follows changes made elsewhere.
 * @param {AbortSignal} signal
 * @returns {HTMLSelectElement}
 */
export function codeThemeSelect(signal) {
  const select = h(
    'select.select.code-theme-select',
    { 'aria-label': 'Code theme', title: 'Code theme' },
    CODE_THEME_OPTIONS.map((o) => h('option', { value: o.value }, o.label)),
  );
  select.value = getCodeThemePref();
  select.addEventListener('change', () => setCodeThemePref(select.value));
  onThemeChange(() => {
    select.value = getCodeThemePref();
  }, signal);
  return select;
}

/**
 * Command palette entries: one per site theme and one per code theme.
 * @returns {import('../data/palette-search.js').PaletteItem[]}
 */
export function themePaletteItems() {
  return [
    ...site.options.map((o) => ({ kind: 'setting', id: `theme-${o.value}`, label: `Theme: ${o.label}`, keywords: 'appearance mode colors colours site', run: () => setSiteThemePref(o.value) })),
    ...CODE_THEME_OPTIONS.map((o) => ({ kind: 'setting', id: `code-theme-${o.value}`, label: `Code theme: ${o.label}`, keywords: `editor syntax colors colours ${o.value === MATCH_SITE ? 'default' : ''}`.trim(), run: () => setCodeThemePref(o.value) })),
  ];
}
