/**
 * Code editor themes (owner's request, docs/DESIGN.md "Themes"). The colours live in
 * src/css/app.css as --code-* tokens: Dark Berger and Berger Light are the site's own dark and light
 * palettes, Shuvat Light Pink is a code theme of its own. This module only names the themes and
 * turns the tokens into a Monaco theme.
 *
 * Pure: no DOM; the colours come in through `read`.
 */

/** The choice that follows the site theme. */
export const MATCH_SITE = 'site';

/**
 * @typedef {{ id: string, label: string, scheme: 'dark'|'light', site?: boolean, contrast?: number }} CodeTheme
 * `scheme` is the site palette the theme is drawn on (the editor host's data-theme), which also
 * picks Monaco's base theme; `site` marks the theme that is that palette itself (Match site);
 * `contrast` raises the least contrast its text must reach (default 4.5:1, tests/design-tokens.test.js).
 */

/**
 * Every code theme. The names are easter eggs: the owner's first three, and the rest in their
 * pattern (a dark theme is "X Berger", a light one "Berger X"). Ids never change: they are saved.
 * @type {CodeTheme[]}
 */
export const CODE_THEMES = [
  { id: 'dark-berger', label: 'Dark Berger', scheme: 'dark', site: true },
  { id: 'berger-light', label: 'Berger Light', scheme: 'light', site: true },
  { id: 'shuvat-light-pink', label: 'Shuvat Light Pink', scheme: 'light' },
  { id: 'midnight', label: 'Midnight Berger', scheme: 'dark' },
  { id: 'terminal', label: 'Terminal Berger', scheme: 'dark' },
  { id: 'high-contrast', label: 'High Contrast Berger', scheme: 'dark', contrast: 7 }, // WCAG AAA: the name is a promise
  { id: 'mint-light', label: 'Berger Mint', scheme: 'light' },
];

/** The choices offered: Match site first (the default), then every theme. */
export const CODE_THEME_OPTIONS = [{ value: MATCH_SITE, label: 'Match site' }, ...CODE_THEMES.map((t) => ({ value: t.id, label: t.label }))];

/**
 * A saved choice, or Match site when it is missing or no longer a theme.
 * @param {unknown} raw
 * @returns {string} a CODE_THEME_OPTIONS value
 */
export function parseCodeThemePref(raw) {
  return CODE_THEME_OPTIONS.some((o) => o.value === raw) ? /** @type {string} */ (raw) : MATCH_SITE;
}

/**
 * The code theme to show for a choice on a site theme: Match site is the theme drawn on the site's
 * own palette.
 * @param {string} pref a CODE_THEME_OPTIONS value
 * @param {'dark'|'light'} siteTheme
 * @returns {CodeTheme}
 */
export function codeThemeFor(pref, siteTheme) {
  return CODE_THEMES.find((t) => t.id === pref) ?? CODE_THEMES.find((t) => t.site && t.scheme === siteTheme) ?? CODE_THEMES[0];
}

/** Monaco colour id -> the code token it shows. */
const EDITOR_COLORS = {
  'editor.background': '--code-bg',
  'editor.foreground': '--code-fg',
  'editorGutter.background': '--code-bg',
  'editor.lineHighlightBackground': '--code-line',
  'editor.lineHighlightBorder': '--code-line',
  'editorLineNumber.foreground': '--code-gutter',
  'editorLineNumber.activeForeground': '--code-gutter-active',
  'editorCursor.foreground': '--code-cursor',
  'editor.selectionBackground': '--code-selection',
  'editor.inactiveSelectionBackground': '--code-selection-inactive',
  'editorBracketMatch.background': '--code-bracket-match',
  'editorBracketMatch.border': '--code-bracket-border',
  'editorWidget.background': '--code-widget',
  'editorWidget.border': '--code-widget-border',
  'editorSuggestWidget.background': '--code-widget',
  'editorSuggestWidget.selectedBackground': '--code-widget-selected',
  'editorIndentGuide.background1': '--code-indent',
  'editorIndentGuide.activeBackground1': '--code-indent-active',
  'editorBracketHighlight.foreground1': '--code-bracket-1',
  'editorBracketHighlight.foreground2': '--code-bracket-2',
  'editorBracketHighlight.foreground3': '--code-bracket-3',
};

/** Monaco token -> the code token that colours it. */
const SYNTAX = [
  ['comment', '--code-comment'],
  ['keyword', '--code-keyword'],
  ['string', '--code-string'],
  ['number', '--code-number'],
  ['regexp', '--code-number'],
  ['type', '--code-type'],
  ['type.identifier', '--code-type'],
  ['delimiter', '--code-delimiter'],
  ['identifier', '--code-identifier'],
];

/** Every token a code theme must define (tests/design-tokens.test.js checks each theme has them). */
export const CODE_TOKENS = [...new Set([...Object.values(EDITOR_COLORS), ...SYNTAX.map(([, t]) => t)])];

/**
 * A Monaco theme definition (pinned 0.52.2 API: defineTheme takes #rrggbb colours, and rules take
 * them without the #). Built on vs or vs-dark, so the widgets Monaco draws itself match the scheme.
 * @param {(token: string) => string} read the value of a --code-* token, a #rrggbb colour
 * @param {'dark'|'light'} scheme
 * @returns {{ base: string, inherit: boolean, rules: object[], colors: Record<string, string> }}
 */
export function monacoTheme(read, scheme) {
  const colors = Object.fromEntries(Object.entries(EDITOR_COLORS).map(([id, token]) => [id, read(token)]));
  // The scrollbar is the widget edge at 60% (#rrggbbaa): Monaco has no other way to take an alpha.
  colors['scrollbarSlider.background'] = `${read('--code-widget-border')}99`;
  return {
    base: scheme === 'light' ? 'vs' : 'vs-dark',
    inherit: true,
    rules: SYNTAX.map(([token, name]) => ({ token, foreground: read(name).replace('#', ''), ...(token === 'comment' ? { fontStyle: 'italic' } : {}) })),
    colors,
  };
}
