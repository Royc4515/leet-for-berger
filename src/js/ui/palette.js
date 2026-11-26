/**
 * Command palette (Ctrl/Cmd+K): jump to any problem, topic, company or page from anywhere.
 * Loaded on first use, so it costs nothing on first paint (ADR 0008). The ranking lives in
 * data/palette-search.js (pure, unit-tested); this file is only the dialog.
 *
 * ARIA: a modal dialog holding a combobox (the input) that controls a listbox; the active
 * option is announced through aria-activedescendant, and focus stays in the input.
 */
import { h, mount, miniLogo, tr, siteLang } from './dom.js';
import { searchPalette } from '../data/palette-search.js';
import { authorPaletteItems } from '../data/credit.js';
import { availableEntries } from '../problems/index.js';
import { TOPICS } from '../data/taxonomy.js';
import { loadSets, loadCompanyLogos, companyLogo } from '../data/company-loader.js';
import { themePaletteItems } from './theme.js';

// Built when the palette opens, not at import: the labels follow the site language. Each item keeps
// its English keywords and adds Hebrew search words, so a query in either language finds the page.
const pages = () => [
  { kind: 'page', id: 'problems', label: tr('Problems', 'בעיות'), href: '#/', keywords: 'list dashboard bank בעיות רשימה בית' },
  { kind: 'page', id: 'map', label: tr('Map', 'מפה'), href: '#/map', keywords: 'topics atlas graph מפה נושאים' },
  { kind: 'page', id: 'daily', label: tr('Daily challenge', 'האתגר היומי'), href: '#/daily', keywords: 'today calendar streak אתגר יומי היום לוח שנה רצף' },
  { kind: 'page', id: 'path', label: tr('Learning path', 'מסלול הלמידה'), href: '#/path', keywords: 'route essential next מסלול למידה הבא' },
  { kind: 'page', id: 'companies', label: tr('Companies', 'חברות'), href: '#/companies', keywords: 'israel hiring חברות ישראל גיוס משרות' },
  { kind: 'page', id: 'interview', label: tr('Interview simulator', 'סימולציית ראיון'), href: '#/interview', keywords: 'mock oa timed exam ראיון סימולציה מבחן זמן' },
  { kind: 'page', id: 'battle', label: tr('Battle a bot', 'קרב מול בוט'), href: '#/battle', keywords: 'race versus קרב בוט מרוץ' },
  { kind: 'page', id: 'quiz', label: tr('Quiz', 'חידון'), href: '#/quiz', keywords: 'multiple choice questions oop design patterns trivia phone חידון שאלות אמריקאיות' },
  { kind: 'page', id: 'profile', label: tr('Profile', 'פרופיל'), href: '#/me', keywords: 'account settings sign out nickname leaderboard github language theme appearance data delete פרופיל חשבון הגדרות התנתקות כינוי שפה עברית ערכת נושא מראה נתונים מחיקה' },
  { kind: 'page', id: 'daily-quiz', label: tr('Daily quiz', 'החידון היומי'), href: '#/quiz/daily', keywords: 'today multiple choice questions חידון יומי היום שאלות' },
  { kind: 'page', id: 'quiz-board', label: tr('Quiz leaderboard', 'טבלת המובילים בחידון'), href: '#/quiz/board', keywords: 'scoreboard ranking daily weekly streak friends טבלה מובילים דירוג חברים רצף' },
  { kind: 'page', id: 'modes', label: tr('Modes', 'אימונים'), href: '#/modes', keywords: 'practice אימונים תרגול' },
  // An action, not a page: main.js replays the guide of the page you are on.
  { kind: 'action', id: 'page-guide', label: tr('Guide for this page', 'הדרכה לעמוד הזה'), keywords: 'tour help walkthrough onboarding how explain הדרכה עזרה סיור הסבר', run: () => dispatchEvent(new CustomEvent('tour:open', { detail: 'page' })) },
  ...themePaletteItems(),
  // Who built the site: opens the author's pages in a new tab, never in place of the practice.
  ...authorPaletteItems((href) => window.open(href, '_blank', 'noopener,noreferrer'), siteLang()),
];

const kindLabel = (kind) =>
  tr(
    { page: 'Page', action: 'Guide', setting: 'Setting', link: 'Author', problem: 'Problem', topic: 'Topic', company: 'Company' },
    { page: 'עמוד', action: 'הדרכה', setting: 'הגדרה', link: 'יוצר', problem: 'בעיה', topic: 'נושא', company: 'חברה' },
  )[kind];

