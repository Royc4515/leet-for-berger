/**
 * Command palette (Ctrl/Cmd+K): jump to any problem, topic, company or page from anywhere.
 * Loaded on first use, so it costs nothing on first paint (ADR 0008). The ranking lives in
 * data/palette-search.js (pure, unit-tested); this file is only the dialog.
 *
 * ARIA: a modal dialog holding a combobox (the input) that controls a listbox; the active
 * option is announced through aria-activedescendant, and focus stays in the input.
 */
import { h, mount, miniLogo } from './dom.js';
import { searchPalette } from '../data/palette-search.js';
import { availableEntries } from '../problems/index.js';
import { TOPICS } from '../data/taxonomy.js';
import { loadSets, loadCompanyLogos, companyLogo } from '../data/company-loader.js';

const PAGES = [
  { kind: 'page', id: 'problems', label: 'Problems', href: '#/', keywords: 'list dashboard bank' },
  { kind: 'page', id: 'map', label: 'Map', href: '#/map', keywords: 'topics atlas graph' },
  { kind: 'page', id: 'daily', label: 'Daily challenge', href: '#/daily', keywords: 'today calendar streak' },
  { kind: 'page', id: 'path', label: 'Learning path', href: '#/path', keywords: 'route essential next' },
  { kind: 'page', id: 'companies', label: 'Companies', href: '#/companies', keywords: 'israel hiring' },
  { kind: 'page', id: 'interview', label: 'Interview simulator', href: '#/interview', keywords: 'mock oa timed exam' },
  { kind: 'page', id: 'battle', label: 'Battle a bot', href: '#/battle', keywords: 'race versus' },
  { kind: 'page', id: 'quiz', label: 'Quiz', href: '#/quiz', keywords: 'multiple choice questions oop design patterns trivia phone' },
  { kind: 'page', id: 'profile', label: 'Profile', href: '#/me', keywords: 'account settings sign out nickname leaderboard github language data delete' },
  { kind: 'page', id: 'daily-quiz', label: 'Daily quiz', href: '#/quiz/daily', keywords: 'today multiple choice questions' },
  { kind: 'page', id: 'quiz-board', label: 'Quiz leaderboard', href: '#/quiz/board', keywords: 'scoreboard ranking daily weekly streak friends' },
  { kind: 'page', id: 'modes', label: 'Modes', href: '#/modes', keywords: 'practice' },
  // An action, not a page: main.js replays the guide of the page you are on.
  { kind: 'action', id: 'page-guide', label: 'Guide for this page', keywords: 'tour help walkthrough onboarding how explain', run: () => dispatchEvent(new CustomEvent('tour:open', { detail: 'page' })) },
];

const KIND_LABEL = { page: 'Page', action: 'Guide', problem: 'Problem', topic: 'Topic', company: 'Company' };

/** Company entries for search, with their logos; the data loads once, shared with the companies pages. */
const loadCompanies = () =>
  Promise.all([loadSets(), loadCompanyLogos()]).then(([d, logos]) =>
    (d?.companies ?? []).map((c) => ({ kind: 'company', id: c.slug, label: c.name, href: `#/companies/${c.slug}`, hint: c.israel === 'major' ? 'Major in Israel' : '', keywords: (c.aliases ?? []).join(' '), logo: companyLogo(logos, c.slug) })),
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
  const topics = TOPICS.map((t) => ({ kind: 'topic', id: t.id, label: t.title, hint: 'on the map', href: `#/map/${t.id}` }));
  let items = [...PAGES, ...topics, ...problems];
  let results = [];
  let active = 0;

  const input = h('input.palette-input', {
    type: 'text',
    role: 'combobox',
    'aria-expanded': 'true',
    'aria-controls': 'palette-list',
    'aria-autocomplete': 'list',
    'aria-label': 'Jump to a problem, topic, company or page',
    placeholder: 'Jump to a problem, topic, company or page',
    autocomplete: 'off',
    spellcheck: 'false',
  });
  const list = h('ul.palette-list#palette-list', { role: 'listbox', 'aria-label': 'Results' });
  const status = h('p.sr-only', { role: 'status' });
  dialog = h(
    'dialog.palette',
    { 'aria-label': 'Jump to' },
    input,
    list,
    status,
    h('div.palette-foot', { 'aria-hidden': 'true' }, h('span', {}, h('kbd', {}, 'Up'), ' ', h('kbd', {}, 'Down'), ' move'), h('span', {}, h('kbd', {}, 'Enter'), ' open'), h('span', {}, h('kbd', {}, 'Esc'), ' close')),
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
              h('span.palette-kind', {}, KIND_LABEL[item.kind]),
              h('span.palette-label', {}, item.logo ? miniLogo(item.logo) : null, item.label),
              item.hint ? h('span.palette-hint', {}, item.hint) : null,
            ),
          )
        : h('li.palette-empty', { role: 'presentation' }, 'Nothing matches. Try a topic like "graphs" or a company like "Wix".'),
    );
    if (results.length) input.setAttribute('aria-activedescendant', `palette-opt-${active}`);
    else input.removeAttribute('aria-activedescendant');
    status.textContent = `${results.length} ${results.length === 1 ? 'result' : 'results'}`;
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