/** Company entries for search, with their logos; the data loads once, shared with the companies pages. */
const loadCompanies = () =>
  Promise.all([loadSets(), loadCompanyLogos()]).then(([d, logos]) =>
    (d?.companies ?? []).map((c) => ({ kind: 'company', id: c.slug, label: c.name, href: `#/companies/${c.slug}`, hint: c.israel === 'major' ? tr('Major in Israel', 'מעסיק גדול בישראל') : '', keywords: (c.aliases ?? []).join(' '), logo: companyLogo(logos, c.slug) })),
  );

let dialog = null;

/**
 * Opens the palette (creating it the first time). Escape, a click outside, or choosing an item
 * closes it and returns focus to where it was.
 * @returns {void}
 */
export function openPalette() {
  if (dialog?.open) return;
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const problems = availableEntries().map((e) => ({ kind: 'problem', id: e.id, label: e.title, hint: e.difficulty, href: `#/problem/${e.id}` }));
  const topics = TOPICS.map((t) => ({ kind: 'topic', id: t.id, label: t.title, hint: tr('on the map', 'במפה'), href: `#/map/${t.id}` }));
  const PAGES = pages();
  let items = [...PAGES, ...topics, ...problems];
  let results = [];
  let active = 0;

  const input = h('input.palette-input', {
    type: 'text',
    role: 'combobox',
    'aria-expanded': 'true',
    'aria-controls': 'palette-list',
    'aria-autocomplete': 'list',
    'aria-label': tr('Jump to a problem, topic, company or page', 'מעבר לבעיה, נושא, חברה או עמוד'),
    placeholder: tr('Jump to a problem, topic, company or page', 'מעבר לבעיה, נושא, חברה או עמוד'),
    autocomplete: 'off',
    spellcheck: 'false',
  });
  const list = h('ul.palette-list#palette-list', { role: 'listbox', 'aria-label': tr('Results', 'תוצאות') });
  const status = h('p.sr-only', { role: 'status' });
  dialog = h(
    'dialog.palette',
    { 'aria-label': tr('Jump to', 'מעבר אל') },
    input,
    list,
    status,
    h('div.palette-foot', { 'aria-hidden': 'true' }, h('span', {}, h('kbd', {}, 'Up'), ' ', h('kbd', {}, 'Down'), tr(' move', ' מעבר')), h('span', {}, h('kbd', {}, 'Enter'), tr(' open', ' פתיחה')), h('span', {}, h('kbd', {}, 'Esc'), tr(' close', ' סגירה'))),
  );

  const close = () => {
    if (!dialog) return;
    dialog.close();
    dialog.remove();
    dialog = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };
  const go = (item) => {
    close();
    if (item?.run) item.run();
    else if (item) location.hash = item.href;
  };
  const render = () => {
    results = searchPalette(items, input.value, 9);
    active = Math.min(active, Math.max(0, results.length - 1));
    mount(
      list,
      results.length
        ? results.map((item, i) =>
            h(
              'li.palette-item',
              { role: 'option', id: `palette-opt-${i}`, 'aria-selected': String(i === active), onClick: () => go(item), onMousemove: () => select(i) },
              h('span.palette-kind', {}, kindLabel(item.kind)),
              h('span.palette-label', {}, item.logo ? miniLogo(item.logo) : null, item.label),
              item.hint ? h('span.palette-hint', {}, item.hint) : null,
            ),
          )
        : h('li.palette-empty', { role: 'presentation' }, tr('Nothing matches. Try a topic like "graphs" or a company like "Wix".', 'לא נמצאו תוצאות. אפשר לנסות נושא כמו "graphs" או חברה כמו "Wix".')),
    );
    if (results.length) input.setAttribute('aria-activedescendant', `palette-opt-${active}`);
    else input.removeAttribute('aria-activedescendant');
    status.textContent = tr(`${results.length} ${results.length === 1 ? 'result' : 'results'}`, results.length === 1 ? 'תוצאה אחת' : `${results.length} תוצאות`);
  };
  const select = (i) => {
    if (i === active) return;
    active = i;
    list.querySelectorAll('.palette-item').forEach((el, j) => el.setAttribute('aria-selected', String(j === i)));
    input.setAttribute('aria-activedescendant', `palette-opt-${i}`);
    list.children[i]?.scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('input', () => {
    active = 0;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      select((active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });

  document.body.append(dialog);
  dialog.showModal();
  render();
  input.focus();
  loadCompanies().then((companies) => {
    if (!dialog) return;
    items = [...PAGES, ...topics, ...problems, ...companies];
    render();
  });
}
